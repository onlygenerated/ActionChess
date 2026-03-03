// Action Chess - 3D Perspective Renderer
// Game logic reused from ../shared/, rendering replaced with Three.js

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CONFIG } from '../shared/config.js';
import { Game, GameState } from '../shared/game.js';
import { Board } from '../shared/board.js';
import { Player } from '../shared/player.js';
import { EnemyManager } from '../shared/enemyManager.js';
import { Renderer3D } from './renderer3d.js';
import { ParticleSystem } from './particles.js';

// Three.js setup
const container = document.getElementById('game-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    50, // Narrower FOV for more top-down feel
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

const rendererGL = new THREE.WebGLRenderer({ antialias: true });
rendererGL.setSize(window.innerWidth, window.innerHeight);
rendererGL.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap for performance
container.appendChild(rendererGL.domElement);

// Camera position: steep overhead view, tilted to show more rows ahead
camera.position.set(0, 22, 6);
camera.lookAt(0, 0, -10);

// Subtle fog
scene.fog = new THREE.Fog(0x1a1a2e, 35, 50);
scene.background = new THREE.Color(0x1a1a2e);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Post-processing: bloom
const composer = new EffectComposer(rendererGL);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3,  // strength
    0.4,  // radius
    0.85  // threshold
);
composer.addPass(bloomPass);

// Game state (reuse existing logic)
const game = new Game();
const board = new Board();
const player = new Player();
const enemyManager = new EnemyManager();
const renderer3d = new Renderer3D(scene, camera);
const particles = new ParticleSystem(scene);

let lastTime = 0;
let selectedSquare = null;

// Track state for visual events
let _deathShakeTriggered = false;
let _lastCaptureCheck = new Set();
let _unlockedTiers = new Set();
let _lastMilestone = 0;

// UI elements
const hudScore = document.getElementById('score');
const hudHighScore = document.getElementById('highscore');
const menuOverlay = document.getElementById('menu-overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');
const gameoverReason = document.getElementById('gameover-reason');
const gameoverScore = document.getElementById('gameover-score');
const gameoverHighScore = document.getElementById('gameover-highscore');
const unlockNotification = document.getElementById('unlock-notification');

// Add click/touch handlers to overlays for menu/restart
function handleMenuClick() {
    if (game.state === GameState.MENU) {
        startGame();
    }
}

function handleGameOverClick() {
    if (game.state === GameState.GAME_OVER) {
        startGame();
    }
}

menuOverlay.addEventListener('click', handleMenuClick);
menuOverlay.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleMenuClick();
});

gameoverOverlay.addEventListener('click', handleGameOverClick);
gameoverOverlay.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleGameOverClick();
});

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

    _deathShakeTriggered = false;
    _lastCaptureCheck = new Set();
    _unlockedTiers = new Set();
    _lastMilestone = 0;

    const startRow = CONFIG.PLAYER_START_ROW_FROM_TOP;
    player.reset(startRow);
    player.computeValidMoves(getAllPieces());
    player.showMoves = true;
}

// Helper: get world position for a grid cell
function cellToWorld(col, row) {
    const x = (col - CONFIG.COLS / 2) * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
    const z = -row * CONFIG.CELL_SIZE;
    return { x, y: 0.3, z };
}

// --- Piece unlock notification ---
const UNLOCK_TIERS = [
    { time: CONFIG.ENEMY_TIER_KNIGHT, type: 'knight', name: 'Knights' },
    { time: CONFIG.ENEMY_TIER_BISHOP, type: 'bishop', name: 'Bishops' },
    { time: CONFIG.ENEMY_TIER_ROOK,   type: 'rook',   name: 'Rooks' },
    { time: CONFIG.ENEMY_TIER_QUEEN,  type: 'queen',  name: 'Queens' },
];

let _unlockTimeout = null;

function showUnlockNotification(name, symbol) {
    if (!unlockNotification) return;
    unlockNotification.textContent = `${symbol} ${name} Unlocked!`;
    unlockNotification.classList.remove('hidden');
    unlockNotification.classList.add('unlock-flash');

    if (_unlockTimeout) clearTimeout(_unlockTimeout);
    _unlockTimeout = setTimeout(() => {
        unlockNotification.classList.add('hidden');
        unlockNotification.classList.remove('unlock-flash');
    }, 2000);
}

function checkUnlocks(timeElapsed) {
    for (const tier of UNLOCK_TIERS) {
        if (timeElapsed >= tier.time && !_unlockedTiers.has(tier.type)) {
            _unlockedTiers.add(tier.type);
            const symbol = CONFIG.PIECE_SYMBOLS[tier.type].enemy;
            showUnlockNotification(tier.name, symbol);
        }
    }
}

