class KillFeed {

    /** @type {Array<Phaser.GameObjects.Text>} */
    slots = [];

    /** @type {Array<KillFeedEntry>} */
    entries = [];

    static STYLING = { fontFamily: 'bahaha, cursive', fontSize: '22px' };
    static TEXT_SPACING = 25;
    static SLOT_COUNT = 6;

    /**
     * @param {Phaser.Scene} scene
     * @param {number} topRightX
     * @param {number} topRightY
     */
    constructor(scene, topRightX, topRightY) {
        this.slots = [];

        for (let i = 0; i < KillFeed.SLOT_COUNT; i++) {
            const textEntry = scene.add.text(topRightX, topRightY + (KillFeed.TEXT_SPACING * i), '', KillFeed.STYLING);
            textEntry.setOrigin(1, 0);
            textEntry.depth = 1;

            this.slots.push(textEntry);
        }
    }

    addKill(playerName, score) {
        this.entries.push(new KillFeedEntry(playerName, score));
    }

    update() {
        this.entries = this.entries.filter((entry) => entry.expires > Date.now());

        const drawable = this.entries.slice(0, KillFeed.SLOT_COUNT).map((e) => e.getText());
        while (drawable.length < KillFeed.SLOT_COUNT) {
            drawable.push('');
        }
        drawable.forEach((entry, idx) => {
            this.slots[idx].text = entry;
        });
    }
}

class KillFeedEntry {

    /** @type {string} */
    playerName;
    /** @type {number} */
    score;
    /** @type {number} */
    expires;

    static LIFETIME_MS = 3000;
    static SCORE_PAD_LENGTH = 4;

    /**
     * @param {string} playerName
     * @param {number} score
     */
    constructor(playerName, score) {
        this.playerName = (playerName ?? '').slice(0, 4);
        this.score = Math.floor(score);

        this.expires = Date.now() + KillFeedEntry.LIFETIME_MS;
    }

    getFormattedScore() {
        let result = (this.score ?? '') + '';
        while (result.length < KillFeedEntry.SCORE_PAD_LENGTH) {
            result = '0' + result;
        }
        return result;
    }

    getText() {
        return `${this.playerName} 💀 ${this.getFormattedScore()}`;
    }
}