// 3D-specific config (adapted from 2D config)

export const CONFIG = {
    // Board dimensions
    COLS: 8,
    VISIBLE_ROWS: 10,
    CELL_SIZE: 2, // World units (not pixels - this is 3D space)

    // Scroll (now means camera/world movement along Z-axis)
    SCROLL_SPEED: 1.5, // units per second (slow pace for playability)

    // Player
    PLAYER_START_COL: 3,
    PLAYER_START_ROW_FROM_TOP: 7,
    PLAYER_MOVE_DURATION: 0.15,

    // Enemies
    ENEMY_BASE_SPAWN_CHANCE: 0.12,
    ENEMY_MAX_SPAWN_CHANCE: 0.35,
    ENEMY_SPAWN_RAMP_TIME: 120,
    ENEMY_MOVE_INTERVAL_MIN: 2.0,
    ENEMY_MOVE_INTERVAL_MAX: 4.0,
    ENEMY_MOVE_INTERVAL_REDUCE_RATE: 0.002,
    ENEMY_MOVE_INTERVAL_FLOOR: 1.0,
    ENEMY_MAX_ON_SCREEN: 5, // 50% reduction from 10 for better difficulty balance

    // Difficulty tiers
    ENEMY_TIER_PAWN: 3,
    ENEMY_TIER_KNIGHT: 30,
    ENEMY_TIER_BISHOP: 50,
    ENEMY_TIER_ROOK: 80,
    ENEMY_TIER_QUEEN: 120,

    // Colors (converted to hex for Three.js)
    LIGHT_SQUARE: 0xf0d9b5,
    DARK_SQUARE: 0xb58863,
    VALID_MOVE_COLOR: 0x64c864,
    VALID_CAPTURE_COLOR: 0xdc3c3c,
    PLAYER_COLOR: 0xffffff,
    ENEMY_COLOR: 0x1a1a1a,

    // Board deformation
    BOARD_CURVE_RADIUS: 0,        // Cylinder radius (larger = subtler curve, 0 = flat)
    BOARD_WAVE_AMPLITUDE: 0.4,    // Wave height in world units
    BOARD_WAVE_FREQUENCY: 0.3,    // Waves per world unit (along Z)
    BOARD_WAVE_SPEED: 1.5,        // Wave animation speed
    BOARD_TWIST_RATE: 0,          // Radians of twist per world unit of depth

    // Piece symbols (still used for text labels if needed)
    PIECE_SYMBOLS: {
        king:   { player: '♔', enemy: '♚' },
        queen:  { player: '♕', enemy: '♛' },
        rook:   { player: '♖', enemy: '♜' },
        bishop: { player: '♗', enemy: '♝' },
        knight: { player: '♘', enemy: '♞' },
        pawn:   { player: '♙', enemy: '♟' },
    },
};
