const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const randX = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

// ! GENERATE STAGE
const stage = [];
let spacing = 400;
let offset = 400;
while (spacing > 0) {
    var x = offset;
    for (let i = 0; i < spacing; i++) {
        x = offset + (spacing * i)
        stage.push({ x, y: randX(200, 500) })
    }
    offset = x;
    spacing -= 30;
}

// ! CREATE WEBSERVER
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.static('public'));

app.get('/stage', (req, res) => {
    res.json(stage);
});

// ! CREATE SOCKET SERVER

io.on('connection', (socket) => {
    io.emit('new', socket.id);
    console.log('new', socket.id);

    socket.on('move', (newLocation) => {
        io.emit('move', { id: socket.id, location: newLocation });

    });

    socket.on('die', (score) => {
        console.log('die', { id: socket.id, score: score });
        io.emit('die', { id: socket.id, score });
    });

    socket.on('disconnect', () => {
        console.log('leave', socket.id);
        io.emit('leave', socket.id);
    })
});

// ! SERVE
const PORT = 80;
server.listen(PORT, () => {
    console.log('start', 'listening on *:' + PORT);
});