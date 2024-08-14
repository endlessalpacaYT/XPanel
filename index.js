const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(express.static('website/src'));

const PORT = process.env.PORT || 3551;

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
    res.sendFile(path.join( __dirname + "/website/src/resources/*" ));
  });