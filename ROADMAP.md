# Action Chess — Development Roadmap

*Last updated: 2026-04-14*
*Based on codebase review of the 3D renderer, shared game logic, and board/enemy systems.*

---

## 1. Bug Fixes

### [FIXED] Board squares disappear after game restart — `medium`
**Root cause:** `Renderer3D.reset()` did not clear `boardSquares` or reset `boardMinRow`. On restart, the new game creates rows 0–N while `boardMinRow` retained its old value (e.g. 50). The cull loop (`while boardMinRow < currentRow - 10`) never fires until `currentRow > 60`, so rows culled during the previous game (typically 38–49) were never recreated, leaving a permanent gap in the board.
**Fix applied:** `reset()` now removes all squares from the scene, returns their geometries to the pool, clears `boardSquares`, resets `boardMinRow = 0`, and calls `initializeBoard()`.

### Debug marker lines always visible in gameplay — `small`
Three `THREE.Mesh` objects (red scroll-offset line, green lookAt line, yellow off-screen threshold line) are unconditionally added to the scene in `_createDebugMarkers()` (`renderer3d.js:226`) and are never hidden. They float visibly in the scene during normal play. Should be gated behind a `CONFIG.DEBUG` flag.

### Enemy off-screen culling uses 2D canvas-height convention in 3D space — `small`
`enemyManager.update()` filters enemies using `checkRow * cellSize - scrollOffset` and compares against `-cellSize` as if it were a pixel canvas. In 3D, `CELL_SIZE = 2` (world units) and `scrollOffset` is also in world units, so the math works out numerically — but the logic borrows 2D naming (`screenY`, `canvasHeight`) that will silently break if `CELL_SIZE` or the coordinate convention changes. Low risk now; worth cleaning up alongside the 2D/3D split.

### Culling threshold may clip squares near the player — `small`
`_cullBoardBehind(Math.max(0, currentRow - 10))` (`renderer3d.js:572`) removes squares 10 rows behind `currentRow`. With the camera tilted (`lookAheadZ = -15`, `cameraOffsetY = 35`), the visible back-edge can extend ~18 rows behind the camera's Z position. Squares at `currentRow - 11` through `currentRow - 18` are culled but may still be faintly visible on the bottom edge of the screen. Increase the buffer from 10 to 3 (i.e. `currentRow - 3`) or remove backward culling entirely since the geometry pool prevents unbounded memory growth.

---

## 2. Performance

### `computeVertexNormals()` called every frame on every square — `small`
`renderer3d.js:589` calls `square.geometry.computeVertexNormals()` inside the per-frame deformation loop for all board squares (~80–200 at any time). Board squares use `MeshLambertMaterial` which only needs per-face normals. Either switch to `MeshBasicMaterial` (no lighting, no normals needed) or manually write the normal attribute once and skip recomputation, since the normal direction for a nearly-flat plane barely changes.

### `new THREE.Raycaster()` allocated on every pointer event — `small`
`js3d/main.js:222` creates a new `Raycaster` instance every time the user clicks. This allocates a new object on each click. Cache one at the module level and call `setFromCamera()` on it instead.

### All board squares deformed every frame regardless of distance — `medium`
The deformation loop iterates all entries in `boardSquares` (~80–200 meshes) every frame. Squares far behind the camera or deep in fog are fully deformed but never seen. Skipping squares outside a Z-distance threshold (e.g. more than 30 units from the camera) would save meaningful vertex-write work at the cost of a simple distance check.

### `getAllPieces()` builds a new array every frame — `small`
`js3d/main.js:111` is called in the game loop every time enemy moves are computed. It allocates a new array and object literals each call. Cache and mutate a preallocated array, or pass player + enemies directly to `getValidMoves`.

### Board squares use individual geometry clones — `large`
Each board square has its own `PlaneGeometry` clone (or pool entry). With ~200 squares, that is ~200 draw calls. Converting to `THREE.InstancedMesh` with per-instance matrix/color would collapse this to 2 draw calls (light + dark squares) and dramatically reduce GPU overhead — though the per-vertex deformation approach would need to change to a vertex shader or per-instance Y-offset approximation.

---

## 3. Polish

### Remove or hide debug marker lines — `small`
The three colored lines (red/green/yellow) added by `_createDebugMarkers()` are permanently visible. Either delete the method and all references, or add a `CONFIG.DEBUG = false` flag and wrap the `scene.add()` calls.

### Replace Unicode chess symbols with 3D piece geometries — `medium`
`config.js` still carries `PIECE_SYMBOLS` (♕, ♛, etc.) from the 2D renderer. The 3D renderer uses `pieceGeometries.js` with proper `LatheGeometry`/`ExtrudeGeometry` shapes, so symbols are vestigial. Remove `PIECE_SYMBOLS` from the shared config to avoid confusion. The 2D renderer in `js/` can keep its own copy.

### Board effect toggles need polish — `small`
The curve/wave/twist toggle buttons in `js3d/main.js` (lines 391–411) call `e.stopPropagation()` but share the click event bubble path with the game canvas. The active/inactive visual state is CSS-class-only with no feedback on what the effect does. Add tooltip labels and consider moving them to a settings panel rather than persistent on-screen buttons.

### Piece spawn animation can pop if `spawnDuration` is short — `small`
`_getSpawnScale()` registers the spawn time on first call, so the first frame a piece is rendered sets `t=0` correctly. But if the render loop is paused (tab hidden, then restored), `this._time` will have jumped and `age` will skip past `_spawnDuration`, making the animation invisible. Guard against large `dt` spikes by clamping `dt` in `render()` (already clamped to 0.1s in the game loop, but `_time` accumulates the raw value).

