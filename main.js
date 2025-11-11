// ---- Game config ----
const GAME_W = 1024, GAME_H = 600;
const FLOWER_COUNT = 2;
const COLORS = ['red', 'yellow', 'blue'];

const config = {
    type: Phaser.AUTO,
    width: GAME_W,
    height: GAME_H,
    // backgroundColor: 0xcfeecf, // soft green - replaced with tiled background
    parent: 'game',
    physics: { default: 'arcade', arcade: { debug: true } },
    scene: { preload, create, update }
};

let player, cursors, pointerTarget = null, speed = 200;
let flowers, picked = 0, countText, hintText, butterfly, restartBtn;
let collectedByColor = { red: 0, yellow: 0, blue: 0 };

new Phaser.Game(config);

// ---- Helper: make simple circle/shape textures at runtime ----
function makeCircleTexture(scene, key, radius, fill) {
    const g = scene.add.graphics();
    g.fillStyle(fill, 1);
    g.fillCircle(radius, radius, radius);
    g.generateTexture(key, radius * 2, radius * 2);
    g.destroy();
}

function makeButterflyTexture(scene, key) {
    const g = scene.add.graphics();
    g.fillStyle(0x8a6cff, 1);
    g.fillEllipse(24, 16, 28, 18); // wings
    g.fillEllipse(40, 16, 28, 18);
    g.fillStyle(0x4b2aff, 1);      // body
    g.fillRect(28, 8, 8, 16);
    g.generateTexture(key, 56, 32);
    g.destroy();
}

function preload() { 
    // Load grass tileset as spritesheet (16x16 pixel tiles with 1px borders)
    this.load.spritesheet('grassTileset', 'art/Sprout Lands - Sprites - Basic pack/Tilesets/Grass.png', {
        frameWidth: 16,
        frameHeight: 16,
    });
}

function create() {
    // Extract a specific tile from the spritesheet and create a canvas texture
    // Second from top (row 1), second from left (col 1) = frame 9 (assuming 8 columns)
    const TILE_FRAME = 60; // Second row, second column
    const TILE_SIZE = 16;
    
    // Get the source texture and frame
    const texture = this.textures.get('grassTileset');
    const frame = texture.get(TILE_FRAME);
    
    // Create a canvas to draw the single tile
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    
    // Draw the specific tile from the spritesheet to the canvas
    ctx.drawImage(
        frame.source.image,
        frame.cutX, frame.cutY, TILE_SIZE, TILE_SIZE,
        0, 0, TILE_SIZE, TILE_SIZE
    );
    
    // Create a texture from the canvas
    this.textures.addCanvas('singleGrassTile', canvas);
    
    // Add tiled grass background using the single extracted tile
    this.add.tileSprite(0, 0, GAME_W, GAME_H, 'singleGrassTile')
        .setOrigin(0, 0)
        .setDepth(-1);

    // Create placeholder textures
    makeCircleTexture(this, 'playerCircle', 18, 0x1fbfbe);  // teal
    makeCircleTexture(this, 'flower_red', 14, 0xff4d4d);
    makeCircleTexture(this, 'flower_yellow', 14, 0xffe24d);
    makeCircleTexture(this, 'flower_blue', 14, 0x63a7ff);
    makeButterflyTexture(this, 'butterfly');

    // Player
    player = this.physics.add.sprite(GAME_W / 2, GAME_H / 2, 'playerCircle');
    player.body.setCircle(18, 0, 0);
    player.setCollideWorldBounds(true);

    // Input
    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addKeys('W,A,S,D'); // optional
    this.input.on('pointerdown', (p) => { pointerTarget = new Phaser.Math.Vector2(p.x, p.y); });
    this.input.on('pointerup', () => { /* keep moving to target until close */ });

    // Flowers group (static bodies)
    flowers = this.physics.add.staticGroup();

    // Place flowers randomly
    const rng = this.random || Phaser.Math;
    for (let i = 0; i < FLOWER_COUNT; i++) {
        const color = COLORS[rng.Between(0, COLORS.length - 1)];
        const txKey = 'flower_' + color;
        const x = rng.Between(64, GAME_W - 64);
        const y = rng.Between(64, GAME_H - 64);
        const f = flowers.create(x, y, txKey);
        // Gentle idle pulse via tween
        this.tweens.add({
            targets: f, duration: 600, repeat: -1, yoyo: true,
            scale: { from: 1.0, to: 1.15 }, ease: 'Sine.easeInOut'
        });
        f.setData('color', color);
    }

    // Overlap: player picks flower
    this.physics.add.overlap(player, flowers, (playerObj, flowerObj) => {
        const color = flowerObj.getData('color');
        collectedByColor[color] = (collectedByColor[color] || 0) + 1;
        picked++;
        flowerObj.destroy(); // remove the flower
        updateCounterText();
        if (picked >= FLOWER_COUNT) celebrate.call(this);
    });

    // UI text
    countText = this.add.text(24, 16, '', {
        fontFamily: 'system-ui, Arial, sans-serif', fontSize: '48px', color: '#203020'
    });
    hintText = this.add.text(24, 76, 'Pick all the flowers!', {
        fontFamily: 'system-ui, Arial, sans-serif', fontSize: '28px', color: '#304030'
    });

    // Butterfly (hidden until win)
    butterfly = this.add.sprite(GAME_W / 2, GAME_H / 2, 'butterfly');
    butterfly.visible = false;

    // Restart button (DOM)
    restartBtn = document.getElementById('restart');
    restartBtn.onclick = () => resetGame.call(this);

    // Initial counter
    picked = 0;
    collectedByColor = { red: 0, yellow: 0, blue: 0 };
    updateCounterText();
}

