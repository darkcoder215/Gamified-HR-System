import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { WORLD_WIDTH, WORLD_HEIGHT, SPAWN, TILEMAP } from '../gameConfig';
import { stations, type StationDef } from '../stations/stationZones';
import PlayerController from '../player/PlayerController';

export default class WorldScene extends Phaser.Scene {
  private player!: PlayerController;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private paused = false;
  private mobileVec = new Phaser.Math.Vector2(0, 0);
  private nearStation: StationDef | null = null;
  private interactBuffered = false;
  private movedEmitted = false;
  private posTick = 0;
  private progressText = new Map<string, Phaser.GameObjects.Text>();
  private rings = new Map<string, Phaser.GameObjects.Arc>();

  constructor() {
    super('World');
  }

  create() {
    const map = this.make.tilemap({ key: TILEMAP.key });
    const tileset = map.addTilesetImage(TILEMAP.tilesetName, TILEMAP.tilesetKey, 32, 32, 1, 2)!;

    map.createLayer(TILEMAP.layers.below, tileset, 0, 0)!.setDepth(0);
    const worldLayer = map.createLayer(TILEMAP.layers.world, tileset, 0, 0)!;
    worldLayer.setDepth(5);
    worldLayer.setCollisionByProperty({ collides: true });
    const aboveLayer = map.createLayer(TILEMAP.layers.above, tileset, 0, 0)!;
    aboveLayer.setDepth(20);

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // ── station markers ──
    for (const st of stations) this.createMarker(st);

    // ── player ──
    this.player = new PlayerController(this, SPAWN.x, SPAWN.y);
    this.physics.add.collider(this.player.sprite, worldLayer);

    // ── camera ──
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.7);
    this.cameras.main.roundPixels = true;

    // ── input ──
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.keys.E.on('down', this.tryInteract);
    this.keys.SPACE.on('down', this.tryInteract);

    this.bindEvents();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unbindEvents());
    // request initial progress values from React + seed minimap position
    EventBus.emit('progress:request');
    EventBus.emit('player:pos', { x: SPAWN.x, y: SPAWN.y });
  }

  private createMarker(st: StationDef) {
    const color = Phaser.Display.Color.HexStringToColor(st.color).color;

    // glow halo behind the marker
    const halo = this.add.circle(st.x, st.signY, 26, color, 0.16).setDepth(24);
    this.tweens.add({ targets: halo, scale: 1.2, alpha: 0.28, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // inviting pulse ring
    const ring = this.add.circle(st.x, st.signY, 22, color, 0);
    ring.setStrokeStyle(3, color, 0.7).setDepth(24);
    this.tweens.add({ targets: ring, scale: 1.9, alpha: 0, duration: 1700, repeat: -1, ease: 'Sine.out' });
    this.rings.set(st.id, ring);

    // signboard pin
    const pin = this.add.container(st.x, st.signY).setDepth(25);
    const plate = this.add.graphics();
    plate.fillStyle(0xffffff, 1).fillRoundedRect(-22, -22, 44, 44, 12);
    plate.lineStyle(3, color, 1).strokeRoundedRect(-22, -22, 44, 44, 12);
    const icon = this.add.text(0, 0, st.glyph, { fontSize: '24px' }).setOrigin(0.5);
    pin.add([plate, icon]);
    this.tweens.add({ targets: pin, y: st.signY - 8, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // progress badge under the pin
    const badge = this.add.text(st.x, st.signY + 30, '…', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#111421',
      padding: { x: 6, y: 2 },
    })
      .setOrigin(0.5)
      .setDepth(25);
    this.progressText.set(st.id, badge);
  }

  private onProgress = (data: Record<string, string>) => {
    for (const [id, txt] of Object.entries(data)) {
      this.progressText.get(id)?.setText(txt);
    }
  };

  private bindEvents() {
    EventBus.on('game:pause', this.onPause, this);
    EventBus.on('game:resume', this.onResume, this);
    EventBus.on('input:move', this.onMobileMove, this);
    EventBus.on('input:release', this.onMobileRelease, this);
    EventBus.on('input:interact', this.tryInteract, this);
    EventBus.on('progress:update', this.onProgress, this);
    EventBus.on('player:tint', this.onTint, this);
  }

  private unbindEvents() {
    EventBus.off('game:pause', this.onPause, this);
    EventBus.off('game:resume', this.onResume, this);
    EventBus.off('input:move', this.onMobileMove, this);
    EventBus.off('input:release', this.onMobileRelease, this);
    EventBus.off('input:interact', this.tryInteract, this);
    EventBus.off('progress:update', this.onProgress, this);
    EventBus.off('player:tint', this.onTint, this);
  }

  private onTint = (hex: string | null) => {
    if (!this.player) return;
    if (hex) this.player.sprite.setTint(Phaser.Display.Color.HexStringToColor(hex).color);
    else this.player.sprite.clearTint();
  };

  private onPause = () => {
    this.paused = true;
    this.mobileVec.set(0, 0);
    this.player.stop();
  };
  private onResume = () => {
    this.paused = false;
  };
  private onMobileMove = (v: { dx: number; dy: number }) => this.mobileVec.set(v.dx, v.dy);
  private onMobileRelease = () => this.mobileVec.set(0, 0);

  private tryInteract = () => {
    if (this.paused) return;
    if (this.nearStation) EventBus.emit('station:enter', { stationId: this.nearStation.id });
    else this.interactBuffered = true;
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

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    // onboarding: first movement
    if (!this.movedEmitted && (dx !== 0 || dy !== 0)) {
      this.movedEmitted = true;
      EventBus.emit('player:moved');
    }
    // minimap position (throttled)
    if (++this.posTick % 6 === 0) {
      EventBus.emit('player:pos', { x: px, y: py });
    }
    let near: StationDef | null = null;
    let best = 80 * 80;
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
