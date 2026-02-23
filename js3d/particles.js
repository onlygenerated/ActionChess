// Particle System for Action Chess
// Uses InstancedMesh for efficient single-draw-call rendering.
// Supports burst effects for captures, milestones, etc.

import * as THREE from 'three';

const MAX_PARTICLES = 300;
const PARTICLE_SIZE = 0.08;
const GRAVITY = -9.8;

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];

        const geometry = new THREE.BoxGeometry(PARTICLE_SIZE, PARTICLE_SIZE, PARTICLE_SIZE);
        const material = new THREE.MeshBasicMaterial({
            toneMapped: false,
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, MAX_PARTICLES);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.mesh.frustumCulled = false;
        this.mesh.count = 0;
        this.scene.add(this.mesh);
    }

    /**
     * Emit a burst of particles at a world position.
     * @param {number} x - World X
     * @param {number} y - World Y
     * @param {number} z - World Z
     * @param {number} color - Hex color (e.g. 0xff0000)
     * @param {number} count - Number of particles (clamped to available pool)
     */
    burst(x, y, z, color, count = 30) {
        const available = MAX_PARTICLES - this.particles.length;
        const toSpawn = Math.min(count, available);

        for (let i = 0; i < toSpawn; i++) {
            // Random velocity in a sphere, biased upward
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI * 0.6 + Math.PI * 0.2;
            const speed = 2 + Math.random() * 4;

            this.particles.push({
                x, y: y + 0.3, z,
                vx: Math.cos(angle) * Math.sin(elevation) * speed,
                vy: Math.cos(elevation) * speed + 2,
                vz: Math.sin(angle) * Math.sin(elevation) * speed,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 0.6 + Math.random() * 0.4,
                color,
                scale: 0.5 + Math.random() * 1.0,
                rotSpeed: (Math.random() - 0.5) * 10,
                rot: Math.random() * Math.PI * 2,
            });
        }
    }

    /**
     * Emit a ring burst (for milestones) — particles expand outward in a ring.
     */
    ring(x, y, z, color, count = 40) {
        const available = MAX_PARTICLES - this.particles.length;
        const toSpawn = Math.min(count, available);

        for (let i = 0; i < toSpawn; i++) {
            const angle = (i / toSpawn) * Math.PI * 2;
            const speed = 3 + Math.random() * 2;

            this.particles.push({
                x, y: y + 0.2, z,
                vx: Math.cos(angle) * speed,
                vy: 1 + Math.random() * 2,
                vz: Math.sin(angle) * speed,
                life: 0.8 + Math.random() * 0.3,
                maxLife: 0.8 + Math.random() * 0.3,
                color,
                scale: 0.6 + Math.random() * 0.6,
                rotSpeed: (Math.random() - 0.5) * 8,
                rot: Math.random() * Math.PI * 2,
            });
        }
    }

    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            p.vy += GRAVITY * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            p.rot += p.rotSpeed * dt;

            // Bounce off ground
            if (p.y < 0.05) {
                p.y = 0.05;
                p.vy = Math.abs(p.vy) * 0.3;
                p.vx *= 0.8;
                p.vz *= 0.8;
            }
        }

        // Write instance data
        this.mesh.count = this.particles.length;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const lifeRatio = p.life / p.maxLife;
            const s = p.scale * lifeRatio;

            _dummy.position.set(p.x, p.y, p.z);
            _dummy.rotation.set(p.rot, p.rot * 0.7, 0);
            _dummy.scale.set(s, s, s);
            _dummy.updateMatrix();
            this.mesh.setMatrixAt(i, _dummy.matrix);

            _color.setHex(p.color);
            // Fade alpha by reducing brightness toward end of life
            _color.multiplyScalar(0.5 + lifeRatio * 0.5);
            this.mesh.setColorAt(i, _color);
        }

        if (this.particles.length > 0) {
            this.mesh.instanceMatrix.needsUpdate = true;
            this.mesh.instanceColor.needsUpdate = true;
        }
    }

    dispose() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}
