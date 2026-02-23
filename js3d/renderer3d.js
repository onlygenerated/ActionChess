// Three.js renderer for Action Chess
// Handles 3D board, pieces, fog, camera follow, visual effects

import * as THREE from 'three';
import { CONFIG } from '../shared/config.js';
import { GameState } from '../shared/game.js';
import { getPieceGeometry } from './pieceGeometries.js';

// Piece scale factors per type (applied to the LatheGeometry/ExtrudeGeometry)
const PIECE_SCALE = {
    pawn:   { s: 1.3, y: 1.6 },
    knight: { s: 1.2, y: 1.7 },
    bishop: { s: 1.3, y: 1.8 },
    rook:   { s: 1.3, y: 1.9 },
    queen:  { s: 1.3, y: 2.2 },
    king:   { s: 1.4, y: 2.1 },
};

// Ease-out-back for spawn animation
function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export class Renderer3D {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this._time = 0;

        // Shared geometries
        this.squareGeometry = new THREE.PlaneGeometry(CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
        this.moveGeometry = new THREE.CircleGeometry(CONFIG.CELL_SIZE * 0.18, 16);
        this.shadowGeometry = new THREE.CircleGeometry(0.35, 16);

        // Per-type piece geometries using 3D models
        this.pieceGeometries = {};
        for (const type of Object.keys(PIECE_SCALE)) {
            this.pieceGeometries[type] = getPieceGeometry(type);
        }

        // Shared materials
        this.lightSquareMat = new THREE.MeshLambertMaterial({ color: CONFIG.LIGHT_SQUARE });
        this.darkSquareMat = new THREE.MeshLambertMaterial({ color: CONFIG.DARK_SQUARE });

        // Player uses MeshStandardMaterial for emissive glow
        this.playerMat = new THREE.MeshStandardMaterial({
            color: CONFIG.PLAYER_COLOR,
            emissive: 0x4488ff,
            emissiveIntensity: 0.2,
            roughness: 0.4,
            metalness: 0.1,
        });

        this.enemyMat = new THREE.MeshStandardMaterial({
            color: CONFIG.ENEMY_COLOR,
            roughness: 0.5,
            metalness: 0.2,
        });

        // Contact shadow material
        this.shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.25,
        });

        // Move indicator materials — each mesh gets its own clone for per-instance opacity
        this._moveMatBase = new THREE.MeshBasicMaterial({ color: CONFIG.VALID_MOVE_COLOR, transparent: true, opacity: 0.6 });
        this._captureMatBase = new THREE.MeshBasicMaterial({ color: CONFIG.VALID_CAPTURE_COLOR, transparent: true, opacity: 0.6 });

        // Board squares tracking
        this.boardSquares = new Map();
        this.boardMinRow = 0;

        // Geometry pool for board squares (avoid clone/dispose churn)
        this._geometryPool = [];

        // Invisible ground plane for fast raycasting
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.raycasterTarget = new THREE.Vector3();

        // Piece mesh pool: each entry = { group, body, shadow, type, isPlayer }
        this.piecePool = [];
        this.activePieces = [];

        // Valid move mesh pool
        this.movePool = [];
        this.activeMoves = [];

        // Highlight mesh (reused)
        this.highlightedSquare = null;
        this.highlightMesh = null;

        // Camera offset from initial lookAt setup
        this._cameraOffsetY = 22;
        this._cameraOffsetZ = 6;
        this._lookAheadZ = -10;

        // Camera shake state
        this._shakeIntensity = 0;
        this._shakeDecay = 0.9;
        this._shakeOffsetX = 0;
        this._shakeOffsetY = 0;

        // Spawn animation tracking: Map<enemyIdentityKey, spawnTime>
        this._spawnTimes = new Map();
        this._spawnDuration = 0.3;

        // Board edge glow strips
        this._edgeGlowLeft = null;
        this._edgeGlowRight = null;
        this._createEdgeGlow();

        // Movement trail ghosts
        this._trailPool = [];
        this._activeTrails = [];

        // Store initial fog/light values for difficulty color shift
        this._baseFogColor = new THREE.Color(0x1a1a2e);
        this._dangerFogColor = new THREE.Color(0x2e1a1a);
        this._baseBgColor = new THREE.Color(0x1a1a2e);
        this._dangerBgColor = new THREE.Color(0x2e1a1a);

        // Current scroll offset cached for deformation
        this._currentScrollOffset = 0;

        // Deformation drift (smooth animated variation)
        this._driftCurveRadius = 0;
        this._driftTwistRate = 0;

        this.initializeBoard();
    }

    // --- Board deformation ---

    _updateDeformDrift() {
        const t = this._time;

        // Curve radius: oscillate intensity around CONFIG value (±40%)
        if (CONFIG.BOARD_CURVE_RADIUS > 0) {
            const drift = 0.5 * Math.sin(t * 0.13)
                        + 0.3 * Math.sin(t * 0.31 + 1.7)
                        + 0.2 * Math.sin(t * 0.07 + 3.1);
            this._driftCurveRadius = CONFIG.BOARD_CURVE_RADIUS * (1 + 0.4 * drift);
        } else {
            this._driftCurveRadius = 0;
        }

        // Twist rate: oscillate around ZERO so direction flips
        if (CONFIG.BOARD_TWIST_RATE !== 0) {
            const drift = 0.5 * Math.sin(t * 0.17 + 0.5)
                        + 0.3 * Math.sin(t * 0.29 + 2.3)
                        + 0.2 * Math.sin(t * 0.11 + 4.1);
            this._driftTwistRate = CONFIG.BOARD_TWIST_RATE * drift;
        } else {
            this._driftTwistRate = 0;
        }
    }

    _getDeformedPosition(flatX, flatZ, time) {
        const relZ = flatZ + this._currentScrollOffset;
        const depth = Math.max(0, -relZ);

        let y = 0;

        // Cylindrical curve — use drifting radius
        const curveRadius = this._driftCurveRadius;
        if (curveRadius > 0 && depth > 0) {
            const angle = depth / curveRadius;
            y += curveRadius * (1 - Math.cos(angle));
        }

        // Sine wave undulation (unchanged — already animated via time)
        if (CONFIG.BOARD_WAVE_AMPLITUDE > 0) {
            const phase = flatZ * CONFIG.BOARD_WAVE_FREQUENCY + time * CONFIG.BOARD_WAVE_SPEED;
            y += CONFIG.BOARD_WAVE_AMPLITUDE * Math.sin(phase);
        }

        // Ribbon twist — use drifting rate
        let x = flatX;
        const twistRate = this._driftTwistRate;
        if (twistRate !== 0 && depth > 0) {
            const a = depth * twistRate;
            const cosA = Math.cos(a), sinA = Math.sin(a);
            x = flatX * cosA - y * sinA;
            y = flatX * sinA + y * cosA;
        }

        return { x, y, z: flatZ };
    }

    _createEdgeGlow() {
        const height = 200; // tall enough to cover visible area
        const width = 0.15;
        const geom = new THREE.PlaneGeometry(width, height);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
        });

        const halfBoard = (CONFIG.COLS / 2) * CONFIG.CELL_SIZE;

        this._edgeGlowLeft = new THREE.Mesh(geom, mat);
        this._edgeGlowLeft.rotation.x = -Math.PI / 2;
        this._edgeGlowLeft.position.set(-halfBoard - width / 2, 0.02, 0);
        this.scene.add(this._edgeGlowLeft);

        this._edgeGlowRight = new THREE.Mesh(geom, mat.clone());
        this._edgeGlowRight.rotation.x = -Math.PI / 2;
        this._edgeGlowRight.position.set(halfBoard + width / 2, 0.02, 0);
        this.scene.add(this._edgeGlowRight);
    }

    reset() {
        this._hideAllPieces();
        this._hideAllMoves();
        this._hideAllTrails();
        this._spawnTimes.clear();
        this._shakeIntensity = 0;
    }

    initializeBoard() {
        for (let row = 0; row < 60; row++) {
            this._createBoardRow(row);
        }
    }

    _createBoardRow(row) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            const key = `${col},${row}`;
            if (this.boardSquares.has(key)) continue;

            const isDark = (row + col) % 2 === 1;
            const geom = this._geometryPool.pop() || this.squareGeometry.clone();
            const square = new THREE.Mesh(
                geom,
                isDark ? this.darkSquareMat : this.lightSquareMat
            );

            const x = (col - CONFIG.COLS / 2) * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
            const z = -row * CONFIG.CELL_SIZE;

            // Store flat base position for deformation (vertices set in render loop)
            square._baseX = x;
            square._baseZ = z;
            square.frustumCulled = false;

            this.scene.add(square);
            this.boardSquares.set(key, square);
        }
    }

    _cullBoardBehind(minRow) {
        while (this.boardMinRow < minRow) {
            for (let col = 0; col < CONFIG.COLS; col++) {
                const key = `${col},${this.boardMinRow}`;
                const mesh = this.boardSquares.get(key);
                if (mesh) {
                    this.scene.remove(mesh);
                    this._geometryPool.push(mesh.geometry);
                    this.boardSquares.delete(key);
                }
            }
            this.boardMinRow++;
        }
    }

    // --- Camera shake ---

    triggerShake(intensity = 0.5) {
        this._shakeIntensity = intensity;
    }

    _updateShake() {
        if (this._shakeIntensity > 0.01) {
            this._shakeOffsetX = (Math.random() - 0.5) * 2 * this._shakeIntensity;
            this._shakeOffsetY = (Math.random() - 0.5) * 2 * this._shakeIntensity;
            this._shakeIntensity *= this._shakeDecay;
        } else {
            this._shakeIntensity = 0;
            this._shakeOffsetX = 0;
            this._shakeOffsetY = 0;
        }
    }

    // --- Object pools ---

    _getPieceGroup(type, isPlayer) {
        // Try to reuse from pool
        for (let i = 0; i < this.piecePool.length; i++) {
            const entry = this.piecePool[i];
            if (entry.type === type && entry.isPlayer === isPlayer) {
                this.piecePool.splice(i, 1);
                entry.group.visible = true;
                entry.group.scale.set(1, 1, 1);
                entry.body.material = isPlayer ? this.playerMat : this.enemyMat;
                this.activePieces.push(entry);
                return entry;
            }
        }

        // Create new group: 3D piece body + contact shadow
        const group = new THREE.Group();

        const scale = PIECE_SCALE[type] || { s: 1.3, y: 1.6 };
        const geometry = this.pieceGeometries[type] || this.pieceGeometries.pawn;
        const body = new THREE.Mesh(geometry, isPlayer ? this.playerMat : this.enemyMat);
        body.scale.set(scale.s, scale.y, scale.s);
        group.add(body);

        // Contact shadow
        const shadow = new THREE.Mesh(this.shadowGeometry, this.shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.01;
        group.add(shadow);

        const entry = { group, body, shadow, type, isPlayer };
        this.activePieces.push(entry);
        this.scene.add(group);
        return entry;
    }

    _hideAllPieces() {
        for (const entry of this.activePieces) {
            entry.group.visible = false;
            this.piecePool.push(entry);
        }
        this.activePieces = [];
    }

    _getMoveMesh(isCapture) {
        for (let i = 0; i < this.movePool.length; i++) {
            const entry = this.movePool[i];
            if (entry.isCapture === isCapture) {
                this.movePool.splice(i, 1);
                entry.mesh.visible = true;
                this.activeMoves.push(entry);
                return entry;
            }
        }
        // Each move mesh gets its own material clone for per-instance opacity animation
        const mat = (isCapture ? this._captureMatBase : this._moveMatBase).clone();
        const mesh = new THREE.Mesh(this.moveGeometry, mat);
        mesh.rotation.x = -Math.PI / 2;
        const entry = { mesh, isCapture, mat };
        this.activeMoves.push(entry);
        this.scene.add(mesh);
        return entry;
    }

    _hideAllMoves() {
        for (const entry of this.activeMoves) {
            entry.mesh.visible = false;
            this.movePool.push(entry);
        }
        this.activeMoves = [];
    }

    // --- Movement trails ---

    _getTrailMesh(type, isPlayer) {
        // Try to reuse
        for (let i = 0; i < this._trailPool.length; i++) {
            const t = this._trailPool[i];
            if (t.type === type && t.isPlayer === isPlayer) {
                this._trailPool.splice(i, 1);
                t.group.visible = true;
                this._activeTrails.push(t);
                return t;
            }
        }

        // Create new trail ghost
        const group = new THREE.Group();
        const scale = PIECE_SCALE[type] || { s: 0.9, y: 1.0 };
        const geometry = this.pieceGeometries[type] || this.pieceGeometries.pawn;
        const mat = new THREE.MeshBasicMaterial({
            color: isPlayer ? CONFIG.PLAYER_COLOR : CONFIG.ENEMY_COLOR,
            transparent: true,
            opacity: 0.2,
        });
        const body = new THREE.Mesh(geometry, mat);
        body.scale.set(scale.s, scale.y, scale.s);
        group.add(body);

        const entry = { group, mat, type, isPlayer, life: 0 };
        this._activeTrails.push(entry);
        this.scene.add(group);
        return entry;
    }

    _hideAllTrails() {
        for (const t of this._activeTrails) {
            t.group.visible = false;
            this._trailPool.push(t);
        }
        this._activeTrails = [];
    }

    // --- Raycasting ---

    raycastToGrid(raycaster) {
        const hit = raycaster.ray.intersectPlane(this.groundPlane, this.raycasterTarget);
        if (!hit) return null;

        const col = Math.floor((hit.x + CONFIG.COLS / 2 * CONFIG.CELL_SIZE) / CONFIG.CELL_SIZE);
        const row = Math.round(-hit.z / CONFIG.CELL_SIZE);

        if (col < 0 || col >= CONFIG.COLS) return null;
        return { col, row };
    }

    setHighlightedSquare(square) {
        if (this.highlightMesh) {
            this.highlightMesh.visible = false;
        }
        this.highlightedSquare = square;

        if (square) {
            if (!this.highlightMesh) {
                const geometry = new THREE.RingGeometry(CONFIG.CELL_SIZE * 0.45, CONFIG.CELL_SIZE * 0.5, 32);
                const material = new THREE.MeshBasicMaterial({
                    color: 0xffff00,
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                });
                this.highlightMesh = new THREE.Mesh(geometry, material);
                this.highlightMesh.rotation.x = -Math.PI / 2;
                this.scene.add(this.highlightMesh);
            }

            const x = this._colToX(square.col);
            const z = -square.row * CONFIG.CELL_SIZE;
            const hlDef = this._getDeformedPosition(x, z, this._time);
            this.highlightMesh.position.set(hlDef.x, hlDef.y + 0.06, hlDef.z);
            this.highlightMesh.visible = true;
        }
    }

    _colToX(col) {
        return (col - CONFIG.COLS / 2) * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
    }

    // --- Spawn animation helpers ---

    _getEnemyKey(enemy) {
        // Use spawn position + type as identity key (stable across frames)
        return `${enemy.spawnRow}_${enemy.col}_${enemy.type}`;
    }

    _getSpawnScale(enemy) {
        const key = this._getEnemyKey(enemy);
        if (!this._spawnTimes.has(key)) {
            this._spawnTimes.set(key, this._time);
        }
        const age = this._time - this._spawnTimes.get(key);
        if (age >= this._spawnDuration) return 1;
        return easeOutBack(Math.min(1, age / this._spawnDuration));
    }

    // --- Main render ---

    render(game, board, player, enemyManager, dt = 0.016) {
        this._time += dt;
        this._updateDeformDrift();
        const scrollOffset = game.scrollOffset;
        this._currentScrollOffset = scrollOffset;

        // Camera shake
        this._updateShake();

        // Camera follows scroll with shake offset
        this.camera.position.z = -scrollOffset + this._cameraOffsetZ;
        this.camera.position.y = this._cameraOffsetY;
        this.camera.position.x = this._shakeOffsetX;
        this.camera.position.y += this._shakeOffsetY;
        this.camera.lookAt(this._shakeOffsetX * 0.3, 0, -scrollOffset + this._lookAheadZ);

        // --- Difficulty color shift (Tier 3: #10) ---
        const colorProgress = Math.min(1, game.timeElapsed / 120);
        if (this.scene.fog) {
            this.scene.fog.color.copy(this._baseFogColor).lerp(this._dangerFogColor, colorProgress);
        }
        if (this.scene.background instanceof THREE.Color) {
            this.scene.background.copy(this._baseBgColor).lerp(this._dangerBgColor, colorProgress);
        }

        // --- Board edge glow follows camera ---
        if (this._edgeGlowLeft) {
            this._edgeGlowLeft.position.z = -scrollOffset + this._lookAheadZ;
            this._edgeGlowRight.position.z = -scrollOffset + this._lookAheadZ;
            // Pulse edge glow subtly
            const edgeOpacity = 0.12 + 0.06 * Math.sin(this._time * 2);
            this._edgeGlowLeft.material.opacity = edgeOpacity;
            this._edgeGlowRight.material.opacity = edgeOpacity;
        }

        // --- Board management ---
        const currentRow = Math.floor(scrollOffset / CONFIG.CELL_SIZE);
        const maxRow = currentRow + CONFIG.VISIBLE_ROWS + 30;
        for (let row = currentRow; row < maxRow; row++) {
            this._createBoardRow(row);
        }
        this._cullBoardBehind(Math.max(0, currentRow - 10));

        // --- Deform board squares (per-vertex) ---
        const hs = CONFIG.CELL_SIZE / 2;
        for (const [key, square] of this.boardSquares) {
            const bx = square._baseX, bz = square._baseZ;
            const fl = this._getDeformedPosition(bx - hs, bz - hs, this._time);
            const fr = this._getDeformedPosition(bx + hs, bz - hs, this._time);
            const bl = this._getDeformedPosition(bx - hs, bz + hs, this._time);
            const br = this._getDeformedPosition(bx + hs, bz + hs, this._time);

            const pos = square.geometry.attributes.position;
            pos.setXYZ(0, fl.x, fl.y, fl.z);
            pos.setXYZ(1, fr.x, fr.y, fr.z);
            pos.setXYZ(2, bl.x, bl.y, bl.z);
            pos.setXYZ(3, br.x, br.y, br.z);
            pos.needsUpdate = true;
            square.geometry.computeVertexNormals();
        }

        // --- Return pooled meshes ---
        this._hideAllPieces();
        this._hideAllMoves();

        // Update and cull trails
        for (let i = this._activeTrails.length - 1; i >= 0; i--) {
            const t = this._activeTrails[i];
            t.life -= dt;
            if (t.life <= 0) {
                t.group.visible = false;
                this._trailPool.push(t);
                this._activeTrails.splice(i, 1);
            } else {
                t.mat.opacity = 0.2 * (t.life / 0.15);
            }
        }

        // --- Valid moves (animated) ---
        if (player.showMoves && !player.animating) {
            for (let idx = 0; idx < player.validMoves.length; idx++) {
                const move = player.validMoves[idx];
                const isCapture = !!move.isCapture;
                const entry = this._getMoveMesh(isCapture);

                // Animated bob and pulse
                const freq = isCapture ? 6 : 4;
                const bobY = 0.05 + 0.03 * Math.sin(this._time * 3 + idx * 0.5);
                const pulseOpacity = isCapture
                    ? 0.5 + 0.3 * Math.sin(this._time * freq)
                    : 0.4 + 0.2 * Math.sin(this._time * freq + idx * 0.3);

                const moveX = this._colToX(move.col);
                const moveZ = -move.row * CONFIG.CELL_SIZE;
                const moveDef = this._getDeformedPosition(moveX, moveZ, this._time);
                entry.mesh.position.set(moveDef.x, moveDef.y + bobY, moveDef.z);
                entry.mat.opacity = pulseOpacity;
            }
        }

        // --- Pieces ---
        const isDying = game.state === GameState.DYING;

        // Player
        const ppos = player.getDisplayPos();
        const playerEntry = this._getPieceGroup(player.type, true);
        const playerX = this._colToX(ppos.col);
        const playerZ = -ppos.row * CONFIG.CELL_SIZE;
        const playerDef = this._getDeformedPosition(playerX, playerZ, this._time);
        playerEntry.group.position.set(playerDef.x, playerDef.y, playerDef.z);

        // Player glow pulse
        this.playerMat.emissiveIntensity = 0.2 + 0.15 * Math.sin(this._time * 2.5);

        if (isDying) {
            const deathProgress = Math.min(1, game.dyingTimer / 0.45);
            const scale = 1 - deathProgress * 0.5;
            playerEntry.group.scale.set(scale, scale, scale);
        }

        // Player movement trail
        if (player.animating && player.animProgress < 0.3) {
            const trail = this._getTrailMesh(player.type, true);
            const trailX = this._colToX(player.fromCol);
            const trailZ = -player.fromRow * CONFIG.CELL_SIZE;
            const trailDef = this._getDeformedPosition(trailX, trailZ, this._time);
            trail.group.position.set(trailDef.x, trailDef.y, trailDef.z);
            trail.life = 0.15;
            trail.mat.opacity = 0.2;
        }

        // Enemies
        for (const enemy of enemyManager.enemies) {
            const pos = enemyManager.getDisplayPos(enemy);
            const entry = this._getPieceGroup(enemy.type, false);
            const enemyX = this._colToX(pos.col);
            const enemyZ = -pos.row * CONFIG.CELL_SIZE;
            const enemyDef = this._getDeformedPosition(enemyX, enemyZ, this._time);
            entry.group.position.set(enemyDef.x, enemyDef.y, enemyDef.z);

            // Spawn scale-in animation
            const spawnScale = this._getSpawnScale(enemy);
            if (spawnScale < 1) {
                entry.group.scale.set(spawnScale, spawnScale, spawnScale);
            }

            // Enemy movement trail
            if (enemy.animating && enemy.animProgress < 0.3) {
                const trail = this._getTrailMesh(enemy.type, false);
                const eTrailX = this._colToX(enemy.fromCol);
                const eTrailZ = -enemy.fromRow * CONFIG.CELL_SIZE;
                const eTrailDef = this._getDeformedPosition(eTrailX, eTrailZ, this._time);
                trail.group.position.set(eTrailDef.x, eTrailDef.y, eTrailDef.z);
                trail.life = 0.15;
                trail.mat.opacity = 0.2;
            }
        }

        // Clean up stale spawn times (enemies that no longer exist)
        if (this._spawnTimes.size > 50) {
            const activeKeys = new Set(enemyManager.enemies.map(e => this._getEnemyKey(e)));
            for (const key of this._spawnTimes.keys()) {
                if (!activeKeys.has(key)) this._spawnTimes.delete(key);
            }
        }
    }
}
