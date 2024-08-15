const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const os = require("os");
const checkDiskSpace = require('check-disk-space').default;
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.static(path.join(__dirname, 'website/src')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT = process.env.PORT || 3551;
const DRIVE_PATH = process.env.DRIVE_PATH || 'C:/';
const DB_PATH = process.env.DB_PATH || 'mongodb://localhost/xpanel';

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userId: { type: String, required: true, unique: true }
}, { collection: "users" });

const ServerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    userId: { type: String, required: true }
}, { collection: "servers" });

const LocalServerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    userId: [{ type: String, required: true }]
}, { collection: "servers" });

const User = mongoose.model('User', UserSchema);
const Server = mongoose.model('Server', ServerSchema);
const LocalServer = mongoose.model("LocalServer", LocalServerSchema);

async function addServerIfNoneExists(serverData) {
    try {
        let server = await LocalServer.findOne({ url: serverData.url });
        if (!server) {
            server = new LocalServer(serverData);
            await server.save();
            console.log('No server was found, so one was created.');
        } else {
            console.log('At least one server was found.');
        }
    } catch (error) {
        console.error('Error handling server:', error.message);
    }
}

async function getAllUserIds() {
    try {
        const users = await User.find({}, 'userId').exec();
        const userIds = users.map(user => user.userId);
        return userIds;
    } catch (error) {
        console.error('Error fetching user IDs:', error.message);
        return [];
    }
}

(async () => {
    const userIDArray = await getAllUserIds();

    const serverData = {
        name: 'Local Server',
        url: '127.0.0.1',
        userId: userIDArray
    };

    addServerIfNoneExists(serverData);
})();

async function getCPUCores() {
    const cpuCount = os.cpus().length;
    return cpuCount;
}

app.use(session({
    secret: 'xpanelv1',
    resave: false,
    saveUninitialized: false,
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.userId || req.cookies.userId) {
        next();
    } else {
        res.redirect('/');
    }
};

async function connectDB() {
    try {
        await mongoose.connect(DB_PATH);
        const testDB = mongoose.model('connectionTest', { successful: String });
        const testDocument = new testDB({ successful: 'Yes' });
        await testDocument.save();
        console.log('Connected to MongoDB!');
        await testDB.deleteMany({});
    } catch (err) {
        console.log(err);
    }
}

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    connectDB();
    getCPUCores();
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/website/src/index.html"));
});

app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname + "/website/src/pages/Home/index.html"));
});

app.get("/addaserver", (req, res) => {
    res.sendFile(path.join(__dirname, '/website/src/pages/AddAServer/index.html'));
});

app.get("/server/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname + "/website/src/pages/Dashboard/index.html"));
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and Password are required.' });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid Username or Password.' });
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            req.session.userId = user._id;
            res.cookie('userId', user._id.toString(), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid Username or Password.' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error.' });
    }
});

app.post('/api/add-user', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const newUser = new User({
            username: req.body.username,
            password: hashedPassword,
            userId: uuidv4()
        });

        await newUser.save();
        res.status(200).json({ status: "Account created successfully" });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Username already exists' });
        } else {
            res.status(400).json({ message: error.message });
        }
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.get('/api/servers', isAuthenticated, async (req, res) => {
    try {
        const userIdFromCookie = req.cookies.userId;

        if (!userIdFromCookie) {
            return res.status(400).json({ success: false, message: 'User ID not provided' });
        }

        const servers = await Server.find({ userId: userIdFromCookie }).exec();

        if (!servers) {
            return res.status(404).json({ success: false, message: 'No servers found' });
        }

        res.json(servers);
    } catch (err) {
        console.error('Error fetching servers:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/servers', isAuthenticated, async (req, res) => {
    const { ip, code } = req.body;

    if (ip && code) {
        try {
            const response = await axios.get(`http://${ip}:4000/validate/${code}`);
            if (response.status === 200 && response.data.valid) {
                const newServer = new Server({
                    name: response.data.name,
                    url: `http://${ip}:4000`,
                    userId: req.session.userId
                });

                await newServer.save();
                res.status(201).json({ message: 'Server added successfully!' });
            } else {
                res.status(400).json({ message: 'Invalid code or server not reachable!' });
            }
        } catch (error) {
            console.error('Error validating server:', error.message);
            res.status(500).send('Could not validate the server');
        }
    } else {
        res.status(400).json({ message: 'IP address and code are required!' });
    }
});

app.get('/servers/:serverId', isAuthenticated, (req, res) => {
    const serverId = req.params.serverId;

    Server.findOne({ _id: serverId, userId: req.session.userId }, (err, server) => {
        if (err || !server) {
            console.error(err ? err.message : 'Server not found');
            return res.status(404).send('Server not found');
        }

        res.sendFile(__dirname + '/website/src/pages/Dashboard/template.html');
    });
});

app.get('/api/servers/:serverId/metrics', isAuthenticated, async (req, res) => {
    const serverId = req.params.serverId;

    Server.findOne({ _id: serverId, userId: req.session.userId }, async (err, server) => {
        if (err || !server) {
            console.error(err ? err.message : 'Server not found');
            return res.status(404).send('Server not found');
        }

        try {
            const response = await axios.get(`${server.url}/metrics`);
            res.json(response.data);
        } catch (error) {
            console.error('Error fetching metrics from helper app:', error.message);
            res.status(500).send('Could not fetch server metrics');
        }
    });
});



app.get('/api/serverstats/system-stats', async (req, res) => {
    try {
        const startTime = Date.now();
        const startCpuInfo = os.cpus();

        await new Promise(resolve => setTimeout(resolve, 1000));

        const endTime = Date.now();
        const endCpuInfo = os.cpus();
        const elapsedMs = endTime - startTime;

        let idleMs = 0;
        let totalMs = 0;

        for (let i = 0; i < startCpuInfo.length; i++) {
            const startCpu = startCpuInfo[i].times;
            const endCpu = endCpuInfo[i].times;

            const idleTime = endCpu.idle - startCpu.idle;
            const totalTime = (endCpu.user + endCpu.nice + endCpu.sys + endCpu.irq + endCpu.idle) -
                              (startCpu.user + startCpu.nice + startCpu.sys + startCpu.irq + startCpu.idle);

            idleMs += idleTime;
            totalMs += totalTime;
        }

        const cpuUsage = ((totalMs - idleMs) / totalMs) * 100;

        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memUsage = (usedMem / totalMem) * 100;

        const diskSpace = await checkDiskSpace(DRIVE_PATH);
        const { free: freeDisk, size: totalDisk } = diskSpace;
        const usedDisk = totalDisk - freeDisk;
        const diskUsage = (usedDisk / totalDisk) * 100;

        res.json({
            cpu: {
                cores: os.cpus().length,
                usage: cpuUsage.toFixed(2) + '%'
            },
            ram: {
                total: (totalMem / (1024 ** 3)).toFixed(2) + ' GB',
                used: (usedMem / (1024 ** 3)).toFixed(2) + ' GB',
                usage: memUsage.toFixed(2) + '%'
            },
            storage: {
                total: (totalDisk / (1024 ** 3)).toFixed(2) + ' GB',
                used: (usedDisk / (1024 ** 3)).toFixed(2) + ' GB',
                usage: diskUsage.toFixed(2) + '%'
            }
        });
    } catch (error) {
        console.error('Error fetching system stats:', error.message);
        res.status(500).send('Could not fetch system stats');
    }
});
