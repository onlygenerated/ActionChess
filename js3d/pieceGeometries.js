// 3D Chess Piece Geometry Factories
// Uses LatheGeometry for rotationally symmetric pieces (pawn, rook, bishop, queen, king)
// Uses ExtrudeGeometry for the knight (asymmetric horse-head silhouette)
// All pieces are Staunton-style silhouettes, scaled to fit the game's cell size.

import * as THREE from 'three';

// Shared lathe segments — 24 gives smooth curves without excessive polys
const LATHE_SEGMENTS = 24;

export function createPawnGeometry() {
    const points = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.35, 0),
        new THREE.Vector2(0.35, 0.05),
        new THREE.Vector2(0.30, 0.08),
        new THREE.Vector2(0.15, 0.15),
        new THREE.Vector2(0.12, 0.30),
        new THREE.Vector2(0.13, 0.35),
        new THREE.Vector2(0.20, 0.42),
        new THREE.Vector2(0.22, 0.50),
        new THREE.Vector2(0.20, 0.58),
        new THREE.Vector2(0.12, 0.62),
        new THREE.Vector2(0, 0.68),
    ];
    return new THREE.LatheGeometry(points, LATHE_SEGMENTS);
}

export function createRookGeometry() {
    const points = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.38, 0),
        new THREE.Vector2(0.38, 0.05),
        new THREE.Vector2(0.32, 0.08),
        new THREE.Vector2(0.18, 0.18),
        new THREE.Vector2(0.15, 0.50),
        new THREE.Vector2(0.18, 0.55),
        new THREE.Vector2(0.28, 0.58),
        new THREE.Vector2(0.28, 0.70),
        new THREE.Vector2(0.32, 0.70),
        new THREE.Vector2(0.32, 0.80),
        new THREE.Vector2(0.22, 0.80),
        new THREE.Vector2(0.22, 0.75),
        new THREE.Vector2(0, 0.75),
    ];
    return new THREE.LatheGeometry(points, LATHE_SEGMENTS);
}

export function createBishopGeometry() {
    const points = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.35, 0),
        new THREE.Vector2(0.35, 0.05),
        new THREE.Vector2(0.30, 0.08),
        new THREE.Vector2(0.16, 0.18),
        new THREE.Vector2(0.13, 0.35),
        new THREE.Vector2(0.14, 0.40),
        new THREE.Vector2(0.20, 0.48),
        new THREE.Vector2(0.20, 0.52),
        new THREE.Vector2(0.16, 0.58),
        new THREE.Vector2(0.10, 0.68),
        new THREE.Vector2(0.06, 0.76),
        new THREE.Vector2(0.03, 0.80),
        new THREE.Vector2(0, 0.84),
    ];
    return new THREE.LatheGeometry(points, LATHE_SEGMENTS);
}

export function createQueenGeometry() {
    const points = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.38, 0),
        new THREE.Vector2(0.38, 0.06),
        new THREE.Vector2(0.32, 0.10),
        new THREE.Vector2(0.17, 0.22),
        new THREE.Vector2(0.14, 0.45),
        new THREE.Vector2(0.15, 0.50),
        new THREE.Vector2(0.22, 0.60),
        new THREE.Vector2(0.24, 0.68),
        new THREE.Vector2(0.22, 0.76),
        new THREE.Vector2(0.16, 0.84),
        new THREE.Vector2(0.10, 0.92),
        new THREE.Vector2(0.14, 0.98),
        new THREE.Vector2(0.12, 1.04),
        new THREE.Vector2(0.05, 1.08),
        new THREE.Vector2(0, 1.12),
    ];
    return new THREE.LatheGeometry(points, LATHE_SEGMENTS);
}

export function createKingGeometry() {
    // The king body is lathed; the cross is added separately as a group
    const points = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.40, 0),
        new THREE.Vector2(0.40, 0.06),
        new THREE.Vector2(0.34, 0.10),
        new THREE.Vector2(0.18, 0.22),
        new THREE.Vector2(0.15, 0.40),
        new THREE.Vector2(0.16, 0.45),
        new THREE.Vector2(0.24, 0.52),
        new THREE.Vector2(0.24, 0.56),
        new THREE.Vector2(0.20, 0.62),
        new THREE.Vector2(0.14, 0.70),
        new THREE.Vector2(0.10, 0.78),
        new THREE.Vector2(0.06, 0.82),
        new THREE.Vector2(0, 0.84),
    ];
    const body = new THREE.LatheGeometry(points, LATHE_SEGMENTS);

    // Cross on top
    const crossV = new THREE.BoxGeometry(0.06, 0.22, 0.06);
    crossV.translate(0, 0.95, 0);
    const crossH = new THREE.BoxGeometry(0.16, 0.06, 0.06);
    crossH.translate(0, 0.92, 0);

    // Merge into single geometry
    const merged = mergeGeometries([body, crossV, crossH]);
    return merged || body; // fallback to body if merge fails
}

