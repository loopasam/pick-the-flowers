import { GAME_W, GAME_H, TILE_SIZE, FLOWER_COUNT, COLORS, PLAYER_SPEED } from '../config.js';
import { makeCircleTexture, makeButterflyTexture, createFlowerTextures } from '../utils/textureGenerator.js';
import { terrainData } from './terrainData.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Game state
        this.player = null;
        this.cursors = null;
        this.pointerTarget = null;
        this.flowers = null;
        this.picked = 0;
        this.collectedByColor = { red: 0, yellow: 0, blue: 0 };
        this.countText = null;
        this.hintText = null;
        this.butterfly = null;
        this.restartBtn = null;
    }

    preload() {
        // Load grass tileset for tilemap (16x16 pixel tiles)
        this.load.image('grassTiles', 'art/Sprout Lands - Sprites - Basic pack/Tilesets/Grass.png');
    }

    create() {
        // Create terrain
        this.createTerrain();
        
        // Create textures
        this.createTextures();
        
        // Create player
        this.createPlayer();
        
        // Setup input
        this.setupInput();
        
        // Create flowers
        this.createFlowers();
        
        // Setup collision
        this.setupCollision();
        
        // Create UI
        this.createUI();
        
        // Setup restart button
        this.setupRestartButton();
    }

    createTerrain() {
        // Create a blank tilemap with explicit dimensions
        const map = this.make.tilemap({
            data: terrainData,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE,
            width: 64,
            height: 38
        });
        
        // Add the tileset image to the map
        const tileset = map.addTilesetImage('grassTiles', null, TILE_SIZE, TILE_SIZE, 0, 0);
        
        // Create the ground layer
        const groundLayer = map.createLayer(0, tileset, 0, 0);
        groundLayer.setDepth(-1);
    }

    createTextures() {
        makeCircleTexture(this, 'playerCircle', 18, 0x1fbfbe);  // teal
        createFlowerTextures(this);
        makeButterflyTexture(this, 'butterfly');
    }

    createPlayer() {
        this.player = this.physics.add.sprite(GAME_W / 2, GAME_H / 2, 'playerCircle');
        this.player.body.setCircle(18, 0, 0);
        this.player.setCollideWorldBounds(true);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.addKeys('W,A,S,D');
        this.input.on('pointerdown', (p) => {
            this.pointerTarget = new Phaser.Math.Vector2(p.x, p.y);
        });
        this.input.on('pointerup', () => {
            // keep moving to target until close
        });
    }

    createFlowers() {
        this.flowers = this.physics.add.staticGroup();
        const rng = this.random || Phaser.Math;
        
        for (let i = 0; i < FLOWER_COUNT; i++) {
            const color = COLORS[rng.Between(0, COLORS.length - 1)];
            const txKey = 'flower_' + color;
            const x = rng.Between(64, GAME_W - 64);
            const y = rng.Between(64, GAME_H - 64);
            const f = this.flowers.create(x, y, txKey);
            
            // Gentle idle pulse via tween
            this.tweens.add({
                targets: f,
                duration: 600,
                repeat: -1,
                yoyo: true,
                scale: { from: 1.0, to: 1.15 },
                ease: 'Sine.easeInOut'
            });
            
            f.setData('color', color);
        }
    }

    setupCollision() {
        this.physics.add.overlap(this.player, this.flowers, (playerObj, flowerObj) => {
            const color = flowerObj.getData('color');
            this.collectedByColor[color] = (this.collectedByColor[color] || 0) + 1;
            this.picked++;
            flowerObj.destroy();
            this.updateCounterText();
            if (this.picked >= FLOWER_COUNT) {
                this.celebrate();
            }
        });
    }

    createUI() {
        this.countText = this.add.text(24, 16, '', {
            fontFamily: 'system-ui, Arial, sans-serif',
            fontSize: '48px',
            color: '#203020'
        });
        
        this.hintText = this.add.text(24, 76, 'Pick all the flowers!', {
            fontFamily: 'system-ui, Arial, sans-serif',
            fontSize: '28px',
            color: '#304030'
        });

        // Butterfly (hidden until win)
        this.butterfly = this.add.sprite(GAME_W / 2, GAME_H / 2, 'butterfly');
        this.butterfly.visible = false;

        // Initial counter
        this.updateCounterText();
    }

    setupRestartButton() {
        this.restartBtn = document.getElementById('restart');
        this.restartBtn.onclick = () => this.resetGame();
    }

    update(time, delta) {
        // Keyboard movement (arrows/WASD)
        const left = this.cursors.left?.isDown || this.input.keyboard.addKey('A').isDown;
        const right = this.cursors.right?.isDown || this.input.keyboard.addKey('D').isDown;
        const up = this.cursors.up?.isDown || this.input.keyboard.addKey('W').isDown;
        const down = this.cursors.down?.isDown || this.input.keyboard.addKey('S').isDown;

        let vx = 0, vy = 0;

        if (left) vx -= 1;
        if (right) vx += 1;
        if (up) vy -= 1;
        if (down) vy += 1;

        // Tap-to-move if no keys pressed
        if (vx === 0 && vy === 0 && this.pointerTarget) {
            const dir = new Phaser.Math.Vector2(
                this.pointerTarget.x - this.player.x,
                this.pointerTarget.y - this.player.y
            );
            const dist = dir.length();
            if (dist < 6) {
                this.player.setVelocity(0, 0);
                this.pointerTarget = null; // reached
            } else {
                dir.normalize();
                this.player.setVelocity(dir.x * PLAYER_SPEED, dir.y * PLAYER_SPEED);
            }
        } else {
            if (vx !== 0 || vy !== 0) {
                const len = Math.hypot(vx, vy);
                vx = (vx / len) * PLAYER_SPEED;
                vy = (vy / len) * PLAYER_SPEED;
            }
            this.player.setVelocity(vx, vy);
        }
    }

    updateCounterText() {
        this.countText.setText(`Flowers: ${this.picked} / ${FLOWER_COUNT}`);
    }

    celebrate() {
        // Butterfly float + show restart button after a short delay
        this.butterfly.visible = true;
        this.butterfly.x = GAME_W / 2;
        this.butterfly.y = GAME_H - 120;
        this.butterfly.angle = 0;
        
        // Create chained tweens for Phaser 3
        this.tweens.add({
            targets: this.butterfly,
            y: 120,
            duration: 2000,
            ease: 'Sine.easeInOut'
        });
        
        this.tweens.add({
            targets: this.butterfly,
            angle: 12,
            duration: 600,
            ease: 'Sine.easeInOut',
            delay: 2000
        });
        
        this.tweens.add({
            targets: this.butterfly,
            angle: -12,
            duration: 600,
            ease: 'Sine.easeInOut',
            delay: 2600
        });
        
        this.tweens.add({
            targets: this.butterfly,
            angle: 0,
            duration: 400,
            ease: 'Sine.easeInOut',
            delay: 3200
        });
        
        // Show button after a beat
        this.time.delayedCall(800, () => {
            this.restartBtn.style.display = 'inline-block';
        });
    }

    resetGame() {
        // Clear flowers
        this.flowers.clear(true, true);
        this.picked = 0;
        this.collectedByColor = { red: 0, yellow: 0, blue: 0 };
        this.updateCounterText();
        this.hintText.setText('Pick all the flowers!');
        this.butterfly.visible = false;
        this.restartBtn.style.display = 'none';

        // Recreate flowers
        const rng = this.random || Phaser.Math;
        for (let i = 0; i < FLOWER_COUNT; i++) {
            const color = COLORS[rng.Between(0, COLORS.length - 1)];
            const txKey = 'flower_' + color;
            const x = rng.Between(64, GAME_W - 64);
            const y = rng.Between(64, GAME_H - 64);
            const f = this.flowers.create(x, y, txKey);
            this.tweens.add({
                targets: f,
                duration: 600,
                repeat: -1,
                yoyo: true,
                scale: { from: 1.0, to: 1.15 },
                ease: 'Sine.easeInOut'
            });
            f.setData('color', color);
        }
        
        // Keep player inside screen & stop movement
        this.player.setPosition(GAME_W / 2, GAME_H / 2);
        this.player.setVelocity(0, 0);
        this.pointerTarget = null;
    }
}
