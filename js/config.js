// All tunable game constants

export const CONFIG = {
    // Board dimensions
    COLS: 8,
    VISIBLE_ROWS: 10,
    CELL_SIZE: 70,

    // Scroll
    SCROLL_SPEED: 30, // pixels per second

    // Player
    PLAYER_START_COL: 3,
    PLAYER_START_ROW_FROM_TOP: 7, // how many rows from top of initial view
    PLAYER_MOVE_DURATION: 0.15, // seconds for slide animation

    // Enemies
    ENEMY_BASE_SPAWN_CHANCE: 0.15, // chance per cell on a new row
    ENEMY_MAX_SPAWN_CHANCE: 0.45,
    ENEMY_SPAWN_RAMP_TIME: 120, // seconds to reach max spawn chance
    ENEMY_MOVE_INTERVAL_MIN: 2.0, // seconds between enemy moves
    ENEMY_MOVE_INTERVAL_MAX: 4.0,
    ENEMY_MOVE_INTERVAL_REDUCE_RATE: 0.002, // reduce per second of game time
    ENEMY_MOVE_INTERVAL_FLOOR: 1.0,
    ENEMY_MAX_ON_SCREEN: 20,

    // Difficulty: time thresholds (seconds) for introducing piece types
    ENEMY_TIER_PAWN: 0,
    ENEMY_TIER_KNIGHT: 20,
    ENEMY_TIER_BISHOP: 30,
    ENEMY_TIER_ROOK: 50,
    ENEMY_TIER_QUEEN: 80,

    // Colors
    LIGHT_SQUARE: '#f0d9b5',
    DARK_SQUARE: '#b58863',
    VALID_MOVE_COLOR: 'rgba(100, 200, 100, 0.45)',
    VALID_CAPTURE_COLOR: 'rgba(220, 60, 60, 0.45)',
    PLAYER_COLOR: '#ffffff',
    ENEMY_COLOR: '#1a1a1a',
    HUD_BG: 'rgba(0, 0, 0, 0.7)',
    HUD_TEXT: '#ffffff',

    // Unicode piece symbols (white set for player, black set for enemies)
    PIECE_SYMBOLS: {
        king:   { player: '♔', enemy: '♚' },
        queen:  { player: '♕', enemy: '♛' },
        rook:   { player: '♖', enemy: '♜' },
        bishop: { player: '♗', enemy: '♝' },
        knight: { player: '♘', enemy: '♞' },
        pawn:   { player: '♙', enemy: '♟' },
    },

    PIECE_FONT_SIZE_RATIO: 0.7, // relative to CELL_SIZE
};
