class MultiplayerClient {
    /** @type {SocketInterface} */
    socket;

    /** @type {string} */
    id;

    constructor() {
        // @ts-ignore
        this.socket = io();

        this.socket.on("connect", () => {
            console.log('my id:', this.socket.id);
            this.id = this.socket.id;
        });
    }

    /**
     * Send your location to other clients
     * @param {number} virtualX
     * @param {number} screenY
     * @param {number} velocityX
     * @param {number} velocityY
     */
    sendLocation(virtualX, screenY, velocityX, velocityY) {
        if (this.socket.connected) {
            const payload = new PlayerMovePayload(new Point(virtualX, screenY), new Point(velocityX, velocityY));
            this.socket.emit('move', payload);
        } else {
            console.warn('not connected');
        }
    }


    /**
     * On death, send your score to other players' kill feeds.
     * @param {number} score
     */
    sendDeathScore(score) {
        if (this.socket.connected) {
            this.socket.emit('die', Math.floor(score));
        } else {
            console.warn('not connected');
        }
    }

    /**
     * @param {(data: PlayerMovePayload) => void} callback
     */
    onPlayerMove(callback) {
        this.socket.on('move', callback);
    }

    /**
     * @param {(data: PlayerChangePayload) => void} callback
     */
    onPlayerLeave(callback) {
        this.socket.on('leave', callback);
    }

    /**
     * @param {(data: PlayerChangePayload) => void} callback
     */
    onPlayerJoin(callback) {
        this.socket.on('join', callback);
    }

    /**
     * @param {(data: PlayerDiePayload) => void} callback
     */
    onPlayerDie(callback) {
        this.socket.on('die', callback);
    }


    /**
     * @param {(count: number) => void} callback
     */
    startPlayerCountSync(callback) {
        this.socket.emit('count');
        this.playerCountInterval = setInterval(() => this.socket.emit('count'), 2000);
        this.socket.on('count', callback);
    }

    /**
     * @param {(players: object) => void} callback
     */
    startPlayerListSync(callback) {
        this.socket.emit('playerlist');
        this.playerListInterval = setInterval(() => this.socket.emit('playerlist'), 3000);
        this.socket.on('playerlist', callback);
    }
}

class SocketInterface {
    /** @type {boolean} */
    connected;

    /** @type {string} */
    id;

    /**
     * @param {string} eventName
     * @param {any} dataObject
     */
    emit(eventName, dataObject) { }

    /**
     * @param {string} eventName
     * @param {(data) => void} callback
     */
    on(eventName, callback) { }
}

class PlayerDiePayload {
    /** @type {Vector} */
    playerId;
    /** @type {number} */
    score;

    constructor(playerId, score) { this.playerId = playerId; this.score = score; }
} 

class PlayerMovePayload {
    /** @type {string} */
    playerId;
    /** @type {Point} */
    location;
    /** @type {Point} */
    velocity;

    /**
     * @param {Point} location 
     * @param {Point} velocity 
     */
    constructor(location, velocity) {
        this.location = location;
        this.velocity = velocity;
    }

}

class PlayerChangePayload {
    /** @type {string} */
    playerId;
    /** @type {number} */
    playerCount;
}