import Phaser from 'phaser';
import { PLAYER_SPEED, PLAYER, PLAYER_ANIMS } from '../gameConfig';

type Dir = 'down' | 'up' | 'left' | 'right';

export default class PlayerController {
  sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private facing: Dir = 'down';
  private moveVec = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, PLAYER.key, PLAYER_ANIMS.down.idle);
    this.sprite.setScale(1.4);
    this.sprite.setCollideWorldBounds(true);
    // collide on the feet only
    this.sprite.body!.setSize(16, 14).setOffset(7, 28);
    this.sprite.setDepth(10);
    this.createAnims();
    this.idle();
  }

  private createAnims() {
    const a = this.scene.anims;
    (Object.keys(PLAYER_ANIMS) as Dir[]).forEach((dir) => {
      const key = `walk-${dir}`;
      if (a.exists(key)) return;
      a.create({
        key,
        frames: a.generateFrameNames(PLAYER.key, {
          prefix: PLAYER_ANIMS[dir].walkPrefix,
          start: 0,
          end: 3,
          zeroPad: 3,
        }),
        frameRate: 10,
        repeat: -1,
      });
    });
  }

  setMove(dx: number, dy: number) {
    this.moveVec.set(dx, dy);
  }

  private idle() {
    this.sprite.anims.stop();
    this.sprite.setTexture(PLAYER.key, PLAYER_ANIMS[this.facing].idle);
  }

  update() {
    const v = this.moveVec;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (v.lengthSq() > 0.01) {
      const norm = v.clone().normalize().scale(PLAYER_SPEED);
      body.setVelocity(norm.x, norm.y);
      if (Math.abs(v.x) > Math.abs(v.y)) this.facing = v.x > 0 ? 'right' : 'left';
      else this.facing = v.y > 0 ? 'down' : 'up';
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
