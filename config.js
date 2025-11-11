// Game configuration constants
export const GAME_W = 1024;
export const GAME_H = 608; // 64x38 tiles (16px each)
export const TILE_SIZE = 16;
export const FLOWER_COUNT = 2;
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
        arcade: { debug: true } 
    }
};
