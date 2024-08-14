const express = require('express');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3551;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

app.get("/", (req, res) => {
    res.status(200).json({
        status: "ok",
    })
});