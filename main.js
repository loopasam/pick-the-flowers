// Main game initialization
import { gameConfig } from './config.js';
import { GameScene } from './scenes/GameScene.js';

// Initialize Phaser game with the GameScene
const config = {
    ...gameConfig,
    scene: [GameScene]
};

new Phaser.Game(config);
