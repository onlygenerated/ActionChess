// Enemy spawning, timer-based movement, AI

import { CONFIG } from './config.js';
import { getValidMoves } from './pieces.js';

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

function pickEnemyType(timeElapsed) {
    const types = ['pawn'];
    if (timeElapsed >= CONFIG.ENEMY_TIER_KNIGHT) types.push('knight');
    if (timeElapsed >= CONFIG.ENEMY_TIER_BISHOP) types.push('bishop');
    if (timeElapsed >= CONFIG.ENEMY_TIER_ROOK) types.push('rook');
    if (timeElapsed >= CONFIG.ENEMY_TIER_QUEEN) types.push('queen');

    // Weight toward lower-tier pieces
    // Pawns always have highest weight, newer types have lower weight
    const weights = types.map((_, i) => Math.max(1, types.length - i));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < types.length; i++) {
        r -= weights[i];
        if (r <= 0) return types[i];
    }
    return types[0];
}

export class EnemyManager {
    constructor() {
        this.enemies = [];
    }

    reset() {
        this.enemies = [];
    }

    /**
     * Spawn enemies on newly generated rows.
     */
    spawnOnNewRows(newRows, timeElapsed, playerCol, playerRow) {
        if (this.enemies.length >= CONFIG.ENEMY_MAX_ON_SCREEN) return;

        const progress = Math.min(1, timeElapsed / CONFIG.ENEMY_SPAWN_RAMP_TIME);
        const spawnChance = CONFIG.ENEMY_BASE_SPAWN_CHANCE +
            (CONFIG.ENEMY_MAX_SPAWN_CHANCE - CONFIG.ENEMY_BASE_SPAWN_CHANCE) * progress;

        for (const row of newRows) {
            for (let col = 0; col < CONFIG.COLS; col++) {
                if (this.enemies.length >= CONFIG.ENEMY_MAX_ON_SCREEN) return;

                // Don't spawn directly on player's column when close
                if (col === playerCol && Math.abs(row - playerRow) < 5) continue;

                // Don't spawn on top of existing enemies
                if (this.getEnemyAt(col, row)) continue;

                if (Math.random() < spawnChance) {
                    const type = pickEnemyType(timeElapsed);
                    const moveInterval = randomRange(
                        Math.max(CONFIG.ENEMY_MOVE_INTERVAL_FLOOR,
                            CONFIG.ENEMY_MOVE_INTERVAL_MIN - timeElapsed * CONFIG.ENEMY_MOVE_INTERVAL_REDUCE_RATE),
                        Math.max(CONFIG.ENEMY_MOVE_INTERVAL_FLOOR + 0.5,
                            CONFIG.ENEMY_MOVE_INTERVAL_MAX - timeElapsed * CONFIG.ENEMY_MOVE_INTERVAL_REDUCE_RATE)
                    );
                    this.enemies.push({
                        type,
                        col,
                        row,
                        isPlayer: false,
                        moveTimer: moveInterval * (0.5 + Math.random() * 0.5), // stagger initial
                        moveInterval,
                        spawnRow: row, // remember where they spawned
                        // Animation
                        animating: false,
                        animProgress: 0,
                        fromCol: col,
                        fromRow: row,
                        toCol: col,
                        toRow: row,
                    });
                }
            }
        }
    }

