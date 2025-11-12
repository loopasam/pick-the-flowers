// Main game initialization
import { gameConfig } from './config.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

// Initialize Phaser game with GameScene and UIScene
const config = {
    ...gameConfig,
    scene: [GameScene, UIScene]
};

const game = new Phaser.Game(config);
