
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
            debug: true
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

var scoreText;
var highScoreText;

var vX = 0;

/** @type {Stage} */
let stageObj;

/** @type {Backdrop} */
let backgroundTile;

/** @type {KillFeed} */
let killFeedObj;

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
let keyResetPressed = false;

var soundHit;
var soundWing;
var soundSwoosh;

function reset() {
    if (vX > highest_score) {
        highest_score = vX;
    }
    vX = 0;

    backgroundTile.setScrollDistance(vX);

    stageObj.update(vX);
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

function create() {
    // ? AUDIO
    soundHit = this.sound.add('hit');
    soundWing = this.sound.add('wing');
    soundSwoosh = this.sound.add('swoosh');

    // ? GAME STATE
    currentGameState = GameState.START;
    // ? BACKGROUND
    backgroundTile = new Backdrop(this, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, "space");

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

            killFeedObj.addKill(isMe ? 'you' : obj.id, obj.score);
        });
    }, 200);

    // ? STAGE
    stageObj = new Stage(this, playerObj, playerDie);

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

    // ? KILL FEED
    killFeedObj = new KillFeed(this, SCREEN_WIDTH - 10, 10);
}

function update(timeMs, delta) {
    const adjustedSpeed = VELOCITY * delta / 8.33

    if (keyReset.isDown && !keyResetPressed) {
        currentGameState = GameState.START;
        playerObj.stopPhysics();
        playerObj.setLocation(startLocation.x, startLocation.y);
        reset();
        keyResetPressed = true;
    } else if (keyReset.isUp) {
        keyResetPressed = false;
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
        backgroundTile.setScrollDistance(vX);

        stageObj.update(vX);
    }

    playerObj.updateAnimation();

    // ! Update UI
    highScoreText.text = '' + Math.round(Math.max(highest_score, vX));
    scoreText.text = '' + Math.round(vX);

    // ! KillFeed
    killFeedObj.update();

}