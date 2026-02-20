// Game initialization and game loop

import { CONFIG } from './config.js';
import { Game, GameState } from './game.js';
import { Board } from './board.js';
import { Player } from './player.js';
import { EnemyManager } from './enemyManager.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas);
const game = new Game();
const board = new Board();
const player = new Player();
const enemyManager = new EnemyManager();

let lastTime = 0;

function startGame() {
    game.start();
    board.reset();
    enemyManager.reset();

    // Player starts near the top-middle of the initial view
    const startRow = CONFIG.PLAYER_START_ROW_FROM_TOP;
    player.reset(startRow);
    player.computeValidMoves(getAllPieces());
    player.showMoves = true;
}

function getAllPieces() {
    const pieces = [];
    // Use destination position during animation so enemies target the right square
    pieces.push({
        col: player.animating ? player.toCol : player.col,
        row: player.animating ? player.toRow : player.row,
        isPlayer: true,
        type: player.type,
    });
    for (const e of enemyManager.enemies) {
        pieces.push({
            col: e.animating ? e.toCol : e.col,
            row: e.animating ? e.toRow : e.row,
            isPlayer: false,
            type: e.type,
        });
    }
    return pieces;
}

// ---- Input handling ----

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Scale click coordinates to match internal canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (game.state === GameState.MENU) {
        if (renderer.isButtonClick(x, y, GameState.MENU)) {
            startGame();
        }
        return;
    }

    if (game.state === GameState.GAME_OVER) {
        if (renderer.isButtonClick(x, y, GameState.GAME_OVER)) {
            startGame();
        }
        return;
    }

    if (game.state !== GameState.PLAYING) return;
    if (player.animating) return;

    // Convert click to grid coordinates
    const col = board.screenXToCol(x);
    const row = board.screenYToRow(y, game.scrollOffset);

    // Try to move player
    const result = player.tryMove(col, row);
    if (result.moved) {
        // Store the intended capture target to check when animation completes
        player.captureTarget = result.captured;
        // Don't remove immediately — wait until animation completes to handle collision
    }
});

// ---- Game loop ----

function gameLoop(timestamp) {
    const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.1) : 0;
    lastTime = timestamp;

    if (game.state === GameState.PLAYING) {
        // Update game (scroll, score)
        game.update(dt);

        // Check if player scrolled off (use visual position)
        const displayPos = player.getDisplayPos();
        if (game.isPlayerOffScreen(displayPos.row)) {
            game.gameOver('Scrolled off the board!');
        }

        // Update board — generate new rows
        const newRows = board.update(game.scrollOffset);

        // Spawn enemies on new rows
        if (newRows.length > 0) {
            enemyManager.spawnOnNewRows(newRows, game.timeElapsed, player.col, player.row);
        }

        // Update enemies — pass effective player position (destination during animation)
        const effectivePlayer = {
            col: player.animating ? player.toCol : player.col,
            row: player.animating ? player.toRow : player.row,
        };
        const enemyResult = enemyManager.update(dt, getAllPieces(), effectivePlayer, game.scrollOffset);
        if (enemyResult.playerCaptured) {
            // Don't end immediately — enter dying state so the capture animates first
            player.showMoves = false;
            game.startDying('Captured by an enemy!');
        }

        // Update player animation
        const wasAnimating = player.animating;
        player.update(dt);
        if (wasAnimating && !player.animating) {
            // Animation just finished — check for capture
            if (player.captureTarget) {
                // Remove any enemy at the player's current position
                enemyManager.removeEnemyAt(player.col, player.row);
                player.captureTarget = null;
            }
            // Recompute valid moves
            player.computeValidMoves(getAllPieces());
            player.showMoves = true;
        }

        // Recompute valid moves when enemies finish animating (board state changed)
        if (!player.animating && !wasAnimating && game.state === GameState.PLAYING) {
            // Only recompute periodically to avoid per-frame waste
            if (!player._lastMoveRefresh || game.timeElapsed - player._lastMoveRefresh > 0.25) {
                player.computeValidMoves(getAllPieces());
                player.showMoves = true;
                player._lastMoveRefresh = game.timeElapsed;
            }
        }
    }

    if (game.state === GameState.DYING) {
        // Keep enemy animations ticking so the capture visually completes
        enemyManager.updateAnimations(dt);

        // Check if all enemy animations are done
        const allDone = enemyManager.enemies.every(e => !e.animating);
        if (game.updateDying(dt, allDone)) {
            game.gameOver(game.gameOverReason);
        }
    }

    // Draw everything
    renderer.draw(game, board, player, enemyManager);

    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame(gameLoop);
