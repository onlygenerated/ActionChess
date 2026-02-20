# Action Chess

*Status: Active — Early prototype*
*Repo: github.com/onlygenerated/ActionChess (public)*
*Live: https://onlygenerated.github.io/ActionChess*

---

## Concept

An auto-scrolling survival chess game. You're a white king constantly moving up the board. Enemy pieces spawn ahead and move toward you. Click valid moves (highlighted in green/red) to dodge enemies or capture them. The board scrolls, enemies spawn faster, and their move intervals shrink over time. Survive as long as you can.

*One-sentence pitch:* An endless-runner chess game where you dodge and capture enemies using valid chess moves while the board auto-scrolls upward.

---

## Core Mechanics

**Auto-scrolling:**
- Board scrolls up at 30 pixels/second (configurable)
- Player starts 7 rows from the top of the visible area
- If the player scrolls off the top edge → game over

**Player:**
- Plays as white king (♔)
- Valid moves highlight on the board (green = empty, red = capture)
- Click any highlighted square to move (smooth slide animation, 0.15s)
- Valid moves recompute after each animation completes

**Enemies:**
- Spawn on new rows as they scroll into view (15% base chance per cell, ramping to 45% over 120 seconds)
- Piece types unlock over time:
  - 0s: Pawns (♟)
  - 20s: Knights (♞)
  - 30s: Bishops (♝)
  - 50s: Rooks (♜)
  - 80s: Queens (♛)
- Enemies move toward the player using their chess piece movement rules
- Move intervals start at 2-4 seconds, shrink to 1 second minimum as game progresses
- Max 20 enemies on screen at once

**Win/Loss:**
- No win condition — it's an endless survival game
- Score = seconds survived
- Lose if:
  - You scroll off the top
  - An enemy captures you

---

## Tech Stack

- Vanilla JS + Canvas 2D API
- ES6 modules (`main.js`, `game.js`, `board.js`, `player.js`, `enemyManager.js`, `renderer.js`, `pieces.js`, `config.js`)
- Hosted on GitHub Pages

---

## Current Architecture

| File | Purpose |
|------|---------|
| `main.js` | Game loop, input handling, initialization |
| `game.js` | Core state (scroll offset, score, game over logic, GameState enum) |
| `board.js` | Infinite scrolling board (generates new rows as needed) |
| `player.js` | Player movement, animation, valid move calculation |
| `enemyManager.js` | Enemy spawning, movement AI, collision detection |
| `renderer.js` | Canvas drawing (board, pieces, HUD, menu/game over screens) |
| `pieces.js` | Chess piece movement rules (king, queen, rook, bishop, knight, pawn) |
| `config.js` | All tunable constants (scroll speed, spawn rates, colors, piece symbols) |

---

## What Has Been Built

- ✅ Infinite scrolling chessboard (8 cols, 10 visible rows)
- ✅ Player king with valid move highlighting
- ✅ Enemy spawning system with difficulty ramp (spawn chance + move speed)
- ✅ Five enemy piece types with chess-accurate movement (pawn, knight, bishop, rook, queen)
- ✅ Smooth slide animations for all piece movement
- ✅ Collision detection (player captures enemies, enemies capture player)
- ✅ HUD (score, time survived)
- ✅ Menu screen + game over screen with restart button
- ✅ Dying state (freeze the board, let capture animation finish, then show game over)

---

## What's Not Yet Built

- Sound effects
- Music
- High score persistence (localStorage)
- Difficulty modes or tuning presets
- Power-ups or special moves
- Leaderboard
- Mobile touch controls (currently mouse-only)

---

## Design Notes

**Why it works:**
- Chess piece movement is familiar but requires tactical thinking under time pressure
- Auto-scroll adds urgency — you can't just wait for the perfect move
- Enemy diversity (5 piece types) forces you to recognize threats and adapt quickly
- Escalating difficulty (spawn rate + move speed) creates natural tension curve

**Core tension:**
- "Do I take this risky capture to clear space, or dodge and keep moving?"
- "Can I get to safety before this rook closes the gap?"

**Potential extensions:**
- Different player pieces (queen, knight, etc.) with different movement patterns
- Special tiles (safe zones, teleporters, slow zones)
- Power-ups (freeze enemies, extra move, invincibility)
- Co-op mode (two players on the same board)
- Tournament mode (fixed seed, compare scores)

---

## Next Steps

1. *Playtest and tune* — Current spawn/move rates may be too easy or too hard; needs iteration
2. *High score persistence* — Save best score to localStorage
3. *Mobile controls* — Touch-friendly move selection (tap to highlight, tap again to confirm?)
4. *Sound pass* — Move sound, capture sound, game over sound
5. *Visual polish* — Piece sprites instead of Unicode symbols, particle effects for captures

---

*Created: 2026-02-20*
