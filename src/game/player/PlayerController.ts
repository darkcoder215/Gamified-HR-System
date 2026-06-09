import Phaser from 'phaser';
import { PLAYER_SPEED, PLAYER_SPRITE_CONFIG } from '../gameConfig';

type Dir = 'down' | 'up' | 'left' | 'right';

export default class PlayerController {
  sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private source: 'sheet' | 'fallback';
  private facing: Dir = 'down';
  private moveVec = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene, x: number, y: number, source: 'sheet' | 'fallback') {
    this.scene = scene;
    this.source = source;
    const initialTexture = source === 'sheet' ? 'player-sheet' : 'pc-down-0';
    this.sprite = scene.physics.add.sprite(x, y, initialTexture, source === 'sheet' ? 0 : undefined);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body!.setSize(18, 16).setOffset(7, 30);
    this.sprite.setDepth(10);
    this.createAnims();
    this.idle();
  }

  private createAnims() {
    const a = this.scene.anims;
    const dirs: Dir[] = PLAYER_SPRITE_CONFIG.rows as unknown as Dir[];
    if (this.source === 'sheet') {
      dirs.forEach((dir, row) => {
        const start = row * PLAYER_SPRITE_CONFIG.framesPerRow;
        if (a.exists(`walk-${dir}`)) return;
        a.create({
          key: `walk-${dir}`,
          frames: a.generateFrameNumbers('player-sheet', {
            start,
            end: start + PLAYER_SPRITE_CONFIG.framesPerRow - 1,
          }),
          frameRate: 8,
          repeat: -1,
        });
      });
    } else {
      (['down', 'up', 'left', 'right'] as Dir[]).forEach((dir) => {
        if (a.exists(`walk-${dir}`)) return;
        a.create({
          key: `walk-${dir}`,
          frames: [{ key: `pc-${dir}-0` }, { key: `pc-${dir}-1` }],
          frameRate: 6,
          repeat: -1,
        });
      });
    }
  }

  setMove(dx: number, dy: number) {
    this.moveVec.set(dx, dy);
  }

  private idle() {
    if (this.source === 'sheet') {
      const row = (PLAYER_SPRITE_CONFIG.rows as readonly string[]).indexOf(this.facing);
      this.sprite.anims.stop();
      this.sprite.setFrame(row * PLAYER_SPRITE_CONFIG.framesPerRow);
    } else {
      this.sprite.anims.stop();
      this.sprite.setTexture(`pc-${this.facing}-0`);
    }
  }

  update() {
    const v = this.moveVec;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (v.lengthSq() > 0.01) {
      const norm = v.clone().normalize().scale(PLAYER_SPEED);
      body.setVelocity(norm.x, norm.y);
      // choose facing by dominant axis
      if (Math.abs(v.x) > Math.abs(v.y)) {
        this.facing = v.x > 0 ? 'right' : 'left';
      } else {
        this.facing = v.y > 0 ? 'down' : 'up';
      }
      const key = `walk-${this.facing}`;
      if (this.sprite.anims.currentAnim?.key !== key) this.sprite.anims.play(key, true);
    } else {
      body.setVelocity(0, 0);
      this.idle();
    }
  }

  stop() {
    (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.idle();
  }
}
