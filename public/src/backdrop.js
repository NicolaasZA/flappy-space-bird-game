class Backdrop {
    /**
     * @type {Phaser.GameObjects.TileSprite}
     */
    sprite;

    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene, x, y, w, h, textureName) {
        this.sprite = scene.add.tileSprite(x, y, w ,h, textureName)
    }

    setScrollDistance(x) {
        this.sprite.tilePositionX = x;
    }

    setTilePositionY(y) {
        this.sprite.tilePositionY = y;
    }
}