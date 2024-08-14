const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();

app.use(express.static(path.join(__dirname, 'website/src')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3551;

const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

const ServerSchema = new mongoose.Schema({
    name: String,
    url: String,
    userId: mongoose.Schema.Types.ObjectId
});

const LocalServerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    userId: { type: String, required: true }
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
            console.log('No Servers Was Found So Created One');
        } else {
            console.log('Atleast 1 Server Was Found');
        }
    } catch (error) {
        console.error('Error handling server:', error.message);
    }
}

const serverData = {
    name: 'Local Server',
    url: '127.0.0.1',
    userId: '*'  //needs to automatically bind to every user since this is the main server.
};

addServerIfNoneExists(serverData);

app.use(session({
    secret: 'xpanelv1',
    resave: false,
    saveUninitialized: false,
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/');
    }
};

async function connectDB() {
    try {
        await mongoose.connect("mongodb://localhost/xpanel", {
        });
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
});



app.get("/", ( req, res ) => {
    res.sendFile(path.join( __dirname + "/website/src/index.html" ));
    res.sendFile(path.join( __dirname + "/website/src/style.css" ));
    res.sendFile(path.join( __dirname + "/website/src/loginScript/login.js" ));
  });

app.get("/home", ( req, res ) => {
    res.sendFile(path.join( __dirname + "/website/src/pages/Home/index.html" ));
  });

app.get("/addaserver", (req, res) => {
    res.sendFile(path.join(__dirname, 'website/src/pages/AddAServer/index.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    User.findOne({ username }, (err, user) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
        } else if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user._id;
            res.redirect('/home');
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.get('/api/servers', isAuthenticated, (req, res) => {
    Server.find({ userId: req.session.userId }, (err, servers) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
        } else {
            res.json(servers);
        }
    });
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

                newServer.save(err => {
                    if (err) {
                        console.error(err.message);
                        res.status(500).send('Internal server error');
                    } else {
                        res.status(201).json({ message: 'Server added successfully!' });
                    }
                });
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