// Main game initialization
import { gameConfig } from './config.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { EndGameScene } from './scenes/EndGameScene.js';

// Initialize Phaser game with all scenes
const config = {
    ...gameConfig,
    scene: [GameScene, UIScene, EndGameScene]
};

const game = new Phaser.Game(config);
