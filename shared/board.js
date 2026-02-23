// Board model: tracks visible rows, generates new rows as they scroll in

import { CONFIG } from './config.js';

export class Board {
    constructor() {
        this.reset();
    }

    reset() {
        const initialRows = CONFIG.VISIBLE_ROWS + 10;
        this.highestRow = initialRows - 1;
        // Spawn frontier: enemies spawn 6 rows ahead of the visible bottom edge
        // so they're already on the board when the camera reveals them
        this.spawnFrontier = CONFIG.VISIBLE_ROWS + 6;
        this.lowestVisibleRow = 0;
    }

    /**
     * Called each frame. Generates board rows ahead of the camera.
     * Returns new row numbers for enemy spawning (6 rows ahead of visible bottom).
     */
    update(scrollOffset) {
        const cellSize = CONFIG.CELL_SIZE;
        const canvasHeight = CONFIG.VISIBLE_ROWS * cellSize;

        // Visible bottom row (furthest from player, top of 3D screen)
        const visibleBottomRow = Math.floor((scrollOffset + canvasHeight) / cellSize);

        // Generate board rows well ahead
        const neededRow = visibleBottomRow + 12;
        while (this.highestRow < neededRow) {
            this.highestRow++;
        }

        // Spawn enemies 6 rows ahead of the visible bottom,
        // so by the time they scroll into view they're already placed
        const spawnTarget = visibleBottomRow + 6;
        const newSpawnRows = [];
        while (this.spawnFrontier < spawnTarget) {
            this.spawnFrontier++;
            newSpawnRows.push(this.spawnFrontier);
        }

        // Update lowest visible row (for cleanup)
        this.lowestVisibleRow = Math.floor(scrollOffset / cellSize);

        return newSpawnRows;
    }

    /**
     * Convert a screen y-coordinate to a grid row.
     */
    screenYToRow(screenY, scrollOffset) {
        const worldY = screenY + scrollOffset;
        return Math.floor(worldY / CONFIG.CELL_SIZE);
    }

    /**
     * Convert a screen x-coordinate to a grid column.
     */
    screenXToCol(screenX) {
        return Math.floor(screenX / CONFIG.CELL_SIZE);
    }

    /**
     * Convert grid row to screen y (top of cell).
     */
    rowToScreenY(row, scrollOffset) {
        return row * CONFIG.CELL_SIZE - scrollOffset;
    }

    /**
     * Convert grid column to screen x (left of cell).
     */
    colToScreenX(col) {
        return col * CONFIG.CELL_SIZE;
    }
}
