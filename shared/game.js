// Core game state: scroll offset, score, game-over logic

import { CONFIG } from './config.js';

export const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    DYING: 'dying',
    GAME_OVER: 'gameover',
};

export class Game {
    constructor() {
        this.highScore = this.loadHighScore();
        this.reset();
    }

    reset() {
        this.state = GameState.MENU;
        this.scrollOffset = 0;
        this.score = 0;
        this.timeElapsed = 0;
        this.gameOverReason = '';
        this.dyingTimer = 0;
    }

    loadHighScore() {
        try {
            const saved = localStorage.getItem('actionchess_highscore');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    saveHighScore() {
        try {
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('actionchess_highscore', this.score.toString());
            }
        } catch (e) {
            // localStorage might be disabled
        }
    }

    start() {
        this.state = GameState.PLAYING;
        this.scrollOffset = 0;
        this.score = 0;
        this.timeElapsed = 0;
        this.gameOverReason = '';
        this.dyingTimer = 0;
    }

    update(dt) {
        if (this.state !== GameState.PLAYING) return;

        this.timeElapsed += dt;
        this.scrollOffset += CONFIG.SCROLL_SPEED * dt;
        this.score = Math.floor(this.timeElapsed);
    }

    /**
     * Check if the player has scrolled off the top.
     * @param {number} playerRow
     * @returns {boolean}
     */
    isPlayerOffScreen(playerRow) {
        const screenY = playerRow * CONFIG.CELL_SIZE - this.scrollOffset;
        // Player is off-screen if the bottom of their cell is above the canvas
        return (screenY + CONFIG.CELL_SIZE) < 0;
    }

    /**
     * Begin the dying sequence — freeze the board, let the capture animate,
     * then show game over after a delay.
     */
    startDying(reason) {
        this.state = GameState.DYING;
        this.gameOverReason = reason;
        this.dyingTimer = 0;
    }

    /**
     * Tick the dying timer. Returns true when it's time to show game over.
     */
    updateDying(dt, animationsFinished) {
        if (this.state !== GameState.DYING) return false;
        // Wait for capture animation to finish, then hold for a beat
        if (animationsFinished) {
            this.dyingTimer += dt;
        }
        return this.dyingTimer >= 0.45;
    }

    gameOver(reason) {
        this.state = GameState.GAME_OVER;
        this.gameOverReason = reason;
        this.saveHighScore();
    }
}
