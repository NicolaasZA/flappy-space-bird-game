class Stage {

    /** @type {Phaser.Scene} */
    sceneRef;

    pipeData = [];

    /** @type {Array<StagePipe>} */
    pipes = [];

    static PIPE_GAP = 60;
    static PIPE_WIDTH = 50;
    static BOUNDARY_THICKNESS = 3;

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

                        const topBounds = new Rect(
                            startX, // left
                            startX + Stage.PIPE_WIDTH, // right
                            0, // top
                            pipe.y - Stage.PIPE_GAP // bottom
                        );
                        const bottomBounds = new Rect(
                            startX, // left
                            startX + Stage.PIPE_WIDTH, // right
                            pipe.y + Stage.PIPE_GAP, // top
                            SCREEN_HEIGHT // bottom
                        );

                        const pipeEntry = new StagePipe(scene, topBounds, bottomBounds, startX);
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
        const topBounds = new Rect(0, SCREEN_WIDTH, 0, Stage.BOUNDARY_THICKNESS);
        const bottomBounds = new Rect(0, SCREEN_WIDTH, SCREEN_HEIGHT - Stage.BOUNDARY_THICKNESS, SCREEN_HEIGHT);

        const callbackWrapper = () => {
            try {
                callback();
            } catch (err) {
                console.error(err);
            }
        };

        this.boundaryPipe = new StagePipe(sceneRef, topBounds, bottomBounds, 0, false);
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

    /**
     * @param {Phaser.Scene} sceneRef
     * @param {Rect} topBounds
     * @param {Rect} bottomBounds
     * @param {number} startX
     */
    constructor(sceneRef, topBounds, bottomBounds, startX, visible = true) {
        this.startX = startX;

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