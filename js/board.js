// Board model: tracks visible rows, generates new rows as they scroll in

import { CONFIG } from './config.js';

export class Board {
    constructor() {
        this.reset();
    }

    reset() {
        // The highest row number that has been generated
        // We start by generating enough rows to fill the visible area plus a buffer
        const initialRows = CONFIG.VISIBLE_ROWS + 4;
        this.highestRow = initialRows - 1;
        this.lowestVisibleRow = 0;
    }

    /**
     * Called each frame. Determines if new rows need generating based on scrollOffset.
     * Returns an array of new row numbers that just appeared.
     */
    update(scrollOffset) {
        const cellSize = CONFIG.CELL_SIZE;
        const canvasHeight = CONFIG.VISIBLE_ROWS * cellSize;

        // The bottom of the canvas in world-y is scrollOffset + canvasHeight.
        // A row R has its top at R * cellSize.
        // Row R is visible if R * cellSize < scrollOffset + canvasHeight
        //   and (R + 1) * cellSize > scrollOffset.
        // We need to ensure rows exist for anything near the bottom.
        const bottomWorldY = scrollOffset + canvasHeight;
        const neededRow = Math.floor(bottomWorldY / cellSize) + 1;

        const newRows = [];
        while (this.highestRow < neededRow) {
            this.highestRow++;
            newRows.push(this.highestRow);
        }

        // Update lowest visible row (for cleanup)
        this.lowestVisibleRow = Math.floor(scrollOffset / cellSize);

        return newRows;
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
