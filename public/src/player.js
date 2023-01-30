class Player {
    id = '';

    /** @type {Phaser.Physics.Arcade.Image} */
    sprite;

    /** @type {Phaser.GameObjects.Particles.ParticleEmitter} */
    particleEmitter;

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
     * @param {number} [x]
     * @param {number} [y]
     */
    setLocation(x, y) {
        this.sprite.x = x;
        this.sprite.y = y;
    }

    stopPhysics() {
        this.sprite.setAccelerationY(0);
        this.sprite.setVelocity(0, 0);
        
        if (this.particleEmitter) {
            this.particleEmitter.stop(true);
        }
    }

    startPhysics(velX = 0, velY = 0) {
        this.sprite.setVelocity(velX, velY);
        this.sprite.setAccelerationY(Player.GRAVITY);
        
        if (this.particleEmitter) {
            this.particleEmitter.start();
        }
    }

    createParticle(manager) {
        this.particleEmitter = manager.createEmitter({
            speedX: -250,
            gravityY: Player.GRAVITY / 10,
            alpha: 0.8,
            lifespan: 400,
            scale: { start: 0.2, end: 0 },
            blendMode: 'OVERLAY'
        });

        this.particleEmitter.startFollow(this.sprite);
    }

    updateAnimation() {
        const frame = this.calculateFrame();
        this.sprite.setTexture(frame.name);
        this.sprite.angle = frame.angle;
    }

    calculateFrame() {
        const vY = this.sprite.body.velocity.y;
        if (vY < (0 - Player.FRAMES.rangeValue)) {
            return Player.FRAMES.UP;
        } else if (vY > Player.FRAMES.rangeValue) {
            return Player.FRAMES.DOWN;
        }
        return Player.FRAMES.FRONT;
    }

    jump() {
        this.sprite.setVelocityY(-Player.JUMP_POWER);
    }
}