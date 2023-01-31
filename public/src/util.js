class GameState {
    static START = 0;
    static PLAYING = 1;
}

class Point {
    x = 0;
    y = 0;

    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
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

    /**
     * @param {number} left
     * @param {number} right
     * @param {number} top
     * @param {number} bottom
     */
    constructor(left, right, top, bottom, originAtCenter = false) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;

        this.width = Math.abs(this.right - this.left);
        this.height = Math.abs(this.bottom - this.top);

        if (originAtCenter) {
            this.x = left + (this.width / 2);
            this.y = top + (this.height / 2);
        } else {
            this.x = left + 0;
            this.y = top + 0;
        }
    }
}