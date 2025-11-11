// Utility functions for generating textures at runtime

export function makeCircleTexture(scene, key, radius, fill) {
    const g = scene.add.graphics();
    g.fillStyle(fill, 1);
    g.fillCircle(radius, radius, radius);
    g.generateTexture(key, radius * 2, radius * 2);
    g.destroy();
}

export function makeButterflyTexture(scene, key) {
    const g = scene.add.graphics();
    g.fillStyle(0x8a6cff, 1);
    g.fillEllipse(24, 16, 28, 18); // wings
    g.fillEllipse(40, 16, 28, 18);
    g.fillStyle(0x4b2aff, 1);      // body
    g.fillRect(28, 8, 8, 16);
    g.generateTexture(key, 56, 32);
    g.destroy();
}

export function createFlowerTextures(scene) {
    makeCircleTexture(scene, 'flower_red', 14, 0xff4d4d);
    makeCircleTexture(scene, 'flower_yellow', 14, 0xffe24d);
    makeCircleTexture(scene, 'flower_blue', 14, 0x63a7ff);
}
