
const SCREEN_WIDTH = Math.max(Math.min(document.body.clientWidth, 1024), 640);
const SCREEN_HEIGHT = Math.max(Math.min(document.body.clientHeight, 768), 640);
const startLocation = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 };

const SPAWN_COOLDOWN_MS = 2000;
const KILL_FEED_TIMEOUT_MS = 3000;
const X_SCALE = 80;
const PIPE_GAP = 60;
const PIPE_WIDTH = 60;
const VELOCITY = 2.2;

let highest_score = 0;

class GameState {
    static START = 0;
    static PLAYING = 1;
}

class Rect {
    left = 0;
    right = 0;
    top = 0;
    bottom = 0;

    x = 0;
    y = 0;
    width = 0;
    height = 0;

    constructor(l, r, t, b, originOffset = false) {
        this.left = l;
        this.right = r;
        this.top = t;
        this.bottom = b;

        this.width = Math.abs(this.right - this.left);
        this.height = Math.abs(this.bottom - this.top);

        if (originOffset) {
            this.x = l + (this.width / 2);
            this.y = t + (this.height / 2);
        } else {
            this.x = l + 0;
            this.y = t + 0;
        }

    }

    scale(scalar) {

    }
}

const FONT_OBJ = { fontFamily: 'bahaha, cursive', fontSize: '48px' };
const FONT_OBJ_FEED = { fontFamily: 'bahaha, cursive', fontSize: '22px' };

console.log('FLAPPY', `${SCREEN_WIDTH}x${SCREEN_HEIGHT}`);

const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    fps: {
        target: 30
    },
    scene: {
        preload: preload,
        create,
        update
    }
});

var backgroundTile;
var scoreText;
// var deltaText;
var highScoreText;

var vX = 0;

/** @type {Player} */
let playerObj;
/** @type {Array<Player>} */
const otherPlayers = [];

let currentGameState = GameState.START;

/** @type {Phaser.Input.Keyboard.Key} */
var keySpace;
/** @type {Phaser.Input.Keyboard.Key} */
var keyReset;
/** @type {Phaser.Input.Keyboard.Key} */
var keyPause;

let keySpacePressed = false;

var soundHit;
var soundWing;
var soundSwoosh;

var stage = [];
var pipes = [];
// var players = [];

var killFeedTexts = [];
var killFeed = [];
window.killFeed = killFeed;
var feedContext;

function reset() {
    if (vX > highest_score) {
        highest_score = vX;
    }
    vX = 0;

    backgroundTile.tilePositionX = 0;

    pipes.forEach((p) => {
        p.top.x = p.startX - vX;
        p.bottom.x = p.startX - vX;
    });
}

