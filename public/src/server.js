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
    /** @type {Vector} */
    location;
    /** @type {Vector} */
    velocity;
}

class PlayerChangePayload {
    /** @type {string} */
    playerId;
    /** @type {number} */
    playerCount;

    constructor(playerId, playerCount) { this.playerId = playerId; this.playerCount = playerCount; }
}

class Vector {
    /** @type {number} */
    x;
    /** @type {number} */
    y;
}

module.exports = {
    PlayerDiePayload,
    PlayerMovePayload,
    PlayerChangePayload,
    Vector
}