    /**
     * Update enemy timers and move them.
     * Returns { playerCaptured: boolean } if an enemy moves onto the player.
     */
    update(dt, allPieces, playerPiece, scrollOffset) {
        const cellSize = CONFIG.CELL_SIZE;
        const canvasHeight = CONFIG.VISIBLE_ROWS * cellSize;

        // Remove enemies that have scrolled off the top
        this.enemies = this.enemies.filter(e => {
            const checkRow = e.animating ? Math.min(e.row, e.toRow) : e.row;
            const screenY = checkRow * cellSize - scrollOffset;
            return screenY + cellSize > -cellSize; // small buffer
        });

        let playerCaptured = false;

        for (const enemy of this.enemies) {
            // Update animation
            if (enemy.animating) {
                enemy.animProgress += dt / CONFIG.PLAYER_MOVE_DURATION;
                if (enemy.animProgress >= 1) {
                    enemy.animProgress = 1;
                    enemy.animating = false;
                    enemy.col = enemy.toCol;
                    enemy.row = enemy.toRow;
                }
                continue; // don't move while animating
            }

            // Don't let enemies attack until their spawn row is fully visible on screen
            // This prevents long-range pieces (bishop, rook, queen) from attacking
            // from off-screen positions
            const spawnBottomY = (enemy.spawnRow + 1) * cellSize - scrollOffset;
            const spawnRowFullyVisible = spawnBottomY <= canvasHeight;
            if (!spawnRowFullyVisible) continue;

            // Tick move timer
            enemy.moveTimer -= dt;
            if (enemy.moveTimer > 0) continue;

            // Reset timer
            enemy.moveTimer = enemy.moveInterval;

            // Get valid moves
            const moves = getValidMoves(enemy.type, enemy.col, enemy.row, false, allPieces, playerPiece);
            if (moves.length === 0) continue;

            // AI: prefer moves toward the player, with some randomness
            let chosenMove;
            const captureMoves = moves.filter(m =>
                m.col === playerPiece.col && m.row === playerPiece.row);
            if (captureMoves.length > 0) {
                // Can capture player — do it!
                chosenMove = captureMoves[0];
            } else {
                // Score moves by distance to player (prefer closer)
                const scored = moves.map(m => {
                    const dx = m.col - playerPiece.col;
                    const dy = m.row - playerPiece.row;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    return { move: m, dist };
                });
                scored.sort((a, b) => a.dist - b.dist);

                // 60% chance to pick the best move, 40% random
                if (Math.random() < 0.6) {
                    chosenMove = scored[0].move;
                } else {
                    chosenMove = scored[Math.floor(Math.random() * scored.length)].move;
                }
            }

            // Check if another enemy is on that square (don't move there)
            const occupant = this.getEnemyAt(chosenMove.col, chosenMove.row);
            if (occupant && occupant !== enemy) continue;

            // Check if this move captures the player
            if (chosenMove.col === playerPiece.col && chosenMove.row === playerPiece.row) {
                playerCaptured = true;
            }

            // Start animation
            enemy.animating = true;
            enemy.animProgress = 0;
            enemy.fromCol = enemy.col;
            enemy.fromRow = enemy.row;
            enemy.toCol = chosenMove.col;
            enemy.toRow = chosenMove.row;
        }

        return { playerCaptured };
    }

    /**
     * Tick only animations (no new moves). Used during the dying state
     * so the capturing enemy visually reaches the player's square.
     */
    updateAnimations(dt) {
        for (const enemy of this.enemies) {
            if (!enemy.animating) continue;
            enemy.animProgress += dt / CONFIG.PLAYER_MOVE_DURATION;
            if (enemy.animProgress >= 1) {
                enemy.animProgress = 1;
                enemy.animating = false;
                enemy.col = enemy.toCol;
                enemy.row = enemy.toRow;
            }
        }
    }

    getEnemyAt(col, row) {
        return this.enemies.find(e => e.col === col && e.row === row) || null;
    }

    removeEnemyAt(col, row) {
        this.enemies = this.enemies.filter(e => {
            if (e.col === col && e.row === row) return false;
            if (e.animating && e.toCol === col && e.toRow === row) return false;
            return true;
        });
    }

    /**
     * Get display position for an enemy (accounting for animation).
     */
    getDisplayPos(enemy) {
        if (!enemy.animating) {
            return { col: enemy.col, row: enemy.row };
        }
        const t = 1 - Math.pow(1 - enemy.animProgress, 3);
        return {
            col: enemy.fromCol + (enemy.toCol - enemy.fromCol) * t,
            row: enemy.fromRow + (enemy.toRow - enemy.fromRow) * t,
        };
    }
}
