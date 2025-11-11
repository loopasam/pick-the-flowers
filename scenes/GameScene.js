import { GAME_W, GAME_H, TILE_SIZE, FLOWER_COUNT, COLORS, PLAYER_SPEED, TILE_SCALE, TILES_X, TILES_Y } from '../config.js';
import { makeCircleTexture, makeButterflyTexture, createFlowerTextures } from '../utils/textureGenerator.js';

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
        
        // Load character spritesheet (16x16 pixel frames in a grid)
        this.load.spritesheet('character', 'art/Sprout Lands - Sprites - Basic pack/Characters/Basic Charakter Spritesheet.png', {
            frameWidth: 16,
            frameHeight: 16
        });
    }

    create() {
        // Set physics world bounds to match game world
        this.physics.world.setBounds(0, 0, GAME_W, GAME_H);
        
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
        // Generate terrain data dynamically based on viewport size
        const terrainData = this.generateTerrainData(TILES_X, TILES_Y);
        
        // Create a blank tilemap with dynamic dimensions
        const map = this.make.tilemap({
            data: terrainData,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE,
            width: TILES_X,
            height: TILES_Y
        });
        
        // Add the tileset image to the map
        const tileset = map.addTilesetImage('grassTiles', null, TILE_SIZE, TILE_SIZE, 0, 0);
        
        // Create the ground layer
        const groundLayer = map.createLayer(0, tileset, 0, 0);
        groundLayer.setDepth(-1);
    }
    
    generateTerrainData(width, height) {
        // Generate a varied terrain using different grass tiles
        const terrain = [];
        const grassTiles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // Grass tileset indices
        
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                // Create some variation in the grass
                const rand = Math.random();
                let tileIndex;
                if (rand < 0.7) {
                    tileIndex = 0; // Most common grass
                } else if (rand < 0.85) {
                    tileIndex = 1; // Some variety
                } else if (rand < 0.95) {
                    tileIndex = 2; // More variety
                } else {
                    tileIndex = Math.floor(Math.random() * 12); // Occasional random tile
                }
                row.push(tileIndex);
            }
            terrain.push(row);
        }
        return terrain;
    }

    createTextures() {
        makeCircleTexture(this, 'playerCircle', 18, 0x1fbfbe);  // teal
        createFlowerTextures(this);
        makeButterflyTexture(this, 'butterfly');
        
        // Create character animations
        this.createCharacterAnimations();
    }

    createCharacterAnimations() {
        // Animation for moving down
        this.anims.create({
            key: 'walk-down',
            frames: [
                { key: 'character', frame: 13 },
                { key: 'character', frame: 16 },
                { key: 'character', frame: 19 },
                { key: 'character', frame: 22 }
            ],
            frameRate: 8,
            repeat: -1
        });
        
        // Animation for moving up
        this.anims.create({
            key: 'walk-up',
            frames: [
                { key: 'character', frame: 49 },
                { key: 'character', frame: 52 },
                { key: 'character', frame: 55 },
                { key: 'character', frame: 58 }
            ],
            frameRate: 8,
            repeat: -1
        });
        
        // Animation for moving left
        this.anims.create({
            key: 'walk-left',
            frames: [
                { key: 'character', frame: 85 },
                { key: 'character', frame: 88 },
                { key: 'character', frame: 91 },
                { key: 'character', frame: 94 }
            ],
            frameRate: 8,
            repeat: -1
        });
        
        // Animation for moving right
        this.anims.create({
            key: 'walk-right',
            frames: [
                { key: 'character', frame: 121 },
                { key: 'character', frame: 124 },
                { key: 'character', frame: 127 },
                { key: 'character', frame: 130 }
            ],
            frameRate: 8,
            repeat: -1
        });
        
        // Idle animations (first frame of each direction)
        this.anims.create({
            key: 'idle-down',
            frames: [{ key: 'character', frame: 13 }],
            frameRate: 1
        });
        
        this.anims.create({
            key: 'idle-up',
            frames: [{ key: 'character', frame: 49 }],
            frameRate: 1
        });
        
        this.anims.create({
            key: 'idle-left',
            frames: [{ key: 'character', frame: 85 }],
            frameRate: 1
        });
        
        this.anims.create({
            key: 'idle-right',
            frames: [{ key: 'character', frame: 121 }],
            frameRate: 1
        });
    }

    createPlayer() {
        this.player = this.physics.add.sprite(GAME_W / 2, GAME_H / 2, 'character', 13);
        this.player.body.setSize(12, 12);
        this.player.body.setOffset(2, 4);
        this.player.setCollideWorldBounds(true);
        this.player.setData('lastDirection', 'down');
        this.player.play('idle-down');
        
        // Setup camera zoom - zoom to show scaled tiles
        this.cameras.main.setZoom(TILE_SCALE);
        this.cameras.main.setBounds(0, 0, GAME_W, GAME_H);
        // Center camera on the map (no follow needed since whole map is visible)
        this.cameras.main.centerOn(GAME_W / 2, GAME_H / 2);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.addKeys('W,A,S,D');
        this.input.on('pointerdown', (p) => {
            // Convert screen coordinates to world coordinates
            const worldX = this.cameras.main.scrollX + p.x / TILE_SCALE;
            const worldY = this.cameras.main.scrollY + p.y / TILE_SCALE;
            
            // Clamp coordinates within world bounds
            const clampedX = Phaser.Math.Clamp(worldX, 0, GAME_W);
            const clampedY = Phaser.Math.Clamp(worldY, 0, GAME_H);
            
            this.pointerTarget = new Phaser.Math.Vector2(clampedX, clampedY);
        });
        this.input.on('pointerup', () => {
            // keep moving to target until close
        });
    }

    createFlowers() {
        this.flowers = this.physics.add.staticGroup();
        const rng = this.random || Phaser.Math;
        
        // Calculate padding in world coordinates
        const padding = TILE_SIZE * 3; // Keep flowers away from edges
        
        for (let i = 0; i < FLOWER_COUNT; i++) {
            const color = COLORS[rng.Between(0, COLORS.length - 1)];
            const txKey = 'flower_' + color;
            const x = rng.Between(padding, GAME_W - padding);
            const y = rng.Between(padding, GAME_H - padding);
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
        this.countText.setScrollFactor(0); // Fixed to camera
        
        this.hintText = this.add.text(24, 76, 'Pick all the flowers!', {
            fontFamily: 'system-ui, Arial, sans-serif',
            fontSize: '28px',
            color: '#304030'
        });
        this.hintText.setScrollFactor(0); // Fixed to camera

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
                vx = dir.x;
                vy = dir.y;
            }
        } else {
            if (vx !== 0 || vy !== 0) {
                const len = Math.hypot(vx, vy);
                vx = (vx / len) * PLAYER_SPEED;
                vy = (vy / len) * PLAYER_SPEED;
            }
            this.player.setVelocity(vx, vy);
        }
        
        // Update animation based on movement
        this.updatePlayerAnimation(vx, vy);
    }
    
    updatePlayerAnimation(vx, vy) {
        const isMoving = vx !== 0 || vy !== 0;
        
        if (isMoving) {
            // Determine primary direction
            if (Math.abs(vx) > Math.abs(vy)) {
                // Horizontal movement dominates
                if (vx > 0) {
                    this.player.play('walk-right', true);
                    this.player.setData('lastDirection', 'right');
                } else {
                    this.player.play('walk-left', true);
                    this.player.setData('lastDirection', 'left');
                }
            } else {
                // Vertical movement dominates
                if (vy > 0) {
                    this.player.play('walk-down', true);
                    this.player.setData('lastDirection', 'down');
                } else {
                    this.player.play('walk-up', true);
                    this.player.setData('lastDirection', 'up');
                }
            }
        } else {
            // Play idle animation for last direction
            const lastDir = this.player.getData('lastDirection') || 'down';
            this.player.play('idle-' + lastDir, true);
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
        const padding = TILE_SIZE * 3;
        for (let i = 0; i < FLOWER_COUNT; i++) {
            const color = COLORS[rng.Between(0, COLORS.length - 1)];
            const txKey = 'flower_' + color;
            const x = rng.Between(padding, GAME_W - padding);
            const y = rng.Between(padding, GAME_H - padding);
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
