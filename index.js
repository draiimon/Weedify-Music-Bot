require('./main');

const path = require('path');
const express = require("express");
const app = express();
const port = 5000;

app.get('/', (req, res) => {
    const imagePath = path.join(__dirname, 'index.html');
    res.sendFile(imagePath);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🔥 Weedify Bot - Listening on port ${port}`);
});
