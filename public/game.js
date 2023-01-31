
const SCREEN_WIDTH = Math.max(Math.min(document.body.clientWidth, 1024), 640);
const SCREEN_HEIGHT = Math.max(Math.min(document.body.clientHeight, 768), 640);
const startLocation = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 };

const VELOCITY = 2.2;

let highest_score = 0;

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

/** @type {UserInterface} */
let uiObj;

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

var vX = 0;

function setGameState(newState) {
    currentGameState = newState;

    if (newState == GameState.START) {
        playerObj.stopPhysics();
        playerObj.setLocation(startLocation.x, startLocation.y);

        if (vX > highest_score) { highest_score = vX; }
        vX = 0;

        backgroundTile.setScrollDistance(vX);

        stageObj.stopEmitters();
        stageObj.update(vX);

        uiObj.setStartTextVisible(true);

        return true;
    }

    else if (newState == GameState.PLAYING) {
        playerObj.startPhysics();

        uiObj.setStartTextVisible(false);
        stageObj.startEmitters();

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

    this.load.image('green-planet', 'assets/particles/green-planet.png');
    this.load.image('purple-planet', 'assets/particles/purple-planet.png');
    this.load.image('red-planet', 'assets/particles/red-planet.png');
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
    stageObj = new Stage(this, playerObj, SCREEN_WIDTH, SCREEN_HEIGHT, onPlayerDeath);
    stageObj.addBoundaryBlocks(this, playerObj, onPlayerDeath);
    stageObj.createEmitters(this, 260);

    // ? KEYBINDS
    keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    keyReset = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    keyPause = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    // ? UI
    uiObj = new UserInterface();
    uiObj.create(this);

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

        mpClient.sendLocation(vX, playerObj.sprite.y, playerObj.sprite.body.velocity.x, playerObj.sprite.body.velocity.y);
        backgroundTile.update(vX, playerObj.sprite.y);
        stageObj.update(vX);
    }

    playerObj.updateAnimation();
    uiObj.setScore(Math.round(vX));
    killFeedObj.update();

}

function hookMultiplayerEvents(sceneRef) {
    mpClient.onPlayerMove((obj) => {
        if (obj.playerId != mpClient.id) {
            let playerEntry = otherPlayers.find((p) => p.playerId == obj.playerId);
            if (!playerEntry) {
                playerEntry = new Player(sceneRef, startLocation, false, false);
                playerEntry.convertToOtherPlayer(obj.playerId);
                otherPlayers.push(playerEntry);
            }

            playerEntry.sprite.alpha = 1;
            playerEntry.setLocation(startLocation.x + obj.location.x - vX, obj.location.y);
            playerEntry.updateAnimation(obj.velocity.y);
        }
    });

    mpClient.onPlayerLeave((playerId) => {
        if (playerId != mpClient.id) {
            const playerEntry = otherPlayers.find((p) => p.playerId == playerId);
            if (playerEntry) {
                playerEntry.dispose(true);
            }
        }
    });

    mpClient.onPlayerDie((obj) => {
        if (obj.playerId != mpClient.id) {
            const playerEntry = otherPlayers.find((p) => p.playerId == obj.playerId);
            if (playerEntry) {
                explosionEmitter.explode(50, playerEntry.sprite.x, playerEntry.sprite.y);
                playerEntry.dispose();
            }
        }

        killFeedObj.addKill((obj.playerId == mpClient.id) ? 'YOU' : obj.playerId, obj.score);
    });
}