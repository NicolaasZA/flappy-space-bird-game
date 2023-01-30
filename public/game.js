
const SCREEN_WIDTH = Math.max(Math.min(document.body.clientWidth, 1024), 640);
const SCREEN_HEIGHT = Math.max(Math.min(document.body.clientHeight, 768), 640);
const startLocation = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 };

const VELOCITY = 2.2;

let highest_score = 0;

const FONT_OBJ = { fontFamily: 'bahaha, cursive', fontSize: '48px' };
const GET_READY_FONT = { fontFamily: 'bahaha, cursive', fontSize: '64px', color: '#ff0000' };
const HELP_FONT = { fontFamily: 'bahaha, cursive', fontSize: '48px', color: '#ffffff' };

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

/** @type {Phaser.GameObjects.Particles.ParticleEmitter} */
let explosionEmitter;

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

/** @type {Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound} */
var soundHit;
/** @type {Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound} */
var soundWing;
/** @type {Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound} */
var soundSwoosh;
/** @type {Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound} */
var soundtrack;

/** @type {Phaser.GameObjects.Text} */
var scoreText;
/** @type {Phaser.GameObjects.Text} */
var highScoreText;
/** @type {Phaser.GameObjects.Text} */
var getReadyText;
/** @type {Phaser.GameObjects.Text} */
var helpText;

var vX = 0;

function setGameState(newState) {
    currentGameState = newState;

    if (newState == GameState.START) {
        playerObj.stopPhysics();
        playerObj.setLocation(startLocation.x, startLocation.y);

        if (vX > highest_score) { highest_score = vX; }
        vX = 0;


        backgroundTile.setScrollDistance(vX);
        stageObj.update(vX);

        getReadyText.alpha = 1;
        helpText.alpha = 1;

        return true;
    }

    else if (newState == GameState.PLAYING) {
        playerObj.startPhysics();

        getReadyText.alpha = 0;
        helpText.alpha = 0;

        return true;
    }

    return false;
}

function onPlayerDeath() {
    soundHit.play();
    mpClient.sendDeathScore(vX);
    explosionEmitter.explode(50, playerObj.sprite.x + vX, playerObj.sprite.y);
    setGameState(GameState.START);
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
    this.load.audio('soundtrack', ['assets/audio/soundtrack.mp3']);
}

function create() {
    // ? AUDIO
    soundHit = this.sound.add('hit');
    soundWing = this.sound.add('wing');
    soundSwoosh = this.sound.add('swoosh');
    [soundHit, soundWing, soundSwoosh].forEach((s) => s.volume = 0.5);

    soundtrack = this.sound.add('soundtrack');
    soundtrack.volume = 0.1;
    soundtrack.setLoop(true);
    soundtrack.play();

    // ? BACKGROUND
    backgroundTile = new Backdrop(this, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, "space");

    // ? PARTICLES
    const redParicleManager = this.add.particles('red');
    explosionEmitter = redParicleManager.createEmitter({
        speed: { min: 400, max: 900 },
        angle: { min: 0, max: 360 },
        gravityY: Player.GRAVITY / 10,
        alpha: 1,
        lifespan: 300,
        scale: { start: 0.3, end: 0 },
        blendMode: 'SCREEN'
    });
    explosionEmitter.stop();

    // ? PLAYER
    playerObj = new Player(this, startLocation, true);
    playerObj.createParticles(redParicleManager);

    // ? STAGE
    stageObj = new Stage(this, playerObj, onPlayerDeath);
    stageObj.addBoundaryBlocks(this, playerObj, onPlayerDeath);

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

    getReadyText = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3, 'READY?', GET_READY_FONT);
    getReadyText.depth = 1;
    getReadyText.setOrigin(0.5, 0);

    helpText = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3 * 2, 'PRESS SPACE OR TAP', HELP_FONT);
    helpText.depth = 1;
    helpText.setOrigin(0.5, 1);

    // ? KILL FEED
    killFeedObj = new KillFeed(this, SCREEN_WIDTH - 10, 10);

    // ? MP EVENTS
    hookMultiplayerEvents(this);

    // ? GAME STATE
    setGameState(GameState.START);
}

function update(_, delta) {
    const adjustedSpeed = VELOCITY * delta / 8.33

    // ! Look for reset button trigger
    if (keyReset.isDown && !keyResetPressed) {
        setGameState(GameState.START);
        keyResetPressed = true;
    } else if (keyReset.isUp) {
        keyResetPressed = false;
    }

    // ! Look for start / jump button trigger
    if (keySpace.isDown || this.input.activePointer.isDown) {
        if (currentGameState == GameState.START) {
            setGameState(GameState.PLAYING);
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
        backgroundTile.setParallaxDistance(playerObj.sprite.y, SCREEN_HEIGHT);

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
        if (obj.id != mpClient.id) {
            const playerEntry = otherPlayers.find((p) => p.id == obj.id);
            if (playerEntry) {
                explosionEmitter.explode(50, playerEntry.sprite.x, playerEntry.sprite.y);

                playerEntry.sprite.alpha = 0;
                playerEntry.sprite.x = 0;
                playerEntry.sprite.y = 0;
            }
        }

        killFeedObj.addKill((obj.id == mpClient.id) ? 'you' : obj.id, obj.score);
    });
}