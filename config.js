// Dynamic game configuration
// Calculate based on viewport, leaving some padding
const padding = 40; // pixels of padding around the game
const viewportWidth = window.innerWidth - padding;
const viewportHeight = window.innerHeight - padding;

// Base tile size (from the sprite)
export const BASE_TILE_SIZE = 16;

// Scale factor to make tiles more visible (adjust this to make tiles bigger/smaller)
export const TILE_SCALE = 2; // Each 16px tile will be displayed as 32px

// Calculate how many tiles fit in the viewport at this scale
export const TILES_X = Math.floor(viewportWidth / (BASE_TILE_SIZE * TILE_SCALE));
export const TILES_Y = Math.floor(viewportHeight / (BASE_TILE_SIZE * TILE_SCALE));

// Actual game world dimensions (in pixels at base scale)
export const GAME_W = TILES_X * BASE_TILE_SIZE;
export const GAME_H = TILES_Y * BASE_TILE_SIZE;

// Display dimensions (scaled up)
export const DISPLAY_W = GAME_W * TILE_SCALE;
export const DISPLAY_H = GAME_H * TILE_SCALE;

export const TILE_SIZE = BASE_TILE_SIZE;
export const FLOWER_COUNT = 2; // Scale flower count with map size
export const COLORS = ['red', 'yellow', 'blue'];
export const PLAYER_SPEED = 200;

export const gameConfig = {
    type: Phaser.AUTO,
    width: GAME_W,
    height: GAME_H,
    backgroundColor: 0x008080, // teal background
    parent: 'game',
    physics: { 
        default: 'arcade', 
        arcade: { 
            debug: true, // Enable to see collision bounds
            gravity: { y: 0 }
        } 
    },
    scale: {
        mode: Phaser.Scale.NONE,
        width: GAME_W,
        height: GAME_H
    },
    render: {
        pixelArt: true // Enable pixel-perfect rendering
    }
};
