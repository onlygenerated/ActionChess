// Action Chess - 3D Perspective Renderer
// Game logic reused from ../shared/, rendering replaced with Three.js

import * as THREE from 'three';
import { CONFIG } from '../shared/config3d.js';
import { Game, GameState } from '../shared/game.js';
import { Board } from '../shared/board.js';
import { Player } from '../shared/player.js';
import { EnemyManager } from '../shared/enemyManager.js';
import { Renderer3D } from './renderer3d.js';

// Three.js setup
const container = document.getElementById('game-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    60, // FOV
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const rendererGL = new THREE.WebGLRenderer({ antialias: true });
rendererGL.setSize(window.innerWidth, window.innerHeight);
rendererGL.setPixelRatio(window.devicePixelRatio);
container.appendChild(rendererGL.domElement);

// Camera position: overhead 3/4 view looking down the road
camera.position.set(0, 12, 8); // Behind and above the player
camera.lookAt(0, 0, -10); // Looking forward down the road

// Fog for depth cueing (distant enemies fade in)
scene.fog = new THREE.Fog(0x1a1a2e, 20, 60);
scene.background = new THREE.Color(0x1a1a2e);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Game state (reuse existing logic)
const game = new Game();
const board = new Board();
const player = new Player();
const enemyManager = new EnemyManager();
const renderer3d = new Renderer3D(scene, camera);

let lastTime = 0;

function getAllPieces() {
    const pieces = [];
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

function startGame() {
    game.start();
    board.reset();
    enemyManager.reset();
    renderer3d.reset();

    const startRow = CONFIG.PLAYER_START_ROW_FROM_TOP;
    player.reset(startRow);
    player.computeValidMoves(getAllPieces());
    player.showMoves = true;
}

// Input handling (raycasting for 3D click detection)
function onPointerDown(event) {
    if (game.state === GameState.MENU) {
        startGame();
        return;
    }

    if (game.state === GameState.GAME_OVER) {
        startGame();
        return;
    }

    if (game.state !== GameState.PLAYING) return;
    if (player.animating) return;

    // Raycast to detect which board square was clicked
    const rect = rendererGL.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const gridCol = renderer3d.raycastToGrid(raycaster);
    if (gridCol === null) return;

    const result = player.tryMove(gridCol.col, gridCol.row);
    if (result.moved) {
        player.captureTarget = result.captured;
    }
}

window.addEventListener('pointerdown', onPointerDown);

// Game loop
function gameLoop(timestamp) {
    const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.1) : 0;
    lastTime = timestamp;

    if (game.state === GameState.PLAYING) {
        game.update(dt);

        const displayPos = player.getDisplayPos();
        if (game.isPlayerOffScreen(displayPos.row)) {
            game.gameOver('Scrolled off the board!');
        }

        const newRows = board.update(game.scrollOffset);
        if (newRows.length > 0) {
            enemyManager.spawnOnNewRows(newRows, game.timeElapsed, player.col, player.row);
        }

        const effectivePlayer = {
            col: player.animating ? player.toCol : player.col,
            row: player.animating ? player.toRow : player.row,
        };
        const enemyResult = enemyManager.update(dt, getAllPieces(), effectivePlayer, game.scrollOffset);
        if (enemyResult.playerCaptured) {
            player.showMoves = false;
            game.startDying('Captured by an enemy!');
        }

        const wasAnimating = player.animating;
        player.update(dt);
        if (wasAnimating && !player.animating) {
            if (player.captureTarget) {
                enemyManager.removeEnemyAt(player.col, player.row);
                player.captureTarget = null;
            }
            player.computeValidMoves(getAllPieces());
            player.showMoves = true;
        }

        if (!player.animating && !wasAnimating && game.state === GameState.PLAYING) {
            if (!player._lastMoveRefresh || game.timeElapsed - player._lastMoveRefresh > 0.25) {
                player.computeValidMoves(getAllPieces());
                player.showMoves = true;
                player._lastMoveRefresh = game.timeElapsed;
            }
        }
    }

    if (game.state === GameState.DYING) {
        enemyManager.updateAnimations(dt);
        const allDone = enemyManager.enemies.every(e => !e.animating);
        if (game.updateDying(dt, allDone)) {
            game.gameOver(game.gameOverReason);
        }
    }

    // Render 3D scene
    renderer3d.render(game, board, player, enemyManager);
    rendererGL.render(scene, camera);

    requestAnimationFrame(gameLoop);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    rendererGL.setSize(window.innerWidth, window.innerHeight);
});

// Start in menu state
requestAnimationFrame(gameLoop);
