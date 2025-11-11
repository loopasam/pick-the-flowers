// Main game initialization
import { gameConfig, TILE_SCALE } from './config.js';
import { GameScene } from './scenes/GameScene.js';

// Initialize Phaser game with the GameScene
const config = {
    ...gameConfig,
    scene: [GameScene]
};

const game = new Phaser.Game(config);

// Scale the canvas to make everything bigger while maintaining pixel-perfect rendering
window.addEventListener('load', () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.style.imageRendering = 'pixelated';
        canvas.style.imageRendering = 'crisp-edges';
        canvas.style.width = `${canvas.width * TILE_SCALE}px`;
        canvas.style.height = `${canvas.height * TILE_SCALE}px`;
    }
});
