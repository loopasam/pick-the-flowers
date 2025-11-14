import { MAP_W, MAP_H, TILE_SIZE, FLOWER_COUNT, COLORS, PLAYER_SPEED, TILES_X, TILES_Y } from '../config.js';
import { makeCircleTexture } from '../utils/textureGenerator.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        // Game state
        this.player = null;
        this.cursors = null;
        this.keys = null;
        this.flowers = null;
        this.picked = 0;
        
        // Ordered flower picking logic
        this.flowerSequence = [];  // Ordered list of flower types to pick
        this.currentFlowerIndex = 0;  // Current position in the sequence
    }

    preload() {
        // Load grass tileset for tilemap (16x16 pixel tiles)
        this.load.image('grassTiles', 'art/Sprout Lands - Sprites - Basic pack/Tilesets/Grass.png');

        // Load character spritesheet (16x16 pixel frames in a grid)
        this.load.spritesheet('character', 'art/Sprout Lands - Sprites - Basic pack/Characters/Basic Charakter Spritesheet.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // Load objects spritesheet for flowers and mushrooms (16x16 pixel frames in a grid)
        this.load.spritesheet('objects', 'art/Sprout Lands - Sprites - Basic pack/Objects/Basic_Grass_Biom_things.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // Load background music
        this.load.audio('soundtrack', 'sounds/XMV_100_Gmaj_Garden_Marimba_02.wav');
        
        // Load pickup sound effect
        this.load.audio('pickup', 'sounds/PR_Instrument_Xylophone_Notification_2_CT.wav');
    }

    create() {
        // Set physics world bounds to match game world
        this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

        // Create terrain, textures, and game entities
        this.createTerrain();
        this.createTextures();
        this.createPlayer();
        this.setupInput();
        this.createFlowers();
        this.setupCollision();
        this.createUI();

        // Camera setup
        const ZOOM = 2;
        const cam = this.cameras.main;
        cam.setBounds(0, 0, MAP_W, MAP_H);
        cam.startFollow(this.player, true, 0.1, 0.1);
        cam.setRoundPixels(true);
        cam.setZoom(ZOOM);

        // Keep zoom consistent on window resize
        this.scale.on('resize', (gameSize) => {
            cam.setZoom(ZOOM);
        });

        // Start background music as a loop
        this.backgroundMusic = this.sound.add('soundtrack', {
            loop: true,
            volume: 0.5
        });
        this.backgroundMusic.play();
    }

    createTerrain() {
        const terrainData = this.generateTerrainData(TILES_X, TILES_Y);
        const map = this.make.tilemap({
            data: terrainData,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE,
            width: TILES_X,
            height: TILES_Y
        });
        const tileset = map.addTilesetImage('grassTiles', null, TILE_SIZE, TILE_SIZE, 0, 0);
        const groundLayer = map.createLayer(0, tileset, 0, 0);
        groundLayer.setDepth(-1);
    }

    generateTerrainData(width, height) {
        const terrain = [];
        // Tile 12 is the most common (75% chance)
        // Other tiles share the remaining 25%
        const otherMainLandTiles = [55, 56, 57, 58, 59, 60, 66, 67, 68, 69, 70, 71];
        
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                let tileIndex;
                
                // Corners
                if (x === 0 && y === 0) {
                    // Top left corner
                    tileIndex = 0;
                } else if (x === 0 && y === height - 1) {
                    // Bottom left corner
                    tileIndex = 22;
                } else if (x === width - 1 && y === height - 1) {
                    // Bottom right corner
                    tileIndex = 24;
                } else if (x === width - 1 && y === 0) {
                    // Top right corner
                    tileIndex = 2;
                }
                // Borders
                else if (y === 0) {
                    // Top border
                    tileIndex = 1;
                } else if (y === height - 1) {
                    // Bottom border
                    tileIndex = 23;
                } else if (x === 0) {
                    // Left border
                    tileIndex = 11;
                } else if (x === width - 1) {
                    // Right border
                    tileIndex = 13;
                }
                // Main land (interior)
                else {
                    // 75% chance for tile 12, 25% chance for other tiles
                    if (Math.random() < 0.75) {
                        tileIndex = 12;
                    } else {
                        tileIndex = otherMainLandTiles[Math.floor(Math.random() * otherMainLandTiles.length)];
                    }
                }
                
                row.push(tileIndex);
            }
            terrain.push(row);
        }
        return terrain;
    }

    createTextures() {
        makeCircleTexture(this, 'playerCircle', 18, 0x1fbfbe);
        
        // Create particle textures for pickup effects
        makeCircleTexture(this, 'particle_red', 3, 0xff4d4d);
        makeCircleTexture(this, 'particle_yellow', 3, 0xffe24d);
        makeCircleTexture(this, 'particle_blue', 3, 0xff69b4);
        
        this.createCharacterAnimations();
    }

    createCharacterAnimations() {
        // Walking
        this.anims.create({ key: 'walk-down',  frames: [ { key: 'character', frame: 13 }, { key: 'character', frame: 16 }, { key: 'character', frame: 19 }, { key: 'character', frame: 22 } ], frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'walk-up',    frames: [ { key: 'character', frame: 49 }, { key: 'character', frame: 52 }, { key: 'character', frame: 55 }, { key: 'character', frame: 58 } ], frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'walk-left',  frames: [ { key: 'character', frame: 85 }, { key: 'character', frame: 88 }, { key: 'character', frame: 91 }, { key: 'character', frame: 94 } ], frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'walk-right', frames: [ { key: 'character', frame: 121 }, { key: 'character', frame: 124 }, { key: 'character', frame: 127 }, { key: 'character', frame: 130 } ], frameRate: 8, repeat: -1 });
        // Idle
        this.anims.create({ key: 'idle-down',  frames: [{ key: 'character', frame: 13 }], frameRate: 1 });
        this.anims.create({ key: 'idle-up',    frames: [{ key: 'character', frame: 49 }], frameRate: 1 });
        this.anims.create({ key: 'idle-left',  frames: [{ key: 'character', frame: 85 }], frameRate: 1 });
        this.anims.create({ key: 'idle-right', frames: [{ key: 'character', frame: 121 }], frameRate: 1 });
    }

    createPlayer() {
        this.player = this.physics.add.sprite(MAP_W / 2, MAP_H / 2, 'character', 13);
        this.player.body.setSize(12, 12);
        this.player.body.setOffset(2, 4);
        this.player.setCollideWorldBounds(true);
        this.player.setData('lastDirection', 'down');
        this.player.play('idle-down');
        
        // Set player depth higher than flowers so it renders on top
        this.player.setDepth(10);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
        });
    }

    createFlowers() {
        this.flowers = this.physics.add.staticGroup();
        const rng = this.random || Phaser.Math;
        const padding = TILE_SIZE * 3;

        // Map colors to spritesheet frame indices
        const colorToFrame = {
            red: 6,      // red mushroom
            yellow: 25,  // yellow flower
            blue: 34     // pink flower
        };

        // Generate random ordered sequence of flower types
        this.flowerSequence = [];
        for (let i = 0; i < FLOWER_COUNT; i++) {
            const color = COLORS[rng.Between(0, COLORS.length - 1)];
            this.flowerSequence.push(color);
        }

        // Place flowers on terrain based on the sequence
        for (let i = 0; i < FLOWER_COUNT; i++) {
            const color = this.flowerSequence[i];
            const frameIndex = colorToFrame[color];
            const x = rng.Between(padding, MAP_W - padding);
            const y = rng.Between(padding, MAP_H - padding);
            const f = this.flowers.create(x, y, 'objects', frameIndex);

            // Adjust collision body to be tighter around the flower
            // Make it smaller than the full sprite (16x16)
            f.body.setSize(10, 10);
            f.body.setOffset(3, 3);
            
            // Set depth lower than player so flowers render behind character
            f.setDepth(0);

            this.tweens.add({
                targets: f,
                duration: 600,
                repeat: -1,
                yoyo: true,
                scale: { from: 1.0, to: 1.15 },
                ease: 'Sine.easeInOut'
            });
            f.setData('color', color);
            f.setData('sequenceIndex', i);  // Track position in sequence
        }

        // Initialize current flower index to 0
        this.currentFlowerIndex = 0;

        // Emit event to UIScene to show the first flower to pick
        this.events.emit('updateTargetFlower', this.flowerSequence[0]);
    }

    setupCollision() {
        // Use collider instead of overlap to enable blocking behavior
        // The processCallback determines if collision should occur
        this.physics.add.collider(
            this.player, 
            this.flowers,
            // collideCallback - called when collision occurs
            (playerObj, flowerObj) => {
                // Prevent multiple pickups of the same flower
                if (flowerObj.getData('collected')) return;
                
                const color = flowerObj.getData('color');
                const targetColor = this.flowerSequence[this.currentFlowerIndex];
                
                // Only allow pickup if it matches the current target flower
                if (color !== targetColor) {
                    return;  // Wrong flower type - collision blocks player
                }
                
                flowerObj.setData('collected', true);
                this.picked++;
                
                // Play pickup effect before destroying
                this.playPickupEffect(flowerObj, color);
                
                // Move to next flower in sequence
                this.currentFlowerIndex++;
                
                // Check if game is complete
                if (this.currentFlowerIndex >= FLOWER_COUNT) {
                    this.celebrate();
                } else {
                    // Update UI to show next flower to pick
                    this.events.emit('updateTargetFlower', this.flowerSequence[this.currentFlowerIndex]);
                }
            },
            // processCallback - determines if collision should happen
            (playerObj, flowerObj) => {
                // Don't collide with already collected flowers
                if (flowerObj.getData('collected')) return false;
                
                const color = flowerObj.getData('color');
                const targetColor = this.flowerSequence[this.currentFlowerIndex];
                
                // Always collide (block or allow pickup)
                // If it's the target flower, collision callback will handle pickup
                // If it's not the target flower, collision will block the player
                return true;
            }
        );
    }

    playPickupEffect(flowerObj, color) {
        // Play pickup sound effect
        this.sound.play('pickup', { volume: 0.7 });
        
        // Disable physics body to prevent further collisions
        if (flowerObj.body) {
            flowerObj.body.enable = false;
        }
        
        // Stop the idle bobbing animation
        this.tweens.killTweensOf(flowerObj);
        
        const x = flowerObj.x;
        const y = flowerObj.y;
        
        // Create particle burst effect
        const particleCount = 8;
        const particleKey = 'particle_' + color;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 60 + Math.random() * 40;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const particle = this.add.sprite(x, y, particleKey);
            particle.setScale(1.5);
            
            // Animate particles outward and fade
            this.tweens.add({
                targets: particle,
                x: x + vx,
                y: y + vy,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                ease: 'Cubic.easeOut',
                onComplete: () => particle.destroy()
            });
        }
        
        // Float and fade the flower
        this.tweens.add({
            targets: flowerObj,
            y: flowerObj.y - 40,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => flowerObj.destroy()
        });
    }

    createUI() {
        // UI elements will be handled by UIScene
    }

    update(time, delta) {
        const left = this.cursors.left?.isDown || this.keys.A.isDown;
        const right = this.cursors.right?.isDown || this.keys.D.isDown;
        const up = this.cursors.up?.isDown || this.keys.W.isDown;
        const down = this.cursors.down?.isDown || this.keys.S.isDown;

        let vx = 0, vy = 0;

        if (left) vx -= 1;
        if (right) vx += 1;
        if (up) vy -= 1;
        if (down) vy += 1;

        if (vx !== 0 || vy !== 0) {
            const len = Math.hypot(vx, vy);
            vx = (vx / len) * PLAYER_SPEED;
            vy = (vy / len) * PLAYER_SPEED;
        }
        this.player.setVelocity(vx, vy);

        this.updatePlayerAnimation(vx, vy);
    }

    updatePlayerAnimation(vx, vy) {
        const isMoving = vx !== 0 || vy !== 0;
        if (isMoving) {
            if (Math.abs(vx) > Math.abs(vy)) {
                if (vx > 0) this.player.play('walk-right', true);
                else this.player.play('walk-left', true);
                this.player.setData('lastDirection', vx > 0 ? 'right' : 'left');
            } else {
                if (vy > 0) this.player.play('walk-down', true);
                else this.player.play('walk-up', true);
                this.player.setData('lastDirection', vy > 0 ? 'down' : 'up');
            }
        } else {
            const lastDir = this.player.getData('lastDirection') || 'down';
            this.player.play('idle-' + lastDir, true);
        }
    }

    celebrate() {
        // Emit game complete event to UIScene
        this.events.emit('gameComplete');
    }

    restartGame() {
        // Reset game state
        this.picked = 0;
        this.currentFlowerIndex = 0;
        this.flowerSequence = [];
        
        // Restart the scene
        this.scene.restart();
    }

}
