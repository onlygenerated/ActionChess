# Action Chess - 3D Perspective Branch

**Status:** Experimental
**Branch:** `3d-perspective`

---

## What's Different

This branch rebuilds the renderer using Three.js while keeping all game logic intact.

### Visual Changes:
- **3D perspective camera** — overhead 3/4 view looking down the road
- **Scroll direction flipped** — board moves "forward" (down negative Z-axis) instead of upward
- **Depth fog** — distant enemies fade in as they approach (fog starts at 20 units, fully obscured at 60)
- **3D pieces** — simple cylinder geometry (can upgrade to models later)

### Technical Changes:
- **Rendering:** Three.js WebGL (`js3d/renderer3d.js`) replaces Canvas 2D (`js/renderer.js`)
- **Shared logic:** `shared/` folder contains game state, board, player, enemies, piece rules (unchanged from 2D)
- **Config:** `shared/config3d.js` adapts pixel-based values to 3D world units
- **Input:** Raycasting replaces pixel-based click detection

---

## How to Test

1. Open `index-3d.html` (not `index.html`)
2. Game mechanics are identical to 2D version
3. Click on board squares to move (raycasting detects which square)

---

## File Structure

```
ActionChess/
├── index.html          ← 2D version (main branch)
├── index-3d.html       ← 3D version (this branch)
├── js/                 ← 2D renderer + game logic
├── js3d/               ← 3D renderer (Three.js)
│   ├── main.js         ← 3D entry point
│   └── renderer3d.js   ← Three.js rendering
├── shared/             ← Game logic (used by both 2D and 3D)
│   ├── game.js
│   ├── board.js
│   ├── player.js
│   ├── enemyManager.js
│   ├── pieces.js
│   └── config3d.js     ← 3D-adapted config
└── css/                ← Shared styles
```

---

## Next Steps (TODO)

- [ ] Add HUD overlay (score, time) — either Canvas 2D overlay or DOM elements
- [ ] Menu and game over screens
- [ ] Curved board surface (cylinder geometry or custom mesh)
- [ ] Better piece models (import GLB/GLTF or procedural shapes)
- [ ] Touch controls for mobile (tap to move)
- [ ] Particle effects for captures/deaths
- [ ] Sound effects

---

## Known Issues

- No HUD/menu screens yet (game starts immediately)
- Pieces are simple cylinders (placeholder geometry)
- Board is flat (curved road planned)

---

*Created: 2026-02-20*
