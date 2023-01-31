class Stage {

    /** @type {Phaser.Scene} */
    sceneRef;

    /** @type {Array<Point>} */
    pipeData = [];

    /** @type {Array<StagePipe>} */
    pipes = [];

    static PIPE_GAP = 60;
    static PIPE_WIDTH = 50;

    /**
     * @param {Phaser.Scene} scene
     * @param {Player} player
     * @param {() => void} onCollisionCallback
     */
    constructor(scene, player, onCollisionCallback) {
        this.sceneRef = scene;

        this.pipeData = [];
        this.pipes = [];

        fetch('http://' + window.location.hostname + ':' + window.location.port + '/stage')
            .then((res) => {
                res.json().then((data) => {
                    this.pipeData = data.slice(0, 40);

                    this.pipeData.forEach((pipe) => {
                        const startX = (SCREEN_WIDTH / 2) + pipe.x;

                        const pipeEntry = new StagePipe(scene, startX, pipe.y);
                        pipeEntry.addPlayerCollisionListener(scene, player, onCollisionCallback);

                        this.pipes.push(pipeEntry);
                    });

                    window['stage'] = this;
                });
            });
    }

    /**
     * @param {number} virtualX
     */
    update(virtualX) {
        this.pipes.forEach((p) => {
            p.top.x = p.startX - virtualX;
            p.bottom.x = p.startX - virtualX;
        });
    }

    /**
     * Add collision boxes at the top and bottom of the screen to prevent the user from touching them
     * @param {Phaser.Scene} sceneRef
     * @param {Player} player
     * @param {() => void} callback
     */
    addBoundaryBlocks(sceneRef, player, callback) {
        const callbackWrapper = () => {
            try {
                callback();
            } catch (err) {
                console.error(err);
            }
        };

        this.boundaryPipe = new StagePipe(sceneRef, 0, 0, true);
        this.boundaryPipe.addPlayerCollisionListener(sceneRef, player, callbackWrapper);
    }
}

class StagePipe {
    /** @type {Phaser.GameObjects.Graphics} */
    top;
    /** @type {Phaser.Physics.Arcade.Body} */
    topBody;
    /** @type {Phaser.GameObjects.Graphics} */
    bottom;
    /** @type {Phaser.Physics.Arcade.Body} */
    bottomBody;

    /** @type {number} */
    startX;

    static BOUNDARY_THICKNESS = 3;

    /**
     * @param {Phaser.Scene} sceneRef
     * @param {number} startX
     * @param {number} openingY
     */
    constructor(sceneRef, startX, openingY, isBoundaryPipes = false) {
        this.startX = startX;
        this.openingY = openingY;

        let topBounds, bottomBounds;
        if (isBoundaryPipes) {
            // ! Generate bounds for the top and bottom sides of the game area.
            topBounds = new Rect(startX, SCREEN_WIDTH, 0, StagePipe.BOUNDARY_THICKNESS);
            bottomBounds = new Rect(startX, SCREEN_WIDTH, SCREEN_HEIGHT - StagePipe.BOUNDARY_THICKNESS, SCREEN_HEIGHT);
        } else {
            // ! Generate bottom and top pipe sizes and locations
            topBounds = new Rect(
                startX, // left
                startX + Stage.PIPE_WIDTH, // right
                0, // top
                openingY - Stage.PIPE_GAP // bottom
            );
            bottomBounds = new Rect(
                startX, // left
                startX + Stage.PIPE_WIDTH, // right
                openingY + Stage.PIPE_GAP, // top
                SCREEN_HEIGHT // bottom
            );
        }

        this.fromBounds(sceneRef, topBounds, bottomBounds, !isBoundaryPipes);
    }

    /**
     * @param {Phaser.Scene} sceneRef
     * @param {Rect} topBounds
     * @param {Rect} bottomBounds
     */
    fromBounds(sceneRef, topBounds, bottomBounds, visible = true) {
        // ! Draw shapes
        this.top = sceneRef.add.graphics({ fillStyle: { color: 0xff0000 } });
        this.top.x = topBounds.x;
        this.top.y = topBounds.y;
        if (visible) {
            this.top.fillRect(0, 0, topBounds.width, topBounds.height);
        }

        this.bottom = sceneRef.add.graphics({ fillStyle: { color: 0xff0000 } });
        this.bottom.x = bottomBounds.x;
        this.bottom.y = bottomBounds.y;
        if (visible) {
            this.bottom.fillRect(0, 0, bottomBounds.width, bottomBounds.height);
        }

        // ! Add Physics
        sceneRef.physics.add.existing(this.top);
        // @ts-ignore
        this.topBody = this.top.body;
        this.topBody.immovable = true;
        this.topBody.setSize(topBounds.width, topBounds.height);

        sceneRef.physics.add.existing(this.bottom);
        // @ts-ignore
        this.bottomBody = this.bottom.body;
        this.bottomBody.immovable = true;
        this.bottomBody.setSize(bottomBounds.width, bottomBounds.height);
    }

    /**
     * @param {Phaser.Scene} scene
     * @param {Player} player
     * @param {() => void} callback
     */
    addPlayerCollisionListener(scene, player, callback) {
        const callbackWrapper = () => {
            try {
                callback();
            } catch (err) {
                console.error(err);
            }
        };

        scene.physics.add.collider(player.sprite, this.top, callbackWrapper);
        scene.physics.add.collider(player.sprite, this.bottom, callbackWrapper);
    }
}