### No screen transitions between menu, game, and game-over states — `medium`
State changes (`MENU → PLAYING → DYING → GAME_OVER`) are instant show/hide of HTML overlays. A brief fade or slide would reduce visual jarring, especially on the death → game-over transition.

### Camera is not reset between games — `small`
If the player dies at `scrollOffset = 200`, the camera stays at that Z position until the next frame of the new game renders. On slow machines this can produce a single frame flash of the old board position at game start. Call `renderer3d.render()` once synchronously inside `startGame()` or reset the camera position in `reset()`.

---

## 4. New Features

### Sound effects — `medium`
No audio currently. Minimum viable set: move (soft whoosh), capture (hard thunk), enemy move (subtle tick), death (dramatic hit), game start. Use the Web Audio API directly or a thin wrapper like Howler.js. All sounds should respect a mute toggle saved to `localStorage`.

### Background music — `medium`
A looping ambient track that builds tension as `timeElapsed` increases would reinforce the difficulty ramp. Crossfade between a calm layer (0–30s) and an intense layer (60s+) using the Web Audio API's `GainNode`. Must be mutable separately from SFX.

### Mobile touch controls — `medium`
Currently mouse-only. The raycasting approach in `onPointerDown` already works for `pointerdown` events (which fire on touch too), but touch targets need to be larger, and the valid-move highlights need to be bigger on small screens. Test on real devices; touch latency differs from mouse.

### Selectable player piece — `medium`
The architecture already supports this — `player.type` drives move generation via `getValidMoves()`. Exposing piece selection on the menu screen (queen / rook / knight / bishop) would add meaningful replayability with no new game logic required.

### Difficulty presets — `small`
Expose named difficulty presets (Easy / Normal / Hard) that tune `SCROLL_SPEED`, `ENEMY_BASE_SPAWN_CHANCE`, `ENEMY_MOVE_INTERVAL_MIN`, and `ENEMY_MAX_ON_SCREEN`. These constants are all in `shared/config.js` and can be overridden at game start.

### Tutorial / onboarding — `medium`
First-time players have no guidance. A minimal interactive tutorial (force one move, force one capture, then release to live gameplay) would significantly reduce D1 churn. Keep it skippable.

### Power-ups — `large`
Special pickups that appear on the board: freeze (stop all enemy timers for 3s), shield (survive one capture), speed (move twice in one turn). Would require spawning logic in `enemyManager.spawnOnNewRows()`, a new visual indicator, and player state to track active effects. High design complexity — worth prototyping only after core feel is tuned.

### High score leaderboard — `large`
`localStorage` high score is already implemented in `game.js`. A server-backed global leaderboard would require a backend (Firebase Realtime DB or a simple edge function) and an auth strategy. Scoped daily challenge leaderboards would also need seeded RNG. High complexity; not blocking.

### Seeded daily challenge mode — `large`
Seed `Math.random` (or use a seedable RNG like `mulberry32`) with the UTC date, giving all players the same board layout each day. Requires replacing the global `Math.random` calls in `enemyManager.js` with a seeded generator.

---

## 5. Technical Debt

### Two separate configs (`js/config.js` vs `shared/config.js`) can drift — `small`
The 2D renderer in `js/` has its own `config.js` with pixel-based dimensions (`CELL_SIZE: 60`). The 3D renderer uses `shared/config.js` with world-unit dimensions (`CELL_SIZE: 2`). Both are called `CONFIG` and exported the same way. A developer editing spawn rates in one file won't notice the other exists. Add a comment at the top of each config making the split explicit, or rename the 2D one to `js/config2d.js`.

### `player._lastMoveRefresh` set from `main.js` — `small`
`js3d/main.js:310` writes `player._lastMoveRefresh` directly, reaching into `Player` internals from outside the class. The throttled recompute logic belongs inside `Player.update()` or a dedicated `Player.throttledRecompute(dt, allPieces)` method.

### Debug markers unconditionally instantiated — `small`
`_createDebugMarkers()` is called from the constructor regardless of environment. Add `if (CONFIG.DEBUG)` guard so production builds don't create or track three extra meshes.

### 2D renderer (`js/`) is a dead code path for most users — `medium`
`index.html` loads the 2D renderer; `index-3d.html` loads the 3D one. There is no redirect or single entry point. The `js/` directory duplicates logic already covered by `shared/`. Decide whether the 2D renderer is kept as a fallback or deprecated; if the latter, remove it and consolidate `index.html` → 3D.

### No test coverage — `large`
Chess move generation (`shared/pieces.js`) is pure, deterministic logic that is easy to unit test. A dozen tests covering queen, rook, bishop, knight, and pawn moves — including edge cases at board boundaries and captures — would catch regressions in the core gameplay loop. Game logic in `shared/game.js`, `board.js`, and `enemyManager.js` is also largely side-effect-free and testable.

### `_getEnemyKey()` encodes spawn position, not identity — `small`
`renderer3d.js:502` generates enemy keys as `spawnRow_col_type`. An enemy that moves away from its spawn square retains its original key, which is fine — but two enemies of the same type spawning on the same cell in different games would collide. This is currently harmless because `_spawnTimes` is cleared on reset, but the coupling between identity and spawn position is fragile. A monotonic `id` counter on each enemy object would be cleaner.
