// All Canvas drawing: board squares, pieces, valid-move highlights, UI

import { CONFIG } from './config.js';
import { GameState } from './game.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CONFIG.COLS * CONFIG.CELL_SIZE;
        this.canvas.height = CONFIG.VISIBLE_ROWS * CONFIG.CELL_SIZE;
    }

    draw(game, board, player, enemyManager) {
        const ctx = this.ctx;
        const cellSize = CONFIG.CELL_SIZE;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (game.state === GameState.MENU) {
            this.drawMenu(ctx, w, h);
            return;
        }

        // Draw board
        this.drawBoard(ctx, game.scrollOffset, cellSize, w, h);

        // Draw valid moves
        if (player.showMoves && !player.animating) {
            this.drawValidMoves(ctx, player.validMoves, game.scrollOffset, cellSize);
        }

        // Draw enemies
        for (const enemy of enemyManager.enemies) {
            const pos = enemyManager.getDisplayPos(enemy);
            this.drawPiece(ctx, pos.col, pos.row, enemy.type, false, game.scrollOffset, cellSize);
        }

        // Draw player
        const ppos = player.getDisplayPos();
        this.drawPiece(ctx, ppos.col, ppos.row, player.type, true, game.scrollOffset, cellSize);

        // Draw HUD
        this.drawHUD(ctx, game, w);

        // Draw game over overlay
        if (game.state === GameState.GAME_OVER) {
            this.drawGameOver(ctx, game, w, h);
        }
    }

    drawBoard(ctx, scrollOffset, cellSize, w, h) {
        const firstRow = Math.floor(scrollOffset / cellSize);
        const lastRow = Math.ceil((scrollOffset + h) / cellSize);

        for (let row = firstRow; row <= lastRow; row++) {
            const screenY = row * cellSize - scrollOffset;
            for (let col = 0; col < CONFIG.COLS; col++) {
                const screenX = col * cellSize;
                const isDark = (row + col) % 2 === 1;
                ctx.fillStyle = isDark ? CONFIG.DARK_SQUARE : CONFIG.LIGHT_SQUARE;
                ctx.fillRect(screenX, screenY, cellSize, cellSize);
            }
        }
    }

    drawValidMoves(ctx, moves, scrollOffset, cellSize) {
        for (const move of moves) {
            const screenX = move.col * cellSize;
            const screenY = move.row * cellSize - scrollOffset;

            if (move.isCapture) {
                // Draw capture indicator (ring)
                ctx.fillStyle = CONFIG.VALID_CAPTURE_COLOR;
                ctx.fillRect(screenX, screenY, cellSize, cellSize);
                ctx.strokeStyle = 'rgba(220, 60, 60, 0.8)';
                ctx.lineWidth = 3;
                ctx.strokeRect(screenX + 2, screenY + 2, cellSize - 4, cellSize - 4);
            } else {
                // Draw move indicator (dot)
                ctx.fillStyle = CONFIG.VALID_MOVE_COLOR;
                const cx = screenX + cellSize / 2;
                const cy = screenY + cellSize / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.18, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawPiece(ctx, col, row, type, isPlayer, scrollOffset, cellSize) {
        const screenX = col * cellSize + cellSize / 2;
        const screenY = row * cellSize - scrollOffset + cellSize / 2;

        // Don't draw if off screen
        if (screenY < -cellSize || screenY > this.canvas.height + cellSize) return;

        const symbols = CONFIG.PIECE_SYMBOLS[type];
        const symbol = isPlayer ? symbols.player : symbols.enemy;
        const fontSize = Math.floor(cellSize * CONFIG.PIECE_FONT_SIZE_RATIO);

        // Draw a subtle shadow/bg circle for readability
        if (isPlayer) {
            ctx.fillStyle = 'rgba(0, 100, 200, 0.35)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, cellSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = 'rgba(200, 50, 50, 0.3)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, cellSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.font = `${fontSize}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isPlayer ? CONFIG.PLAYER_COLOR : CONFIG.ENEMY_COLOR;
        ctx.fillText(symbol, screenX, screenY + 2);
    }

    drawHUD(ctx, game, w) {
        const barHeight = 36;
        ctx.fillStyle = CONFIG.HUD_BG;
        ctx.fillRect(0, 0, w, barHeight);

        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = CONFIG.HUD_TEXT;
        ctx.fillText(`Score: ${game.score}`, 12, barHeight / 2);

        ctx.textAlign = 'right';
        const mins = Math.floor(game.timeElapsed / 60);
        const secs = Math.floor(game.timeElapsed % 60);
        ctx.fillText(`Time: ${mins}:${secs.toString().padStart(2, '0')}`, w - 12, barHeight / 2);
    }

    drawMenu(ctx, w, h) {
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);

        // Draw a decorative checkerboard in the background
        const cellSize = CONFIG.CELL_SIZE;
        for (let row = 0; row < CONFIG.VISIBLE_ROWS; row++) {
            for (let col = 0; col < CONFIG.COLS; col++) {
                const isDark = (row + col) % 2 === 1;
                ctx.fillStyle = isDark ? 'rgba(181, 136, 99, 0.15)' : 'rgba(240, 217, 181, 0.1)';
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }

        // Title
        ctx.font = 'bold 48px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('♕ Action Chess', w / 2, h * 0.3);

        // Subtitle
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Survive the scrolling board!', w / 2, h * 0.4);

        // Instructions
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText('Click to move your Queen', w / 2, h * 0.5);
        ctx.fillText('Capture enemies, avoid being captured', w / 2, h * 0.55);
        ctx.fillText("Don't get scrolled off the top!", w / 2, h * 0.6);

        // Start button
        ctx.fillStyle = 'rgba(0, 150, 100, 0.8)';
        const btnW = 200;
        const btnH = 50;
        const btnX = (w - btnW) / 2;
        const btnY = h * 0.72;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 10);
        ctx.fill();

        ctx.font = 'bold 22px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText('Start Game', w / 2, btnY + btnH / 2);
    }

    drawGameOver(ctx, game, w, h) {
        // Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 40px serif';
        ctx.fillStyle = '#ff4444';
        ctx.fillText('Game Over', w / 2, h * 0.3);

        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.fillText(game.gameOverReason, w / 2, h * 0.4);

        ctx.font = 'bold 24px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Score: ${game.score}`, w / 2, h * 0.5);

        const mins = Math.floor(game.timeElapsed / 60);
        const secs = Math.floor(game.timeElapsed % 60);
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Survived: ${mins}:${secs.toString().padStart(2, '0')}`, w / 2, h * 0.57);

        // Restart button
        ctx.fillStyle = 'rgba(0, 150, 100, 0.8)';
        const btnW = 200;
        const btnH = 50;
        const btnX = (w - btnW) / 2;
        const btnY = h * 0.68;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 10);
        ctx.fill();

        ctx.font = 'bold 20px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Play Again', w / 2, btnY + btnH / 2);
    }

    /**
     * Check if a click is on the start/restart button.
     */
    isButtonClick(x, y, gameState) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const btnW = 200;
        const btnH = 50;
        const btnX = (w - btnW) / 2;
        const btnY = gameState === GameState.MENU ? h * 0.72 : h * 0.68;

        return x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH;
    }
}
