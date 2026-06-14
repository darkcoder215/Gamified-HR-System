import Phaser from 'phaser';
import { PLAYER, TILEMAP } from '../gameConfig';
import { pets } from '../../data/pets';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Loading bar (brand green) over the off-white background.
    const { width, height } = this.scale;
    const barW = Math.min(360, width * 0.6);
    const x = width / 2 - barW / 2;
    const y = height / 2;
    const box = this.add.graphics();
    box.fillStyle(0xffffff, 1).fillRoundedRect(x - 4, y - 12, barW + 8, 24, 12);
    const bar = this.add.graphics();
    this.load.on('progress', (p: number) => {
      bar.clear().fillStyle(0x00c17a, 1).fillRoundedRect(x, y - 8, barW * p, 16, 8);
    });

    this.load.image(TILEMAP.tilesetKey, TILEMAP.tilesetPath);
    this.load.tilemapTiledJSON(TILEMAP.key, TILEMAP.path);
    this.load.atlas(PLAYER.key, PLAYER.texturePath, PLAYER.atlasPath);
    // companion pet sprite sheets (4-frame flap/gallop, 40x40)
    for (const p of pets) this.load.spritesheet(`pet-${p.id}`, `/game/pets/${p.id}.png`, { frameWidth: 40, frameHeight: 40 });
  }

  create() {
    this.scene.start('World');
  }
}
