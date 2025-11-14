import { MAP_W, MAP_H } from '../config.js';

export class EndGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndGameScene' });
    }

    preload() {
        // Load character spritesheet for button icon
        this.load.spritesheet('character', 'art/Sprout Lands - Sprites - Basic pack/Characters/Basic Charakter Spritesheet.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        
        // Load applause sound for winning
        this.load.audio('applause', 'sounds/LOA_FX_Applause5.wav');
    }

    create() {
        // Play applause sound when player wins
        this.sound.play('applause', { volume: 0.6 });
        
        // Create semi-transparent overlay
        const overlay = this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x000000, 0.8);
        overlay.setScrollFactor(0);
        overlay.setDepth(2000);

        // Character sprite instead of title text
        const titleCharacter = this.add.sprite(MAP_W / 2, MAP_H / 2 - 80, 'character', 13);
        titleCharacter.setOrigin(0.5);
        titleCharacter.setScrollFactor(0);
        titleCharacter.setDepth(2001);
        titleCharacter.setScale(6);  // Make it large

        // Restart button background
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = MAP_W / 2;
        const buttonY = MAP_H / 2 + 40;

        const buttonBg = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x4CAF50);
        buttonBg.setStrokeStyle(4, 0x87CEEB);
        buttonBg.setScrollFactor(0);
        buttonBg.setDepth(2001);
        buttonBg.setInteractive({ useHandCursor: true });

        // Restart button text
        const buttonText = this.add.text(buttonX, buttonY, 'PLAY AGAIN', {
            fontFamily: 'system-ui, Arial, sans-serif',
            fontSize: '32px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);
        buttonText.setScrollFactor(0);
        buttonText.setDepth(2002);

        // Button hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x66BB6A);
            this.tweens.add({
                targets: buttonBg,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                ease: 'Power2'
            });
            this.tweens.add({
                targets: buttonText,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                ease: 'Power2'
            });
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x4CAF50);
            this.tweens.add({
                targets: buttonBg,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 100,
                ease: 'Power2'
            });
            this.tweens.add({
                targets: buttonText,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 100,
                ease: 'Power2'
            });
        });

        // Button click - restart both GameScene and UIScene
        buttonBg.on('pointerdown', () => {
            // Stop this scene
            this.scene.stop('EndGameScene');
            
            // Restart GameScene which will also restart UIScene
            this.scene.stop('UIScene');
            this.scene.start('GameScene');
            this.scene.start('UIScene');
        });

        // Fade in the end screen
        overlay.setAlpha(0);
        titleCharacter.setAlpha(0);
        buttonBg.setAlpha(0);
        buttonText.setAlpha(0);

        this.tweens.add({
            targets: [overlay, titleCharacter, buttonBg, buttonText],
            alpha: 1,
            duration: 600,
            ease: 'Power2'
        });
    }
}
