class Player {

    /** @type {string} */
    playerId;

    /** @type {Phaser.Physics.Arcade.Image} */
    sprite;

    /** @type {Phaser.GameObjects.Particles.ParticleEmitter} */
    trailEmitter;

    static GRAVITY = 980;
    static JUMP_POWER = 300;
    static FRAMES = {
        FRIENDS: { key: 1, name: 'player-others', angle: 0 },
        UP: { key: 0, name: 'player-up', angle: -45 },
        FRONT: { key: 1, name: 'player-front', angle: 0 },
        DOWN: { key: 2, name: 'player-down', angle: 45 },
        rangeValue: 30
    };

    /**
     * @param {Phaser.Scene} scene
     * @param {{ x: number; y: number; }} startLocation
     */
    constructor(scene, startLocation, collideWorldBounds = true, inFront = true) {
        this.sprite = scene.physics.add.image(startLocation.x, startLocation.y, Player.FRAMES.FRONT.name)

        this.sprite.setCollideWorldBounds(collideWorldBounds);
        this.sprite.depth = inFront ? 2 : 1;
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setLocation(x, y) {
        this.sprite.x = x;
        this.sprite.y = y;
    }

    stopPhysics() {
        this.sprite.setAccelerationY(0);
        this.sprite.setVelocity(0, 0);

        if (this.trailEmitter) {
            this.trailEmitter.stop(true);
        }
    }

    startPhysics(velX = 0, velY = 0) {
        this.sprite.setVelocity(velX, velY);
        this.sprite.setAccelerationY(Player.GRAVITY);

        if (this.trailEmitter) {
            this.trailEmitter.start();
        }
    }

    /**
     * @param {Phaser.GameObjects.Particles.ParticleEmitterManager} manager
     */
    createParticles(manager) {
        this.trailEmitter = manager.createEmitter({
            speedX: -250,
            gravityY: Player.GRAVITY / 10,
            alpha: 0.8,
            lifespan: 400,
            scale: { start: 0.2, end: 0 },
            blendMode: 'OVERLAY'
        });
        this.trailEmitter.startFollow(this.sprite);
    }

    updateAnimation(vY = this.sprite.body.velocity.y) {
        const frame = this.calculateFrame(vY);
        if (!this.playerId) { this.sprite.setTexture(frame.name); }
        this.sprite.angle = frame.angle;
    }

    calculateFrame(_) {
        if (_ < (0 - Player.FRAMES.rangeValue)) {
            return Player.FRAMES.UP;
        } else if (_ > Player.FRAMES.rangeValue) {
            return Player.FRAMES.DOWN;
        }
        return Player.FRAMES.FRONT;
    }

    jump() {
        this.sprite.setVelocityY(-Player.JUMP_POWER);
    }

    dispose(doDestroy = false) {
        this.sprite.alpha = 0;
        this.sprite.x = -50;
        this.sprite.y = -50;

        if (doDestroy) {
            this.sprite.destroy();
            setTimeout(() => this.sprite = undefined, 1000);
        }
    }

    /**
     * @param {string} playerId
     */
    convertToOtherPlayer(playerId) {
        this.playerId = playerId;
        this.sprite.setTexture(Player.FRAMES.FRIENDS.name);
        this.stopPhysics();
    }
}