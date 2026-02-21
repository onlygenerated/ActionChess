// Three.js renderer for Action Chess
// Handles 3D board, pieces, fog, camera follow

import * as THREE from 'three';
import { CONFIG } from '../shared/config3d.js';
import { GameState } from '../shared/game.js';

export class Renderer3D {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // Track created board squares and pieces for updates
        this.boardSquares = new Map(); // key: "col,row" -> mesh
        this.pieceMeshes = new Map(); // key: piece object -> mesh
        this.validMoveMeshes = [];
        this.highlightedSquare = null; // For mobile tap-to-select UX
        this.highlightMesh = null;

        // Create initial board grid
        this.initializeBoard();
    }

    reset() {
        // Clear all pieces
        for (const mesh of this.pieceMeshes.values()) {
            this.scene.remove(mesh);
        }
        this.pieceMeshes.clear();
        this.clearValidMoves();
    }

    initializeBoard() {
        // Create board squares (generate ahead as needed, cull behind)
        // Board extends along negative Z (forward direction)
        const geometry = new THREE.PlaneGeometry(CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);

        for (let row = 0; row < 100; row++) { // Initial 100 rows
            for (let col = 0; col < CONFIG.COLS; col++) {
                const isDark = (row + col) % 2 === 1;
                const material = new THREE.MeshLambertMaterial({
                    color: isDark ? CONFIG.DARK_SQUARE : CONFIG.LIGHT_SQUARE,
                });
                const square = new THREE.Mesh(geometry, material);

                // Position: X = column, Z = -row (moving down the road)
                const x = (col - CONFIG.COLS / 2) * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
                const z = -row * CONFIG.CELL_SIZE;
                square.position.set(x, 0, z);
                square.rotation.x = -Math.PI / 2; // Horizontal plane

                this.scene.add(square);
                this.boardSquares.set(`${col},${row}`, square);
            }
        }
    }

    /**
     * Raycast from camera to board to determine which grid square was clicked
     */
    raycastToGrid(raycaster) {
        const intersects = raycaster.intersectObjects(
            Array.from(this.boardSquares.values())
        );
        if (intersects.length === 0) return null;

        // Find which square was clicked
        for (const [key, mesh] of this.boardSquares.entries()) {
            if (mesh === intersects[0].object) {
                const [col, row] = key.split(',').map(Number);
                return { col, row };
            }
        }
        return null;
    }

    clearValidMoves() {
        for (const mesh of this.validMoveMeshes) {
            this.scene.remove(mesh);
        }
        this.validMoveMeshes = [];
    }

    setHighlightedSquare(square) {
        // Remove old highlight
        if (this.highlightMesh) {
            this.scene.remove(this.highlightMesh);
            this.highlightMesh = null;
        }

        this.highlightedSquare = square;

        if (square) {
            // Add new highlight - bright ring around selected square
            const geometry = new THREE.RingGeometry(CONFIG.CELL_SIZE * 0.45, CONFIG.CELL_SIZE * 0.5, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffff00, // Bright yellow
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            this.highlightMesh = new THREE.Mesh(geometry, material);

            const x = (square.col - CONFIG.COLS / 2) * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
            const z = -square.row * CONFIG.CELL_SIZE;
            this.highlightMesh.position.set(x, 0.06, z); // Slightly above board
            this.highlightMesh.rotation.x = -Math.PI / 2;

            this.scene.add(this.highlightMesh);
        }
    }

    drawValidMoves(moves, scrollOffset) {
        this.clearValidMoves();

        for (const move of moves) {
            const geometry = new THREE.CircleGeometry(CONFIG.CELL_SIZE * 0.18, 16);
            const color = move.isCapture ? CONFIG.VALID_CAPTURE_COLOR : CONFIG.VALID_MOVE_COLOR;
            const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 });
            const circle = new THREE.Mesh(geometry, material);

            const x = (move.col - CONFIG.COLS / 2) * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
            const z = -move.row * CONFIG.CELL_SIZE + scrollOffset;
            circle.position.set(x, 0.05, z); // Slightly above board
            circle.rotation.x = -Math.PI / 2;

            this.scene.add(circle);
            this.validMoveMeshes.push(circle);
        }
    }

    drawPiece(col, row, type, isPlayer, scrollOffset, deathProgress = 0) {
        // Simple 3D geometry for pieces (can upgrade to models later)
        const geometry = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16);
        const color = isPlayer ? CONFIG.PLAYER_COLOR : CONFIG.ENEMY_COLOR;
        const material = new THREE.MeshLambertMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);

        const x = (col - CONFIG.COLS / 2) * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
        const z = -row * CONFIG.CELL_SIZE + scrollOffset;

        // Apply death animation scaling/fading
        const scale = 1 - deathProgress * 0.5;
        mesh.scale.set(scale, scale, scale);
        mesh.material.opacity = 1 - deathProgress * 0.7;
        if (deathProgress > 0) {
            mesh.material.transparent = true;
        }

        mesh.position.set(x, 0.4 * scale, z);
        return mesh;
    }

    render(game, board, player, enemyManager) {
        const scrollOffset = game.scrollOffset;

        // Update camera position to follow scroll (moves forward down the road)
        this.camera.position.z = scrollOffset / CONFIG.CELL_SIZE + 8;

        // Clear old piece meshes
        for (const mesh of this.pieceMeshes.values()) {
            this.scene.remove(mesh);
        }
        this.pieceMeshes.clear();

        // Draw valid moves
        if (player.showMoves && !player.animating) {
            this.drawValidMoves(player.validMoves, scrollOffset);
        } else {
            this.clearValidMoves();
        }

        const isDying = game.state === GameState.DYING;

        // Draw player (underneath if dying)
        if (isDying) {
            const ppos = player.getDisplayPos();
            const deathProgress = Math.min(1, game.dyingTimer / 0.45);
            const playerMesh = this.drawPiece(ppos.col, ppos.row, player.type, true, scrollOffset, deathProgress);
            this.scene.add(playerMesh);
            this.pieceMeshes.set(player, playerMesh);
        }

        // Draw enemies
        for (const enemy of enemyManager.enemies) {
            const pos = enemyManager.getDisplayPos(enemy);
            const enemyMesh = this.drawPiece(pos.col, pos.row, enemy.type, false, scrollOffset);
            this.scene.add(enemyMesh);
            this.pieceMeshes.set(enemy, enemyMesh);
        }

        // Draw player on top if not dying
        if (!isDying) {
            const ppos = player.getDisplayPos();
            const playerMesh = this.drawPiece(ppos.col, ppos.row, player.type, true, scrollOffset);
            this.scene.add(playerMesh);
            this.pieceMeshes.set(player, playerMesh);
        }

        // Generate new board squares as needed
        const maxRow = Math.floor(scrollOffset / CONFIG.CELL_SIZE) + CONFIG.VISIBLE_ROWS + 50;
        for (let row = 0; row < maxRow; row++) {
            for (let col = 0; col < CONFIG.COLS; col++) {
                const key = `${col},${row}`;
                if (!this.boardSquares.has(key)) {
                    const isDark = (row + col) % 2 === 1;
                    const material = new THREE.MeshLambertMaterial({
                        color: isDark ? CONFIG.DARK_SQUARE : CONFIG.LIGHT_SQUARE,
                    });
                    const geometry = new THREE.PlaneGeometry(CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
                    const square = new THREE.Mesh(geometry, material);

                    const x = (col - CONFIG.COLS / 2) * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
                    const z = -row * CONFIG.CELL_SIZE;
                    square.position.set(x, 0, z);
                    square.rotation.x = -Math.PI / 2;

                    this.scene.add(square);
                    this.boardSquares.set(key, square);
                }
            }
        }

        // TODO: Add HUD overlay (Canvas 2D overlay or DOM elements)
        // TODO: Menu/game over screens
    }
}
