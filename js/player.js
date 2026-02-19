// Player state, click-to-move input, move animation

import { CONFIG } from './config.js';
import { getValidMoves } from './pieces.js';

export class Player {
    constructor() {
        this.reset(0);
    }

    reset(startRow) {
        this.col = CONFIG.PLAYER_START_COL;
        this.row = startRow;
        this.type = 'queen';
        this.isPlayer = true;

        // Animation state
        this.animating = false;
        this.animProgress = 0;
        this.fromCol = this.col;
        this.fromRow = this.row;
        this.toCol = this.col;
        this.toRow = this.row;

        // Cached valid moves
        this.validMoves = [];
        this.showMoves = false;
    }

    /**
     * Compute and cache valid moves.
     */
    computeValidMoves(allPieces) {
        this.validMoves = getValidMoves(this.type, this.col, this.row, true, allPieces, this);
    }

    /**
     * Attempt to move to the given grid square.
     * Returns: { moved: boolean, captured: piece|null }
     */
    tryMove(targetCol, targetRow) {
        if (this.animating) return { moved: false, captured: null };

        const move = this.validMoves.find(m => m.col === targetCol && m.row === targetRow);
        if (!move) return { moved: false, captured: null };

        // Start animation
        this.animating = true;
        this.animProgress = 0;
        this.fromCol = this.col;
        this.fromRow = this.row;
        this.toCol = targetCol;
        this.toRow = targetRow;

        return { moved: true, captured: move.isCapture ? { col: targetCol, row: targetRow } : null };
    }

    update(dt) {
        if (!this.animating) return;

        this.animProgress += dt / CONFIG.PLAYER_MOVE_DURATION;
        if (this.animProgress >= 1) {
            this.animProgress = 1;
            this.animating = false;
            this.col = this.toCol;
            this.row = this.toRow;
        }
    }

    /**
     * Get the current display position (accounting for animation).
     */
    getDisplayPos() {
        if (!this.animating) {
            return { col: this.col, row: this.row };
        }
        // Smooth easing (ease-out)
        const t = 1 - Math.pow(1 - this.animProgress, 3);
        return {
            col: this.fromCol + (this.toCol - this.fromCol) * t,
            row: this.fromRow + (this.toRow - this.fromRow) * t,
        };
    }
}
