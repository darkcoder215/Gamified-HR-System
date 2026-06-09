import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../gameConfig';
import { stations, type StationDef } from '../stations/stationZones';
import PlayerController from '../player/PlayerController';
import {
  generateGroundTextures,
  generateTreeTexture,
  generateRockTexture,
  generateStationTexture,
  generatePlayerTextures,
} from './assetFallback';

export default class WorldScene extends Phaser.Scene {
  private player!: PlayerController;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private paused = false;
  private mobileVec = new Phaser.Math.Vector2(0, 0);
  private nearStation: StationDef | null = null;
  private interactBuffered = false;

  constructor() {
    super('World');
  }

  create(data: { playerLoaded: boolean }) {
    const source: 'sheet' | 'fallback' = data?.playerLoaded ? 'sheet' : 'fallback';

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // ── textures ──
    generateGroundTextures(this);
    generateTreeTexture(this);
    generateRockTexture(this);
    if (source === 'fallback') generatePlayerTextures(this);

    // ── ground ──
    this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'tile-grass').setOrigin(0).setDepth(0);
    // cross paths connecting the four stations through the centre plaza
    const cx = WORLD_WIDTH / 2;
    const cy = WORLD_HEIGHT / 2;
    this.add.tileSprite(0, cy - 40, WORLD_WIDTH, 80, 'tile-path').setOrigin(0, 0).setDepth(1);
    this.add.tileSprite(cx - 40, 0, 80, WORLD_HEIGHT, 'tile-path').setOrigin(0, 0).setDepth(1);
    // central plaza disc
    const plaza = this.add.graphics().setDepth(1);
    plaza.fillStyle(0xf4f2ed, 1);
    plaza.fillCircle(cx, cy, 90);
    plaza.lineStyle(4, 0x00c17a, 0.5);
    plaza.strokeCircle(cx, cy, 90);

    this.obstacles = this.physics.add.staticGroup();

    // border tree line + scattered greenery (decoration + collision)
    this.scatterTrees();

    // ── stations ──
    for (const st of stations) {
      const key = generateStationTexture(this, st.id, st.color);
      const img = this.add.image(st.x, st.y, key).setOrigin(0.5, 0.7).setDepth(5);
      // gentle bob
      this.tweens.add({ targets: img, y: st.y - 6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      // glyph marker floating above
      const glyph = this.add
        .text(st.x, st.y - 78, st.glyph, { fontSize: '28px' })
        .setOrigin(0.5)
        .setDepth(6);
      this.tweens.add({ targets: glyph, y: st.y - 86, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      // pulsing ring to invite interaction
      const ring = this.add.circle(st.x, st.y + 6, 40, Phaser.Display.Color.HexStringToColor(st.color).color, 0.0);
      ring.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(st.color).color, 0.6).setDepth(4);
      this.tweens.add({ targets: ring, scale: 1.5, alpha: 0, duration: 1800, repeat: -1, ease: 'Sine.out' });
      // collider at building base (invisible)
      const base = this.add.rectangle(st.x, st.y + 4, 56, 30).setVisible(false);
      this.physics.add.existing(base, true);
      this.obstacles.add(base);
    }

    // ── player ──
    this.player = new PlayerController(this, cx, cy + 130, source);
    this.physics.add.collider(this.player.sprite, this.obstacles);

    // ── camera ──
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.15);
    this.cameras.main.roundPixels = true;

    // ── input ──
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.keys.E.on('down', () => this.tryInteract());
    this.keys.SPACE.on('down', () => this.tryInteract());

    // ── bridge ──
    this.bindEvents();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unbindEvents());
  }

  private scatterTrees() {
    const positions: Array<[number, number, 'tree' | 'rock']> = [];
    // border of trees
    for (let x = 24; x < WORLD_WIDTH; x += 96) {
      positions.push([x, 22, 'tree']);
      positions.push([x, WORLD_HEIGHT - 18, 'tree']);
    }
    for (let y = 90; y < WORLD_HEIGHT - 40; y += 110) {
      positions.push([22, y, 'tree']);
      positions.push([WORLD_WIDTH - 22, y, 'tree']);
    }
    // a few scattered rocks/trees inside (avoid centre + paths)
    const extra: Array<[number, number, 'tree' | 'rock']> = [
      [520, 360, 'rock'],
      [760, 360, 'rock'],
      [520, 600, 'tree'],
      [760, 600, 'tree'],
      [180, 480, 'rock'],
      [1100, 480, 'rock'],
    ];
    for (const [x, y, kind] of [...positions, ...extra]) {
      this.add.image(x, y, kind).setDepth(y < WORLD_HEIGHT / 2 ? 3 : 7);
      const body = this.add.rectangle(x, y + (kind === 'tree' ? 18 : 4), 18, 12).setVisible(false);
      this.physics.add.existing(body, true);
      this.obstacles.add(body);
    }
  }

  private bindEvents() {
    EventBus.on('game:pause', this.onPause, this);
    EventBus.on('game:resume', this.onResume, this);
    EventBus.on('input:move', this.onMobileMove, this);
    EventBus.on('input:release', this.onMobileRelease, this);
    EventBus.on('input:interact', this.tryInteract, this);
  }

  private unbindEvents() {
    EventBus.off('game:pause', this.onPause, this);
    EventBus.off('game:resume', this.onResume, this);
    EventBus.off('input:move', this.onMobileMove, this);
    EventBus.off('input:release', this.onMobileRelease, this);
    EventBus.off('input:interact', this.tryInteract, this);
  }

  private onPause = () => {
    this.paused = true;
    this.mobileVec.set(0, 0);
    this.player.stop();
  };
  private onResume = () => {
    this.paused = false;
  };
  private onMobileMove = (v: { dx: number; dy: number }) => {
    this.mobileVec.set(v.dx, v.dy);
  };
  private onMobileRelease = () => {
    this.mobileVec.set(0, 0);
  };

  private tryInteract = () => {
    if (this.paused) return;
    if (this.nearStation) {
      EventBus.emit('station:enter', { stationId: this.nearStation.id });
    } else {
      this.interactBuffered = true;
    }
  };

  update() {
    if (this.paused) return;

    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;
    if (this.mobileVec.lengthSq() > 0.01) {
      dx = this.mobileVec.x;
      dy = this.mobileVec.y;
    }
    this.player.setMove(dx, dy);
    this.player.update();

    // nearest station detection
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    let near: StationDef | null = null;
    let best = 96 * 96;
    for (const st of stations) {
      const d = (st.x - px) ** 2 + (st.y - py) ** 2;
      if (d < best) {
        best = d;
        near = st;
      }
    }
    if (near?.id !== this.nearStation?.id) {
      this.nearStation = near;
      EventBus.emit('station:near', { stationId: near?.id ?? null });
    }
    if (this.interactBuffered && this.nearStation) {
      this.interactBuffered = false;
      EventBus.emit('station:enter', { stationId: this.nearStation.id });
    }
  }
}
