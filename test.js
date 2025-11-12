const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#87ceeb',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: {
        preload,
        create,
        update
    },
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

let player;
let cursors;
let score = 0;
let scoreText;

const game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
}

function create() {
    // Create a large world to move around in
    this.add.rectangle(400, 300, 1600, 1200, 0x228b22);

    // Add player sprite in the middle
    player = this.physics.add.sprite(400, 300, 'player');
    player.setCollideWorldBounds(true);

    // Setup camera
    this.cameras.main.startFollow(player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.setRoundPixels(true);

    // Create HUD text (fixed to screen)
    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    });

    // This makes it stay fixed on screen even when the camera moves or zooms
    scoreText.setScrollFactor(0);

    // Input keys
    cursors = this.input.keyboard.createCursorKeys();

    // Simulate scoring every 2 seconds
    this.time.addEvent({
        delay: 2000,
        loop: true,
        callback: () => {
            score += 10;
            scoreText.setText('Score: ' + score);
        }
    });
}

function update() {
    const speed = 200;
    player.setVelocity(0);

    if (cursors.left.isDown) player.setVelocityX(-speed);
    else if (cursors.right.isDown) player.setVelocityX(speed);

    if (cursors.up.isDown) player.setVelocityY(-speed);
    else if (cursors.down.isDown) player.setVelocityY(speed);
}
