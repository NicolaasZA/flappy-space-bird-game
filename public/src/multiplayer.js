
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
     * @param {number} y
     */
    sendLocation(virtualX, y) {
        if (this.socket.connected) {
            this.socket.emit('move', { x: virtualX, y });
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
     * @param {(data: PlayerMoveEvent) => void} callback
     */
    onPlayerMove(callback) {
        this.socket.on('move', callback);
    }

    /**
     * @param {(playerId: string) => void} callback
     */
    onPlayerLeave(callback) {
        this.socket.on('leave', callback);
    }

    /**
     * @param {(data: PlayerDeathEvent) => void} callback
     */
    onPlayerDie(callback) {
        this.socket.on('die', callback);
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

class PlayerMoveEvent {
    /** @type {string} */
    id;
    /** @type {{x: number; y: number}} */
    location;
}

class PlayerDeathEvent {
    /** @type {string} */
    id;
    /** @type {number} */
    score;
}