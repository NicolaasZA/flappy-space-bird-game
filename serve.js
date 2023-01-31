const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const { PlayerMovePayload, PlayerDiePayload } = require('./public/src/server');

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

app.get('/res', (req, res) => {
    const resourceName = req.query.name ?? '';
    const production = (req.query.prod ?? 'false') == 'true';

    if (resourceName == 'phaser') {
        res.sendFile(
            production
                ? 'node_modules/phaser/dist/phaser-arcade-physics.min.js'
                : 'node_modules/phaser/dist/phaser-arcade-physics.js',
            { root: __dirname }
        );
    } else {
        res.statusCode = 404;
        res.send();
    }
});

// ! CREATE SOCKET SERVER

io.on('connection', (socket) => {
    io.emit('new', socket.id);
    console.log('new', socket.id);

    socket.on('move', (/** @type {PlayerMovePayload} */ payload) => {
        payload.playerId = socket.id;
        io.emit('move', payload);
    });

    socket.on('die', (score) => {
        const payload = new PlayerDiePayload(socket.id, score);
        console.log('die', payload);
        io.emit('die', payload);
    });

    socket.on('disconnect', () => {
        console.log('leave', socket.id);
        io.emit('leave', socket.id);
    });
});

// ! SERVE
const PORT = 80;
server.listen(PORT, () => {
    console.log('start', 'listening on *:' + PORT);
});