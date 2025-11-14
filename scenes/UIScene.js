import { MAP_W, MAP_H } from '../config.js';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
        this.targetFlowerSprite = null;
        this.targetFlowerBox = null;
    }

    preload() {
        // Load applause sound for victory confetti
        this.load.audio('applause', 'sounds/LOA_FX_Applause5.wav');
    }

    create() {
        // Get reference to GameScene
        const gameScene = this.scene.get('GameScene');

        // Listen for target flower updates
        gameScene.events.on('updateTargetFlower', (flowerColor) => {
            this.updateTargetFlower(flowerColor);
        }, this);

        // Listen for game complete event
        gameScene.events.on('gameComplete', () => {
            this.showGameComplete();
        }, this);

        // Listen for scene resize to reposition UI elements
        this.scale.on('resize', this.resize, this);
    }

    updateTargetFlower(flowerColor) {
        // Remove previous flower sprite and box if they exist
        if (this.targetFlowerSprite) {
            this.targetFlowerSprite.destroy();
        }
        if (this.targetFlowerBox) {
            this.targetFlowerBox.destroy();
        }

        // Map colors to spritesheet frame indices (same as GameScene)
        const colorToFrame = {
            red: 6,      // red mushroom
            yellow: 25,  // yellow flower
            blue: 34     // pink flower
        };

        const frameIndex = colorToFrame[flowerColor];

        // Position in top-left area
        const boxSize = 80;
        const boxX = 50;
        const boxY = 50;

        // Create box background
        this.targetFlowerBox = this.add.rectangle(
            boxX,
            boxY,
            boxSize,
            boxSize,
            0x000000,
            0.7
        );
        this.targetFlowerBox.setStrokeStyle(4, 0x87CEEB);
        this.targetFlowerBox.setScrollFactor(0);
        this.targetFlowerBox.setDepth(999);

        // Create new flower sprite (larger scale)
        this.targetFlowerSprite = this.add.sprite(boxX, boxY, 'objects', frameIndex);
        this.targetFlowerSprite.setScrollFactor(0);
        this.targetFlowerSprite.setDepth(1000);
        this.targetFlowerSprite.setScale(3.5);  // Make it much larger

        // Add a subtle bounce animation
        this.tweens.add({
            targets: this.targetFlowerSprite,
            scaleX: 3.8,
            scaleY: 3.8,
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    showGameComplete() {
        // Play applause sound when confetti starts!
        this.sound.play('applause', { volume: 0.6 });
        
        // Hide the target flower display
        if (this.targetFlowerSprite) {
            this.targetFlowerSprite.destroy();
            this.targetFlowerSprite = null;
        }
        if (this.targetFlowerBox) {
            this.targetFlowerBox.destroy();
            this.targetFlowerBox = null;
        }

        // Map colors to spritesheet frame indices
        const colorToFrame = {
            red: 6,
            yellow: 25,
            blue: 34
        };

        const colors = ['red', 'yellow', 'blue'];
        
        // Create flower rain effect - spawn flowers from top
        const flowerCount = 50;
        const spawnDuration = 2500; // Duration to spawn all flowers
        
        for (let i = 0; i < flowerCount; i++) {
            const delay = (i / flowerCount) * spawnDuration;
            
            this.time.delayedCall(delay, () => {
                // Random color
                const color = colors[Math.floor(Math.random() * colors.length)];
                const frameIndex = colorToFrame[color];
                
                // Random x position across the screen width
                const x = Math.random() * MAP_W;
                const startY = -50; // Start above screen
                
                // Create flower sprite
                const flower = this.add.sprite(x, startY, 'objects', frameIndex);
                flower.setScrollFactor(0);
                flower.setDepth(1000);
                flower.setScale(2);
                
                // Random fall speed and rotation
                const fallDuration = 2000 + Math.random() * 1500;
                const endY = MAP_H + 50;
                const rotation = Math.random() * Math.PI * 4 - Math.PI * 2; // Random rotation
                const sidewaysDrift = (Math.random() - 0.5) * 200; // Slight horizontal drift
                
                // Add sparkle particle trail
                const sparkleColor = color === 'red' ? 0xff4d4d : color === 'yellow' ? 0xffe24d : 0xff69b4;
                const sparkle = this.add.circle(x, startY, 3, sparkleColor, 0.8);
                sparkle.setScrollFactor(0);
                sparkle.setDepth(999);
                
                // Animate sparkle to follow and fade
                this.tweens.add({
                    targets: sparkle,
                    y: endY,
                    x: x + sidewaysDrift,
                    alpha: 0,
                    duration: fallDuration,
                    ease: 'Linear',
                    onComplete: () => sparkle.destroy()
                });
                
                // Animate flower falling
                this.tweens.add({
                    targets: flower,
                    y: endY,
                    x: x + sidewaysDrift,
                    rotation: rotation,
                    duration: fallDuration,
                    ease: 'Cubic.easeIn',
                    onComplete: () => flower.destroy()
                });
                
                // Add slight scale pulse during fall
                this.tweens.add({
                    targets: flower,
                    scaleX: 2.3,
                    scaleY: 2.3,
                    duration: 400,
                    yoyo: true,
                    repeat: Math.floor(fallDuration / 800),
                    ease: 'Sine.easeInOut'
                });
            });
        }

        // Launch EndGameScene after flower rain completes
        this.time.delayedCall(5000, () => {
            this.scene.launch('EndGameScene');
        });
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
