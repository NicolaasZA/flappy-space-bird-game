class Backdrop {
    /**
     * @type {Phaser.GameObjects.TileSprite}
     */
    sprite;

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
}