export function createKnightGeometry() {
    // 2D horse-head silhouette extruded for thickness
    const shape = new THREE.Shape();

    // Base
    shape.moveTo(-0.30, 0);
    shape.lineTo(0.30, 0);
    shape.lineTo(0.30, 0.06);
    shape.lineTo(0.22, 0.10);

    // Right side going up (back of head)
    shape.lineTo(0.15, 0.20);
    shape.lineTo(0.12, 0.40);
    shape.lineTo(0.10, 0.55);
    shape.lineTo(0.05, 0.65);

    // Top of head / ears
    shape.lineTo(0.00, 0.72);
    shape.lineTo(-0.06, 0.70);

    // Forehead curving down to nose
    shape.lineTo(-0.12, 0.62);
    shape.lineTo(-0.20, 0.50);
    shape.lineTo(-0.25, 0.40);

    // Nose/muzzle
    shape.lineTo(-0.28, 0.32);
    shape.lineTo(-0.24, 0.28);

    // Chin back to neck
    shape.lineTo(-0.18, 0.22);
    shape.lineTo(-0.22, 0.10);
    shape.lineTo(-0.30, 0.06);
    shape.lineTo(-0.30, 0);

    const extrudeSettings = {
        depth: 0.24,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.03,
        bevelSegments: 3,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Center the extrusion on Z axis
    geometry.translate(0, 0, -0.12);
    return geometry;
}

// Simple geometry merge utility (avoids importing BufferGeometryUtils)
function mergeGeometries(geometries) {
    let totalVerts = 0;
    let totalIdx = 0;
    for (const g of geometries) {
        totalVerts += g.attributes.position.count;
        totalIdx += g.index ? g.index.count : g.attributes.position.count;
    }

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const indices = new Uint32Array(totalIdx);

    let vertOffset = 0;
    let idxOffset = 0;
    let vertCount = 0;

    for (const g of geometries) {
        const pos = g.attributes.position;
        const norm = g.attributes.normal;
        const idx = g.index;

        for (let i = 0; i < pos.count; i++) {
            positions[(vertOffset + i) * 3] = pos.getX(i);
            positions[(vertOffset + i) * 3 + 1] = pos.getY(i);
            positions[(vertOffset + i) * 3 + 2] = pos.getZ(i);
            if (norm) {
                normals[(vertOffset + i) * 3] = norm.getX(i);
                normals[(vertOffset + i) * 3 + 1] = norm.getY(i);
                normals[(vertOffset + i) * 3 + 2] = norm.getZ(i);
            }
        }

        if (idx) {
            for (let i = 0; i < idx.count; i++) {
                indices[idxOffset + i] = idx.getX(i) + vertOffset;
            }
            idxOffset += idx.count;
        } else {
            for (let i = 0; i < pos.count; i++) {
                indices[idxOffset + i] = i + vertOffset;
            }
            idxOffset += pos.count;
        }

        vertOffset += pos.count;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    merged.setIndex(new THREE.BufferAttribute(indices, 1));
    merged.computeVertexNormals();
    return merged;
}

// Factory map: type string → geometry
const geometryCache = {};

export function getPieceGeometry(type) {
    if (geometryCache[type]) return geometryCache[type];

    switch (type) {
        case 'pawn':   geometryCache[type] = createPawnGeometry(); break;
        case 'knight': geometryCache[type] = createKnightGeometry(); break;
        case 'bishop': geometryCache[type] = createBishopGeometry(); break;
        case 'rook':   geometryCache[type] = createRookGeometry(); break;
        case 'queen':  geometryCache[type] = createQueenGeometry(); break;
        case 'king':   geometryCache[type] = createKingGeometry(); break;
        default:       geometryCache[type] = createPawnGeometry(); break;
    }

    return geometryCache[type];
}
