const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { PlayerMovePayload, PlayerDiePayload, PlayerChangePayload } = require('./public/src/server');

const randX = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const logEvent = (eventName, id, payload = null) => {
    if (payload) {
        console.log(`[${id}] ${eventName} |`, payload);
    } else {
        console.log(`[${id}] ${eventName}`);
    }
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
let players = {};

const playerCount = () => Object.keys(players).length;

io.on('connection', (socket) => {
    logEvent('new', socket.id);
    players[socket.id] = socket.id;

    io.emit('new', new PlayerChangePayload(socket.id, playerCount()));

    socket.on('move', (/** @type {PlayerMovePayload} */ payload) => {
        payload.playerId = socket.id;
        io.emit('move', payload);
    });

    socket.on('die', (score) => {
        const payload = new PlayerDiePayload(socket.id, score);
        logEvent('die', socket.id, payload);
        io.emit('die', payload);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        const payload = new PlayerChangePayload(socket.id, playerCount());
        logEvent('leave', socket.id, payload);
        io.emit('leave', payload);
    });

    socket.on('count', () => {
        socket.emit('count', playerCount());
    })

    socket.on('playerlist', () => {
        socket.emit('playerlist', players);
    })

    socket.on('iam', (nickname) => {
        logEvent('iam', socket.id, nickname);
        players[socket.id] = nickname ?? socket.id;
    });
});

// ! SERVE
const PORT = 80;
server.listen(PORT, () => {
    console.log('start', 'listening on *:' + PORT);
});