function playerDie() {
    soundHit.play();
    window['socket'].emit('die', vX);

    currentGameState = GameState.START;
    playerObj.stopPhysics();
    playerObj.setLocation(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

    scoreText.alpha = 1;

    reset();
}



function padded(val, len) {
    let result = (val ?? '') + '';
    while (result.length < len) {
        result = '0' + result;
    }
    return result;
}

function updateKillFeed() {
    killFeed = killFeed.filter((entry) => entry.expires > Date.now());

    const drawable = killFeed.slice(0, 4).map((e) => e.id.slice(0, 4) + ' 💀 ' + padded(Math.floor(e.score), 4));
    while (drawable.length < 4) {
        drawable.push('');
    }
    drawable.forEach((entry, idx) => {
        killFeedTexts[idx].text = entry;
    });
}

function preload() {
    this.load.image(Player.FRAMES.UP.name, 'assets/sprites/redbird-upflap.png');
    this.load.image(Player.FRAMES.FRONT.name, 'assets/sprites/redbird-midflap.png');
    this.load.image(Player.FRAMES.DOWN.name, 'assets/sprites/redbird-downflap.png');
    this.load.image(Player.FRAMES.FRIENDS.name, 'assets/sprites/bluebird-midflap.png');

    this.load.image('space', 'assets/sprites/space3.png');
    this.load.image('red', 'assets/particles/red.png');

    this.load.audio('hit', ['assets/audio/hit.wav', 'assets/audio/hit.ogg']);
    this.load.audio('wing', ['assets/audio/wing.wav', 'assets/audio/wing.ogg']);
    this.load.audio('swoosh', ['assets/audio/swoosh.wav', 'assets/audio/swoosh.ogg']);
}

function onPipeCollision(pipe) {
    console.warn('PIPE COLLISION', pipe);
}

function create() {
    // ? AUDIO
    soundHit = this.sound.add('hit');
    soundWing = this.sound.add('wing');
    soundSwoosh = this.sound.add('swoosh');

    // ? GAME STATE
    currentGameState = GameState.START;

    // ? BACKGROUND
    backgroundTile = this.add.tileSprite(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, "space");
    backgroundTile.originX = 0;
    backgroundTile.originY = 0;

    // ? PLAYER
    playerObj = new Player(this, startLocation, true);
    playerObj.createParticle(this.add.particles('red'));
    playerObj.stopPhysics();

    // When server broadcasts a listing of clients, update UI
    var socketPrep = setInterval(() => {
        if (window['socket']) {
            clearInterval(socketPrep);
        }

        window['socket'].on('move', (obj) => {
            if (obj.id != window['socket'].id) {
                let playerEntry = otherPlayers.find((p) => p.id == obj.id);
                if (!playerEntry) {
                    playerEntry = new Player(this, startLocation, false, false);
                    playerEntry.id = obj.id;
                    playerEntry.sprite.setTexture(Player.FRAMES.FRIENDS.name);
                    playerEntry.stopPhysics();

                    otherPlayers.push(playerEntry);
                    console.warn('Creating', obj.id, playerEntry);
                }

                playerEntry.sprite.alpha = 1;
                playerEntry.setLocation(startLocation.x + obj.location.x - vX, obj.location.y);
            }
        });

        window['socket'].on('leave', (playerId) => {
            if (playerId != window['socket'].id) {
                const playerEntry = otherPlayers.find((p) => p.id == playerId);
                if (playerEntry) {
                    playerEntry.sprite.alpha = 0;
                    playerEntry.sprite.destroy();
                    console.log('Destroying', playerId, playerEntry);
                }
            }
        })

        window['socket'].on('die', (obj) => {
            const isMe = obj.id == window['socket'].id;
                
            const playerEntry = otherPlayers.find((p) => p.id == obj.id);
            if (playerEntry) { playerEntry.sprite.alpha = 0; }

            killFeed.unshift({ id: isMe ? 'you' : obj.id, score: obj.score, expires: Date.now() + KILL_FEED_TIMEOUT_MS });
        });
    }, 200);


    // ? PIPES
    fetch('http://' + window.location.hostname + ':' + window.location.port + '/stage')
        .then((res) => {
            res.json().then((d) => {
                stage = d.slice(0, 40);

                stage.forEach((pipe) => {
                    const obj = {};

                    const startX = (SCREEN_WIDTH / 2) + pipe.x;

                    const topBounds = new Rect(
                        startX, // left
                        startX + PIPE_WIDTH, // right
                        0, // top
                        pipe.y - PIPE_GAP // bottom
                    );
                    const bottomBounds = new Rect(
                        startX, // left
                        startX + PIPE_WIDTH, // right
                        pipe.y + PIPE_GAP, // top
                        SCREEN_HEIGHT // bottom
                    );

                    const graphicsTop = this.add.graphics({ fillStyle: { color: 0xff0000 } });
                    graphicsTop.x = topBounds.x;
                    graphicsTop.y = topBounds.y;
                    graphicsTop.w = topBounds.width;
                    graphicsTop.h = topBounds.height;
                    graphicsTop.fillRect(0, 0, topBounds.width, topBounds.height);
                    this.physics.add.existing(graphicsTop);

                    const graphicsBottom = this.add.graphics({ fillStyle: { color: 0xff0000 } });
                    graphicsBottom.x = bottomBounds.x;
                    graphicsBottom.y = bottomBounds.y;
                    graphicsBottom.w = bottomBounds.width;
                    graphicsBottom.h = bottomBounds.height;
                    graphicsBottom.fillRect(0, 0, bottomBounds.width, bottomBounds.height);
                    this.physics.add.existing(graphicsBottom);

                    graphicsTop.body.immovable = true;
                    graphicsBottom.body.immovable = true;

                    graphicsTop.body.setSize(topBounds.width, topBounds.height);
                    graphicsBottom.body.setSize(bottomBounds.width, bottomBounds.height);

                    this.physics.add.collider(playerObj.sprite, graphicsTop, playerDie);
                    this.physics.add.collider(playerObj.sprite, graphicsBottom, playerDie);

                    obj['top'] = graphicsTop;
                    obj['bottom'] = graphicsBottom;
                    obj['startX'] = startX;

                    this.physics.collide(graphicsTop, playerObj.sprite, () => console.warn('yes'));
                    this.physics.collide(graphicsBottom, playerObj.sprite, () => console.warn('yes'));

                    pipes.push(obj);
                });
                window.pipes = pipes;
            });
        });

    // ? KEYBINDS
    keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    keyReset = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    keyPause = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    // ? UI
    highScoreText = this.add.text(10, 10, '' + highest_score, FONT_OBJ);
    highScoreText.depth = 1;

    scoreText = this.add.text(10, 50, '' + vX, FONT_OBJ);
    scoreText.depth = 1;
    scoreText.alpha = 0;

    // deltaText = this.add.text(10, 90, '', FONT_OBJ);

    killFeedTexts = [
        this.add.text(SCREEN_WIDTH - 10, 10, '-', FONT_OBJ_FEED),
        this.add.text(SCREEN_WIDTH - 10, 35, '-', FONT_OBJ_FEED),
        this.add.text(SCREEN_WIDTH - 10, 60, '-', FONT_OBJ_FEED),
        this.add.text(SCREEN_WIDTH - 10, 85, '-', FONT_OBJ_FEED)
    ];
    window.killFeedTexts = killFeedTexts;
    killFeedTexts.forEach((t) => {
        t.setOrigin(1, 0);
        t.depth = 1;
    });
}

function update(timeMs, delta) {
    const adjustedSpeed = VELOCITY * delta / 8.33

    if (keyReset.isDown) {
        currentGameState = GameState.START;
        playerObj.stopPhysics();
        playerObj.setLocation()
    }

    // ! Move player
    if (keySpace.isDown || this.input.activePointer.isDown) {
        if (currentGameState == GameState.START) {
            currentGameState = GameState.PLAYING;
            playerObj.startPhysics();
        } else if (!keySpacePressed) {
            playerObj.jump();
            soundWing.play();
            keySpacePressed = true;
        }
    } else {
        keySpacePressed = false;
    }

    if (currentGameState == GameState.PLAYING) {
        vX += adjustedSpeed;

        if (window['socket']) {
            window['socket'].emit('move', { x: vX, y: playerObj.sprite.y });
        }

        // ! Move background
        backgroundTile.tilePositionX = vX;

        pipes.forEach((p) => {
            p.top.x = p.startX - vX;
            p.bottom.x = p.startX - vX;
        });
    }

    playerObj.updateAnimation();

    // ! Update UI
    highScoreText.text = '' + Math.round(Math.max(highest_score, vX));
    scoreText.text = '' + Math.round(vX);

    // ! KillFeed
    updateKillFeed();

}