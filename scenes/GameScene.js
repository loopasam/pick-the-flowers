import { MAP_W, MAP_H, TILE_SIZE, FLOWER_COUNT, COLORS, PLAYER_SPEED, TILES_X, TILES_Y } from '../config.js';
import { makeCircleTexture, makeButterflyTexture } from '../utils/textureGenerator.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        // Game state
        this.player = null;
        this.cursors = null;
        this.keys = null;
        this.pointerTarget = null;
        this.flowers = null;
        this.picked = 0;
        this.collectedByColor = { red: 0, yellow: 0, blue: 0 };
        this.countText = null;
        this.hintText = null;
        this.butterfly = null;
        this.uiContainer = null;
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

        // Keep zoom and UI consistent on window resize
        this.scale.on('resize', (gameSize) => {
            cam.setZoom(ZOOM);
            this.positionUI(gameSize.width, gameSize.height);
        });

        // Initial HUD position
        this.positionUI(this.scale.width, this.scale.height);
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
        const grassTiles = [55, 56, 57, 58, 59, 60];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const rand = Math.random();
                let tileIndex;
                if (rand < 0.7) tileIndex = 55;
                else if (rand < 0.85) tileIndex = 56;
                else if (rand < 0.95) tileIndex = 57;
                else tileIndex = grassTiles[Math.floor(Math.random() * grassTiles.length)];
                row.push(tileIndex);
            }
            terrain.push(row);
        }
        return terrain;
    }

    createTextures() {
        makeCircleTexture(this, 'playerCircle', 18, 0x1fbfbe);
        makeButterflyTexture(this, 'butterfly');
        
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
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
        });

        this.input.on('pointerdown', (p) => {
            const worldPoint = this.cameras.main.getWorldPoint(p.x, p.y);
            this.pointerTarget = new Phaser.Math.Vector2(
                Phaser.Math.Clamp(worldPoint.x, 0, MAP_W),
                Phaser.Math.Clamp(worldPoint.y, 0, MAP_H)
            );
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

        for (let i = 0; i < FLOWER_COUNT; i++) {
            const color = COLORS[rng.Between(0, COLORS.length - 1)];
            const frameIndex = colorToFrame[color];
            const x = rng.Between(padding, MAP_W - padding);
            const y = rng.Between(padding, MAP_H - padding);
            const f = this.flowers.create(x, y, 'objects', frameIndex);

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
            // Prevent multiple pickups of the same flower
            if (flowerObj.getData('collected')) return;
            flowerObj.setData('collected', true);
            
            const color = flowerObj.getData('color');
            this.collectedByColor[color] = (this.collectedByColor[color] || 0) + 1;
            this.picked++;
            
            // Award points based on flower color and emit event to UIScene
            const points = { red: 10, yellow: 15, blue: 20 };
            this.events.emit('addScore', points[color] || 10);
            
            // Play pickup effect before destroying
            this.playPickupEffect(flowerObj, color);
            
            this.updateCounterText();
            
            if (this.picked >= FLOWER_COUNT) this.celebrate();
        });
    }

    playPickupEffect(flowerObj, color) {
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
        // Flower counter (top-left)
        this.countText = this.add.text(16, 16, '', {
            fontFamily: 'system-ui, Arial, sans-serif',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(1000);

        this.hintText = this.add.text(16, 56, 'Pick all the flowers!', {
            fontFamily: 'system-ui, Arial, sans-serif',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(1000);

        this.butterfly = this.add.sprite(MAP_W / 2, MAP_H / 2, 'butterfly');
        this.butterfly.visible = false;

        this.updateCounterText();
    }

    positionUI(viewW, viewH) {
        this.countText.setPosition(16, 16);
        this.hintText.setPosition(16, 56);
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

        if (vx === 0 && vy === 0 && this.pointerTarget) {
            const dir = new Phaser.Math.Vector2(
                this.pointerTarget.x - this.player.x,
                this.pointerTarget.y - this.player.y
            );
            const dist = dir.length();
            if (dist < 6) {
                this.player.setVelocity(0, 0);
                this.pointerTarget = null;
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

    updateCounterText() {
        this.countText.setText(`Flowers: ${this.picked} / ${FLOWER_COUNT}`);
    }

    celebrate() {
        this.butterfly.visible = true;
        this.butterfly.x = MAP_W / 2;
        this.butterfly.y = MAP_H - 120;
        this.butterfly.angle = 0;

        this.tweens.add({ targets: this.butterfly, y: 120, duration: 2000, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: this.butterfly, angle: 12, duration: 600, ease: 'Sine.easeInOut', delay: 2000 });
        this.tweens.add({ targets: this.butterfly, angle: -12, duration: 600, ease: 'Sine.easeInOut', delay: 2600 });
        this.tweens.add({ targets: this.butterfly, angle: 0, duration: 400, ease: 'Sine.easeInOut', delay: 3200 });
    }

}
