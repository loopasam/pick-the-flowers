// Fixed design resolution (exact tile ratio)
export const DESIGN_W = 1280;
export const DESIGN_H = 720;

// Tile configuration
export const TILE_SIZE = 16;
export const TILES_X = 40;  // Reduced for better character visibility
export const TILES_Y = 25;  // Reduced for better character visibility

// Map dimensions match design canvas exactly
export const MAP_W = TILES_X * TILE_SIZE;  // 1280px
export const MAP_H = TILES_Y * TILE_SIZE;  // 720px

// Game settings
export const FLOWER_COUNT = 8;  // Adjusted for smaller map
export const COLORS = ['red', 'yellow', 'blue'];
export const PLAYER_SPEED = 200;

export const gameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: DESIGN_W,
    height: DESIGN_H,
    backgroundColor: 0x008080,
    physics: { 
        default: 'arcade', 
        arcade: { 
            debug: false,
            gravity: { y: 0 }
        } 
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        resolution: Math.min(2, window.devicePixelRatio)
    },
    pixelArt: true
};
