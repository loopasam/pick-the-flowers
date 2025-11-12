import { MAP_W, MAP_H } from '../config.js';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
        this.score = 0;
    }

    create() {
        // Score display in top-left
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontFamily: 'system-ui, Arial, sans-serif',
            fontSize: '36px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 5,
            fontStyle: 'bold'
        });
        this.scoreText.setScrollFactor(0);
        this.scoreText.setDepth(1000);

        // Item container at bottom center
        const containerWidth = 120;
        const containerHeight = 30;
        const containerX = MAP_W / 2;
        const containerY = MAP_H - containerHeight / 2 - 20;

        // Create container background
        this.itemContainer = this.add.rectangle(
            containerX,
            containerY,
            containerWidth,
            containerHeight,
            0x000000,
            0.7
        );
        this.itemContainer.setStrokeStyle(3, 0xFFD700);
        this.itemContainer.setScrollFactor(0);
        this.itemContainer.setDepth(1000);

        // Get reference to GameScene
        const gameScene = this.scene.get('GameScene');

        // Listen for score events from GameScene
        gameScene.events.on('addScore', (points) => {
            this.score += points;
            this.scoreText.setText(`Score: ${this.score}`);
        }, this);

        // Listen for scene resize to reposition UI elements
        this.scale.on('resize', this.resize, this);
    }

    resize(gameSize) {
        // Reposition item container on resize
        const containerWidth = 120;
        const containerHeight = 120;
        const containerX = MAP_W / 2;
        const containerY = MAP_H - containerHeight / 2 - 20;
        
        if (this.itemContainer) {
            this.itemContainer.setPosition(containerX, containerY);
        }
    }
}
