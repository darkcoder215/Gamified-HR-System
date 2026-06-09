import Phaser from 'phaser';
import { PLAYER_SPRITE_CONFIG } from '../gameConfig';

// Attempts to load real player art; falls back to generated sprites if absent.
export default class BootScene extends Phaser.Scene {
  private playerLoaded = false;

  constructor() {
    super('Boot');
  }

  preload() {
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.key === 'player-sheet') this.playerLoaded = false;
    });

    // Try the swappable player spritesheet. If it isn't present, we generate one.
    this.load.spritesheet('player-sheet', PLAYER_SPRITE_CONFIG.path, {
      frameWidth: PLAYER_SPRITE_CONFIG.frameWidth,
      frameHeight: PLAYER_SPRITE_CONFIG.frameHeight,
    });
    this.load.on('filecomplete-spritesheet-player-sheet', () => {
      this.playerLoaded = true;
    });
  }

  create() {
    this.scene.start('World', { playerLoaded: this.playerLoaded });
  }
}
