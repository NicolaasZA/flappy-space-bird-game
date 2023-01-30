
const SCREEN_WIDTH = Math.max(Math.min(document.body.clientWidth, 1024), 640);
const SCREEN_HEIGHT = Math.max(Math.min(document.body.clientHeight, 768), 640);
const startLocation = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 };

const SPAWN_COOLDOWN_MS = 2000;
const X_SCALE = 80;
const PIPE_GAP = 60;
const PIPE_WIDTH = 60;
const VELOCITY = 2.2;

let highest_score = 0;

const FONT_OBJ = { fontFamily: 'bahaha, cursive', fontSize: '48px' };

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
console.log('FLAPPY', `${SCREEN_WIDTH}x${SCREEN_HEIGHT}`);

/** @type {MultiplayerClient} */
const mpClient = new MultiplayerClient();

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

var scoreText;
var highScoreText;

var vX = 0;

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

    mpClient.sendDeathScore(vX);

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

    // ? MP EVENTS
    hookMultiplayerEvents(this);
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

        mpClient.sendLocation(vX, playerObj.sprite.y);

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

function hookMultiplayerEvents(sceneRef) {
    mpClient.onPlayerMove((obj) => {
        if (obj.id != mpClient.id) {
            let playerEntry = otherPlayers.find((p) => p.id == obj.id);
            if (!playerEntry) {
                playerEntry = new Player(sceneRef, startLocation, false, false);
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

    mpClient.onPlayerLeave((playerId) => {
        if (playerId != mpClient.id) {
            const playerEntry = otherPlayers.find((p) => p.id == playerId);
            if (playerEntry) {
                playerEntry.sprite.alpha = 0;
                playerEntry.sprite.destroy();
                console.log('Destroying', playerId, playerEntry);
            }
        }
    });

    mpClient.onPlayerDie((obj) => {
        const playerEntry = otherPlayers.find((p) => p.id == obj.id);
        if (playerEntry) { 
            playerEntry.sprite.alpha = 0;
            playerEntry.sprite.x = 0;
            playerEntry.sprite.y = 0;
         }

        killFeedObj.addKill((obj.id == mpClient.id) ? 'you' : obj.id, obj.score);
    });
}