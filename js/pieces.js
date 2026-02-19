// Piece type definitions and movement rule validation

import { CONFIG } from './config.js';

/**
 * Check if a grid position is within column bounds.
 */
function inBounds(col, row) {
    return col >= 0 && col < CONFIG.COLS;
    // row bounds are not checked here — rows are infinite
}

/**
 * Get all pieces occupying the board for collision checks.
 * Returns a Map keyed by "col,row" for O(1) lookup.
 */
function buildOccupancyMap(allPieces) {
    const map = new Map();
    for (const p of allPieces) {
        map.set(`${p.col},${p.row}`, p);
    }
    return map;
}

/**
 * Check whether a square is occupied.
 * Returns null if empty, or the piece object if occupied.
 */
function getPieceAt(col, row, occupancy) {
    return occupancy.get(`${col},${row}`) || null;
}

/**
 * Generate valid moves for a piece given its type and position.
 * @param {string} type - king, queen, rook, bishop, knight, pawn
 * @param {number} col
 * @param {number} row
 * @param {boolean} isPlayer - affects pawn direction and capture logic
 * @param {Array} allPieces - all pieces on the board (for blocking)
 * @param {object} playerPiece - the player piece (so enemies know where player is)
 * @returns {Array<{col, row, isCapture}>}
 */
export function getValidMoves(type, col, row, isPlayer, allPieces, playerPiece) {
    const occupancy = buildOccupancyMap(allPieces);
    const moves = [];

    function addSliding(directions) {
        for (const [dc, dr] of directions) {
            for (let dist = 1; dist < 20; dist++) {
                const nc = col + dc * dist;
                const nr = row + dr * dist;
                if (!inBounds(nc, nr)) break;
                const occupant = getPieceAt(nc, nr, occupancy);
                if (occupant) {
                    // Can capture opponent pieces
                    if (isPlayer !== occupant.isPlayer) {
                        moves.push({ col: nc, row: nr, isCapture: true });
                    }
                    break; // blocked either way
                }
                moves.push({ col: nc, row: nr, isCapture: false });
            }
        }
    }

    function addStepping(offsets) {
        for (const [dc, dr] of offsets) {
            const nc = col + dc;
            const nr = row + dr;
            if (!inBounds(nc, nr)) continue;
            const occupant = getPieceAt(nc, nr, occupancy);
            if (occupant) {
                if (isPlayer !== occupant.isPlayer) {
                    moves.push({ col: nc, row: nr, isCapture: true });
                }
                continue;
            }
            moves.push({ col: nc, row: nr, isCapture: false });
        }
    }

    const diag = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const ortho = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const allDirs = [...diag, ...ortho];

    switch (type) {
        case 'queen':
            addSliding(allDirs);
            break;
        case 'rook':
            addSliding(ortho);
            break;
        case 'bishop':
            addSliding(diag);
            break;
        case 'king':
            addStepping(allDirs);
            break;
        case 'knight':
            addStepping([
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ]);
            break;
        case 'pawn': {
            // Higher row number = lower on screen (entered later from bottom).
            // Player wants to move DOWN screen (higher row) to survive the upward scroll.
            // Enemy pawns move UP screen (lower row) toward the player.
            const fwd = isPlayer ? 1 : -1;

            // Forward move (no capture)
            const fc = col;
            const fr = row + fwd;
            if (inBounds(fc, fr) && !getPieceAt(fc, fr, occupancy)) {
                moves.push({ col: fc, row: fr, isCapture: false });
            }
            // Diagonal captures
            for (const dc of [-1, 1]) {
                const nc = col + dc;
                const nr = row + fwd;
                if (!inBounds(nc, nr)) continue;
                const occupant = getPieceAt(nc, nr, occupancy);
                if (occupant && isPlayer !== occupant.isPlayer) {
                    moves.push({ col: nc, row: nr, isCapture: true });
                }
            }
            break;
        }
    }

    return moves;
}
