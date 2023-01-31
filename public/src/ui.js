class UserInterface {

    /** @type {Phaser.GameObjects.Text} */
    scoreText;
    /** @type {Phaser.GameObjects.Text} */
    getReadyText;
    /** @type {Phaser.GameObjects.Text} */
    helpText;

    /**
     * @param {Phaser.Scene} sceneRef
     */
    create(sceneRef) {
        this.scoreText = sceneRef.add.text(SCREEN_WIDTH / 2, 10, '' + vX, FONT_OBJ);
        this.scoreText.setOrigin(0.5, 0);
        this.scoreText.depth = 1;

        this.getReadyText = sceneRef.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3, 'READY?', GET_READY_FONT);
        this.getReadyText.depth = 1;
        this.getReadyText.setOrigin(0.5, 0);

        this.helpText = sceneRef.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3 * 2, 'PRESS SPACE OR TAP', HELP_FONT);
        this.helpText.depth = 1;
        this.helpText.setOrigin(0.5, 1);
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
}