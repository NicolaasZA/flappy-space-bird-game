class UserInterface {

    /** @type {Phaser.GameObjects.Text} */
    scoreText;
    /** @type {Phaser.GameObjects.Text} */
    getReadyText;
    /** @type {Phaser.GameObjects.Text} */
    helpText;
    /** @type {Phaser.GameObjects.Text} */
    playerCountText;
    /** @type {Phaser.GameObjects.Text} */
    playerNameText;

    /** @type {Phaser.Types.GameObjects.Text.TextStyle} */
    static SCORE_FONT = { fontFamily: 'bahaha, cursive', fontSize: '48px' };
    /** @type {Phaser.Types.GameObjects.Text.TextStyle} */
    static GET_READY_FONT = { fontFamily: 'bahaha, cursive', fontSize: '64px', color: '#ff0000' };
    /** @type {Phaser.Types.GameObjects.Text.TextStyle} */
    static HELP_FONT = { fontFamily: 'bahaha, cursive', fontSize: '48px', color: '#ffffff' };
    /** @type {Phaser.Types.GameObjects.Text.TextStyle} */
    static SMALL_FONT = { fontFamily: 'bahaha, cursive', fontSize: '22px', color: '#cccccc' };

    static HELP_TEXT = 'PRESS SPACE OR TAP';
    static GET_READY_TEXT = 'START';

    /**
     * @param {Phaser.Scene} sceneRef
     */
    create(sceneRef) {
        this.scoreText = sceneRef.add.text(SCREEN_WIDTH / 2, 10, '', UserInterface.SCORE_FONT);
        this.scoreText.setOrigin(0.5, 0);
        this.scoreText.depth = 1;

        this.getReadyText = sceneRef.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3, UserInterface.GET_READY_TEXT, UserInterface.GET_READY_FONT);
        this.getReadyText.depth = 1;
        this.getReadyText.setOrigin(0.5, 0);

        this.helpText = sceneRef.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3 * 2, UserInterface.HELP_TEXT, UserInterface.HELP_FONT);
        this.helpText.depth = 1;
        this.helpText.setOrigin(0.5, 1);

        this.playerCountText = sceneRef.add.text(10, SCREEN_HEIGHT - 10, 'N/A Playing', UserInterface.SMALL_FONT);
        this.playerCountText.depth = 1;
        this.playerCountText.setOrigin(0, 1);

        this.playerNameText = sceneRef.add.text(10, SCREEN_HEIGHT - 35, 'You are ____', UserInterface.SMALL_FONT);
        this.playerNameText.depth = 1;
        this.playerNameText.setOrigin(0, 1);
    }

    /**
     * @param {number} newScore
     */
    setScore(newScore) {
        if (newScore > 0) {
            this.scoreText.text = '' + Math.round(newScore);
        } else {
            this.scoreText.text = '';
        }
    }

    /**
     * @param {boolean} isVisible
     */
    setStartTextVisible(isVisible) {
        this.getReadyText.alpha = isVisible ? 1 : 0;
        this.helpText.alpha = isVisible ? 1 : 0;
    }

    setPlayerName(playerName) {
        this.playerNameText.text = 'You are ' + playerName;
    }

    setPlayerCount(playerCount) {
        this.playerCountText.text = playerCount + ' Playing';
    }

    setPlayerList(players) {
        // TODO
    }
}