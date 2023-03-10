class Backdrop {
    /**
     * @type {Phaser.GameObjects.TileSprite}
     */
    sprite;

    static PARALLAX_FACTOR_PERC = 0.05;

    laxA = Backdrop.PARALLAX_FACTOR_PERC * 2;

    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {string} textureName
     */
    constructor(scene, x, y, w, h, textureName) {
        this.sprite = scene.add.tileSprite(x, y, w, h, textureName);
        this.sprite.setOrigin(0, 0);
    }

    /**
     * @param {number} x
     */
    setScrollDistance(x) {
        this.sprite.tilePositionX = x;
    }

    /**
     * @param {number} playerY
     */
    setParallaxDistance(playerY) {
        // -10 <-> 10% parallax based on player distance from center of screen
        const laxPercent = (playerY / SCREEN_HEIGHT * (Backdrop.PARALLAX_FACTOR_PERC * 2)) - Backdrop.PARALLAX_FACTOR_PERC;

        this.sprite.tilePositionY = laxPercent * SCREEN_HEIGHT;
    }

    /**
     * @param {number} playerVirtualX
     * @param {number} playerY
     */
    update(playerVirtualX, playerY) {
        backgroundTile.setScrollDistance(playerVirtualX);
        backgroundTile.setParallaxDistance(playerY, );
    }
}