// --- Score milestones ---
function checkMilestones(timeElapsed) {
    const milestone = Math.floor(timeElapsed / 30) * 30;
    if (milestone > 0 && milestone > _lastMilestone) {
        _lastMilestone = milestone;
        // Particle ring around player
        const ppos = player.getDisplayPos();
        const wp = cellToWorld(ppos.col, ppos.row);
        particles.ring(wp.x, wp.y, wp.z, 0xffd700, 40);

        // Flash HUD score gold
        hudScore.parentElement.classList.add('score-flash');
        setTimeout(() => hudScore.parentElement.classList.remove('score-flash'), 600);
    }
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

    const rect = rendererGL.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const gridCol = renderer3d.raycastToGrid(raycaster);
    if (gridCol === null) {
        selectedSquare = null;
        renderer3d.setHighlightedSquare(null);
        return;
    }

    const isValidMove = player.validMoves.some(
        m => m.col === gridCol.col && m.row === gridCol.row
    );

    if (!isValidMove) {
        selectedSquare = null;
        renderer3d.setHighlightedSquare(null);
        return;
    }

    // Single click to move immediately
    const result = player.tryMove(gridCol.col, gridCol.row);
    if (result.moved) {
        player.captureTarget = result.captured;
        selectedSquare = null;
        renderer3d.setHighlightedSquare(null);
    }
}

window.addEventListener('pointerdown', onPointerDown);

// Build a set of enemy identity keys for capture detection
function getEnemyKeySet() {
    const keys = new Set();
    for (const e of enemyManager.enemies) {
        keys.add(`${e.col},${e.row}`);
    }
    return keys;
}

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

        // Snapshot enemy set before update (for capture particle detection)
        const enemiesBefore = getEnemyKeySet();

        const effectivePlayer = {
            col: player.animating ? player.toCol : player.col,
            row: player.animating ? player.toRow : player.row,
        };
        const enemyResult = enemyManager.update(dt, getAllPieces(), effectivePlayer, game.scrollOffset);
        if (enemyResult.playerCaptured) {
            player.showMoves = false;
            const pieceName = enemyResult.capturingPiece ? enemyResult.capturingPiece.type : 'an enemy';
            game.startDying(`Captured by ${pieceName}!`);
        }

        const wasAnimating = player.animating;
        player.update(dt);
        if (wasAnimating && !player.animating) {
            if (player.captureTarget) {
                // Trigger capture particles at the capture location
                const wp = cellToWorld(player.col, player.row);
                particles.burst(wp.x, wp.y, wp.z, 0x333333, 25);

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

        // Check for unlock notifications and milestones
        checkUnlocks(game.timeElapsed);
        checkMilestones(game.timeElapsed);
    }

    if (game.state === GameState.DYING) {
        // Camera shake on death (trigger once)
        if (!_deathShakeTriggered) {
            _deathShakeTriggered = true;
            renderer3d.triggerShake(0.5);

            // Bright particles at player position
            const ppos = player.getDisplayPos();
            const wp = cellToWorld(ppos.col, ppos.row);
            particles.burst(wp.x, wp.y, wp.z, 0xffffff, 40);
        }

        enemyManager.updateAnimations(dt);
        const allDone = enemyManager.enemies.every(e => !e.animating);
        if (game.updateDying(dt, allDone)) {
            game.gameOver(game.gameOverReason);
        }
    }

    // Update particles
    particles.update(dt);

    // Update UI
    updateUI();

    // Render 3D scene with post-processing
    renderer3d.render(game, board, player, enemyManager, dt);
    composer.render();

    requestAnimationFrame(gameLoop);
}

function updateUI() {
    hudScore.textContent = game.score;
    hudHighScore.textContent = game.highScore;

    if (game.state === GameState.MENU) {
        menuOverlay.classList.remove('hidden');
        gameoverOverlay.classList.add('hidden');
    } else if (game.state === GameState.GAME_OVER) {
        menuOverlay.classList.add('hidden');
        gameoverOverlay.classList.remove('hidden');
        gameoverReason.textContent = game.gameOverReason;
        gameoverScore.textContent = `Score: ${game.score}`;
        const isNewHighScore = game.score === game.highScore && game.score > 0;
        gameoverHighScore.textContent = isNewHighScore
            ? `New High Score!`
            : `High Score: ${game.highScore}`;
    } else {
        menuOverlay.classList.add('hidden');
        gameoverOverlay.classList.add('hidden');
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    rendererGL.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// --- Board effect toggles ---
const EFFECT_DEFAULTS = {
    curve: { key: 'BOARD_CURVE_RADIUS', on: 40, off: 0 },
    wave:  { key: 'BOARD_WAVE_AMPLITUDE', on: 0.4, off: 0 },
    twist: { key: 'BOARD_TWIST_RATE', on: 0.015, off: 0 },
};

document.getElementById('toggle-curve').addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.classList.toggle('active');
    const d = EFFECT_DEFAULTS.curve;
    CONFIG[d.key] = btn.classList.contains('active') ? d.on : d.off;
});
document.getElementById('toggle-wave').addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.classList.toggle('active');
    const d = EFFECT_DEFAULTS.wave;
    CONFIG[d.key] = btn.classList.contains('active') ? d.on : d.off;
});
document.getElementById('toggle-twist').addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.classList.toggle('active');
    const d = EFFECT_DEFAULTS.twist;
    CONFIG[d.key] = btn.classList.contains('active') ? d.on : d.off;
});

// Start in menu state
requestAnimationFrame(gameLoop);