function update(time, delta) {
    // Keyboard movement (arrows/WASD)
    const left = cursors.left?.isDown || this.input.keyboard.addKey('A').isDown;
    const right = cursors.right?.isDown || this.input.keyboard.addKey('D').isDown;
    const up = cursors.up?.isDown || this.input.keyboard.addKey('W').isDown;
    const down = cursors.down?.isDown || this.input.keyboard.addKey('S').isDown;

    let vx = 0, vy = 0;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    // Tap-to-move if no keys pressed
    if (vx === 0 && vy === 0 && pointerTarget) {
        const dir = new Phaser.Math.Vector2(pointerTarget.x - player.x, pointerTarget.y - player.y);
        const dist = dir.length();
        if (dist < 6) {
            player.setVelocity(0, 0);
            pointerTarget = null; // reached
        } else {
            dir.normalize();
            player.setVelocity(dir.x * speed, dir.y * speed);
        }
    } else {
        if (vx !== 0 || vy !== 0) {
            const len = Math.hypot(vx, vy);
            vx = (vx / len) * speed;
            vy = (vy / len) * speed;
        }
        player.setVelocity(vx, vy);
    }
}

function updateCounterText() {
    countText.setText(`Flowers: ${picked} / ${FLOWER_COUNT}`);
}

function celebrate() {
    // Butterfly float + show restart button after a short delay
    butterfly.visible = true;
    butterfly.x = GAME_W / 2; butterfly.y = GAME_H - 120; butterfly.angle = 0;
    
    // Create chained tweens for Phaser 3
    const tween1 = this.tweens.add({
        targets: butterfly,
        y: 120,
        duration: 2000,
        ease: 'Sine.easeInOut'
    });
    
    const tween2 = this.tweens.add({
        targets: butterfly,
        angle: 12,
        duration: 600,
        ease: 'Sine.easeInOut',
        delay: 2000
    });
    
    const tween3 = this.tweens.add({
        targets: butterfly,
        angle: -12,
        duration: 600,
        ease: 'Sine.easeInOut',
        delay: 2600
    });
    
    const tween4 = this.tweens.add({
        targets: butterfly,
        angle: 0,
        duration: 400,
        ease: 'Sine.easeInOut',
        delay: 3200
    });
    
    // Show button after a beat
    this.time.delayedCall(800, () => {
        restartBtn.style.display = 'inline-block';
    });
}

function resetGame() {
    // Clear flowers
    flowers.clear(true, true);
    picked = 0;
    collectedByColor = { red: 0, yellow: 0, blue: 0 };
    updateCounterText();
    hintText.setText('Pick all the flowers!');
    butterfly.visible = false;
    restartBtn.style.display = 'none';

    // Recreate flowers
    const rng = this.random || Phaser.Math;
    for (let i = 0; i < FLOWER_COUNT; i++) {
        const color = COLORS[rng.Between(0, COLORS.length - 1)];
        const txKey = 'flower_' + color;
        const x = rng.Between(64, GAME_W - 64);
        const y = rng.Between(64, GAME_H - 64);
        const f = flowers.create(x, y, txKey);
        this.tweens.add({
            targets: f, duration: 600, repeat: -1, yoyo: true,
            scale: { from: 1.0, to: 1.15 }, ease: 'Sine.easeInOut'
        });
        f.setData('color', color);
    }
    // Keep player inside screen & stop movement
    player.setPosition(GAME_W / 2, GAME_H / 2);
    player.setVelocity(0, 0);
    pointerTarget = null;
}
