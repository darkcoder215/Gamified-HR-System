import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { stations } from '../stations/stationZones';
import type { StationId } from '@/types';
import PlayerController from '../player/PlayerController';
import { useGameStore } from '@/state/store';
import { sfx } from '@/audio/sound';

const ROOM_W = 760;
const ROOM_H = 560;

// Per-building interior theming. Every room is a furnished open-plan office
// (desks + seated workers, a meeting table, a lounge) tinted to the building's
// brand, with a glowing activity podium that opens the matching panel.
const THEMES: Record<
  StationId,
  { floor: number; floor2: number; wall: number; wallTrim: number; accent: string; glyph: string; art: string; deskItem: string }
> = {
  arena: { floor: 0x6a513a, floor2: 0x5f4733, wall: 0x2b2d3f, wallTrim: 0x3a3d52, accent: '#00c17a', glyph: '⚔️', art: '🎯', deskItem: '🛡️' },
  quests: { floor: 0x6f5c42, floor2: 0x65543b, wall: 0x1f3a5f, wallTrim: 0x2c4f7d, accent: '#0072f9', glyph: '📋', art: '🗺️', deskItem: '🗂️' },
  career: { floor: 0x7a6a52, floor2: 0x6f6049, wall: 0x3a2e10, wallTrim: 0x554121, accent: '#ffbc0a', glyph: '🏙️', art: '📈', deskItem: '🏆' },
  leaderboard: { floor: 0x6b4a3a, floor2: 0x614234, wall: 0x3a0e22, wallTrim: 0x551534, accent: '#82003a', glyph: '🏆', art: '🥇', deskItem: '🎖️' },
  org: { floor: 0x5a5a66, floor2: 0x52525e, wall: 0x1c2230, wallTrim: 0x2c3344, accent: '#84dbe5', glyph: '🏢', art: '📊', deskItem: '🖥️' },
};
const CHEST_COINS = 25;
const GEM_COINS = 50;

const SKINS = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
const SHIRTS = [0x00c17a, 0x0072f9, 0xffbc0a, 0x82003a, 0x84dbe5, 0xff5da2, 0x6b5cff];
const HAIRS = [0x2b2118, 0x4a3526, 0x1c1c22, 0x6e4a2b, 0x8a8f99];

export default class InteriorScene extends Phaser.Scene {
  private player!: PlayerController;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private paused = false;
  private mobileVec = new Phaser.Math.Vector2(0, 0);
  private stationId!: StationId;
  private activity!: { x: number; y: number };
  private exit!: { x: number; y: number };
  private chests: { x: number; y: number; key: string; obj: Phaser.GameObjects.Container; open: boolean; reward: number; kind: 'chest' | 'gem' }[] = [];
  private focus: 'activity' | 'exit' | null = null;
  private interactBuffered = false;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private pplIdx = 0;

  constructor() {
    super('Interior');
  }

  create(data: { stationId: StationId }) {
    this.stationId = data.stationId;
    this.chests = [];
    this.focus = null;
    this.paused = false;
    this.pplIdx = 0;
    this.mobileVec.set(0, 0);
    const theme = THEMES[this.stationId];
    const st = stations.find((s) => s.id === this.stationId)!;
    const accent = Phaser.Display.Color.HexStringToColor(theme.accent).color;

    this.physics.world.setBounds(0, 0, ROOM_W, ROOM_H);
    this.solids = this.physics.add.staticGroup();

    // ---- floor (checker) + back wall ----
    const g = this.add.graphics().setDepth(0);
    for (let y = 56; y < ROOM_H; y += 40) {
      for (let x = 0; x < ROOM_W; x += 40) {
        g.fillStyle((x / 40 + y / 40) % 2 === 0 ? theme.floor : theme.floor2, 1);
        g.fillRect(x, y, 40, 40);
      }
    }
    g.fillStyle(theme.wall, 1).fillRect(0, 0, ROOM_W, 56);
    g.fillStyle(theme.wallTrim, 1).fillRect(0, 48, ROOM_W, 8);
    g.fillStyle(accent, 0.3).fillRect(0, 56, ROOM_W, 4);

    // ---- collision walls (invisible) ----
    this.addSolid(ROOM_W / 2, 30, ROOM_W, 60);
    this.addSolid(ROOM_W / 2, ROOM_H - 4, ROOM_W, 8);
    this.addSolid(4, ROOM_H / 2, 8, ROOM_H);
    this.addSolid(ROOM_W - 4, ROOM_H / 2, 8, ROOM_H);

    // ---- back-wall dressing: framed art, windows, clock, themed plaques ----
    this.drawFramedArt(ROOM_W / 2, 26, theme.art, accent);
    this.drawWindow(190, 26, accent);
    this.drawWindow(570, 26, accent);
    this.drawClock(686, 26);
    this.add.text(76, 26, theme.deskItem, { fontSize: '20px' }).setOrigin(0.5).setDepth(2);

    // ---- section rugs (define zones) ----
    this.addRug(178, 330, 200, 300, accent);
    this.addRug(582, 330, 200, 300, accent);
    this.addRug(ROOM_W / 2, 372, 220, 150, accent, true);

    // ---- workspace desks with seated workers (2 left, 2 right) ----
    this.deskUnit(178, 250, accent, theme.deskItem, true);
    this.deskUnit(178, 412, accent, '📄', false);
    this.deskUnit(582, 250, accent, '☕', false);
    this.deskUnit(582, 412, accent, theme.deskItem, true);

    // ---- central meeting table with a small standup ----
    this.meetingTable(ROOM_W / 2, 372, accent);

    // ---- lounge corner: sofa + relaxing colleague + plants ----
    this.lounge(108, 474, accent);
    this.drawPlant(672, 470);
    this.drawPlant(232, 478);

    // ---- activity podium (opens the building's panel) ----
    this.activity = { x: ROOM_W / 2, y: 150 };
    const halo = this.add.circle(this.activity.x, this.activity.y, 42, accent, 0.16).setDepth(2);
    this.tweens.add({ targets: halo, scale: 1.25, alpha: 0.3, duration: 1300, yoyo: true, repeat: -1 });
    this.add.ellipse(this.activity.x, this.activity.y + 30, 70, 18, 0x000000, 0.25).setDepth(2);
    const podium = this.add.graphics().setDepth(3);
    podium.fillStyle(0x2b2d3f, 1).fillRoundedRect(this.activity.x - 30, this.activity.y + 4, 60, 26, 6);
    podium.fillStyle(accent, 0.9).fillRoundedRect(this.activity.x - 30, this.activity.y + 4, 60, 6, 3);
    this.add.text(this.activity.x, this.activity.y - 6, theme.glyph, { fontSize: '46px' }).setOrigin(0.5).setDepth(4);
    const ring = this.add.circle(this.activity.x, this.activity.y, 30, accent, 0).setStrokeStyle(3, accent, 0.7).setDepth(4);
    this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 1600, repeat: -1 });

    // ---- collectible chests (edge lanes) ----
    const opened = useGameStore.getState().chestsOpened;
    const chestSpots = [{ x: 70, y: 300 }, { x: ROOM_W - 70, y: 300 }];
    chestSpots.forEach((spot, i) => {
      const key = `${this.stationId}:c${i}`;
      const isOpen = !!opened[key];
      const c = this.add.container(spot.x, spot.y).setDepth(6);
      this.drawChest(c, isOpen);
      this.tweens.add({ targets: c, y: spot.y - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.chests.push({ x: spot.x, y: spot.y, key, obj: c, open: isOpen, reward: CHEST_COINS, kind: 'chest' });
    });

    // ---- hidden gem — tucked into the far corner, worth more, easy to miss ----
    {
      const gemKey = `${this.stationId}:gem`;
      const gemFound = !!opened[gemKey];
      const gx = ROOM_W - 60;
      const gy = 104;
      const c = this.add.container(gx, gy).setDepth(6).setVisible(!gemFound);
      this.drawGem(c, accent);
      if (!gemFound) {
        const glow = this.add.circle(0, 0, 12, accent, 0.3);
        c.addAt(glow, 0);
        this.tweens.add({ targets: glow, scale: 1.8, alpha: 0, duration: 1400, repeat: -1 });
        this.tweens.add({ targets: c, y: gy - 5, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
      this.chests.push({ x: gx, y: gy, key: gemKey, obj: c, open: gemFound, reward: GEM_COINS, kind: 'gem' });
    }

    // ---- exit door ----
    this.exit = { x: ROOM_W / 2, y: ROOM_H - 38 };
    this.add.rectangle(this.exit.x, this.exit.y, 56, 60, 0x111421, 1).setDepth(3);
    this.add.rectangle(this.exit.x, this.exit.y, 48, 52, accent, 0.9).setDepth(3);
    this.add.text(this.exit.x, this.exit.y, '🚪', { fontSize: '30px' }).setOrigin(0.5).setDepth(4);

    // ---- player ----
    this.player = new PlayerController(this, this.exit.x, this.exit.y - 70);
    this.physics.add.collider(this.player.sprite, this.solids);

    this.cameras.main.setBounds(0, 0, ROOM_W, ROOM_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.15, 0.15);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.roundPixels = true;
    this.cameras.main.fadeIn(250);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
    this.keys.E.on('down', this.tryInteract);
    this.keys.SPACE.on('down', this.tryInteract);

    EventBus.on('game:pause', this.onPause, this);
    EventBus.on('game:resume', this.onResume, this);
    EventBus.on('input:move', this.onMobileMove, this);
    EventBus.on('input:release', this.onMobileRelease, this);
    EventBus.on('input:interact', this.tryInteract, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unbind());

    // welcome chord on entry
    sfx('enter');

    // one-time first-visit bonus
    const bonus = useGameStore.getState().claimInteriorVisit(this.stationId);
    if (bonus) {
      this.time.delayedCall(400, () => {
        EventBus.emit('reward:toast', { text: `أول زيارة لـ«${st.nameAr}» · +${bonus.xp} خبرة · +${bonus.coins} 🪙` });
        sfx('badge');
        this.popText(this.player.sprite.x, this.player.sprite.y - 40, `+${bonus.xp} خبرة`, '#00c17a');
      });
    }
  }

  // ---------------- furniture & decor helpers ----------------

  private addSolid(x: number, y: number, w: number, h: number) {
    const r = this.add.rectangle(x, y, w, h).setVisible(false);
    this.physics.add.existing(r, true);
    this.solids.add(r);
  }

  private addRug(x: number, y: number, w: number, h: number, accent: number, oval = false) {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(accent, 0.08);
    if (oval) g.fillEllipse(x, y, w, h);
    else g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 16);
    g.lineStyle(2, accent, 0.18);
    if (oval) g.strokeEllipse(x, y, w, h);
    else g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 16);
  }

  // A seated worker drawn into a container (origin at the chest, facing viewer).
  private drawPerson(c: Phaser.GameObjects.Container) {
    const skin = SKINS[this.pplIdx % SKINS.length];
    const shirt = SHIRTS[this.pplIdx % SHIRTS.length];
    const hair = HAIRS[this.pplIdx % HAIRS.length];
    this.pplIdx += 1;

    const shadow = this.add.ellipse(0, 22, 32, 10, 0x000000, 0.18);
    const chair = this.add.graphics();
    chair.fillStyle(0x39404e, 1).fillRoundedRect(-15, -16, 30, 34, 7); // chair back
    chair.fillStyle(0x2c3340, 1).fillRoundedRect(-17, 14, 34, 10, 4); // seat
    const body = this.add.graphics();
    body.fillStyle(shirt, 1).fillRoundedRect(-13, -2, 26, 24, 9); // torso
    body.fillStyle(shirt, 1).fillRoundedRect(-17, 2, 8, 16, 4); // left arm
    body.fillStyle(shirt, 1).fillRoundedRect(9, 2, 8, 16, 4); // right arm
    const head = this.add.circle(0, -14, 8, skin);
    const hairG = this.add.graphics();
    hairG.fillStyle(hair, 1).fillRoundedRect(-8, -23, 16, 9, 4);
    const face = this.add.container(0, 0, [head, hairG]);
    this.tweens.add({ targets: face, y: -2, duration: 1500 + this.pplIdx * 90, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    c.add([shadow, chair, body, face]);
  }

  private deskUnit(x: number, y: number, accent: number, item: string, chatty: boolean) {
    // worker sits behind the desk
    const person = this.add.container(x, y - 20).setDepth(4);
    this.drawPerson(person);

    // desk drawn in front of the worker
    const desk = this.add.graphics().setDepth(5);
    desk.fillStyle(0x6b4f3a, 1).fillRoundedRect(x - 64, y - 4, 128, 28, 6); // surface
    desk.fillStyle(0x5a4230, 1).fillRoundedRect(x - 64, y + 18, 128, 8, 3); // front edge
    desk.fillStyle(0x4a3527, 1).fillRect(x - 56, y + 24, 8, 16).fillRect(x + 48, y + 24, 8, 16); // legs
    desk.fillStyle(0x222633, 1).fillRoundedRect(x - 17, y - 22, 34, 22, 3); // monitor
    desk.fillStyle(accent, 0.85).fillRect(x - 14, y - 19, 28, 16); // screen
    desk.fillStyle(0x222633, 1).fillRect(x - 3, y - 2, 6, 4); // stand
    this.add.text(x + 36, y + 2, item, { fontSize: '17px' }).setOrigin(0.5).setDepth(6);

    if (chatty) {
      const b = this.add.text(x + 24, y - 36, '💬', { fontSize: '15px' }).setOrigin(0.5).setDepth(7).setAlpha(0);
      this.tweens.add({ targets: b, alpha: { from: 0, to: 1 }, y: y - 46, duration: 700, hold: 1100, yoyo: true, repeat: -1, repeatDelay: 2600, ease: 'Sine.inOut' });
    }

    this.addSolid(x, y + 8, 132, 30);
  }

  private meetingTable(x: number, y: number, accent: number) {
    this.add.ellipse(x, y + 34, 200, 30, 0x000000, 0.15).setDepth(2);
    const t = this.add.graphics().setDepth(5);
    t.fillStyle(0x6a4d35, 1).fillEllipse(x, y + 6, 170, 104);
    t.fillStyle(0x7a5a3f, 1).fillEllipse(x, y, 170, 104);
    t.lineStyle(3, accent, 0.55).strokeEllipse(x, y, 170, 104);
    this.add.text(x - 34, y, '☕', { fontSize: '16px' }).setOrigin(0.5).setDepth(6);
    this.add.text(x + 34, y, '📄', { fontSize: '16px' }).setOrigin(0.5).setDepth(6);
    this.add.text(x, y - 6, '💻', { fontSize: '18px' }).setOrigin(0.5).setDepth(6);

    // colleagues around the table
    [
      { sx: x, sy: y - 74 },
      { sx: x - 100, sy: y + 6 },
      { sx: x + 100, sy: y + 6 },
    ].forEach((s) => {
      const p = this.add.container(s.sx, s.sy).setDepth(4);
      this.drawPerson(p);
    });

    this.addSolid(x, y, 150, 78);
  }

  private lounge(x: number, y: number, accent: number) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x000000, 0.16).fillEllipse(x, y + 22, 120, 18);
    g.fillStyle(accent, 0.85).fillRoundedRect(x - 52, y - 18, 104, 34, 10); // sofa back
    g.fillStyle(0x2c3340, 0.25).fillRoundedRect(x - 52, y + 4, 104, 16, 8); // seat shade
    // relaxing colleague on the sofa
    const p = this.add.container(x - 4, y - 6).setDepth(4);
    this.drawPerson(p);
    // small coffee table
    this.add.ellipse(x + 70, y + 8, 40, 18, 0x4a3527, 1).setDepth(4);
    this.add.text(x + 70, y + 4, '🍵', { fontSize: '15px' }).setOrigin(0.5).setDepth(5);
    this.addSolid(x, y + 6, 108, 30);
  }

  private drawPlant(x: number, y: number) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x000000, 0.16).fillEllipse(x, y + 18, 30, 9);
    g.fillStyle(0x8a5a2b, 1).fillRoundedRect(x - 11, y + 4, 22, 16, 3); // pot
    this.add.text(x, y - 6, '🪴', { fontSize: '26px' }).setOrigin(0.5).setDepth(4);
    this.addSolid(x, y + 10, 26, 16);
  }

  private drawWindow(x: number, y: number, accent: number) {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x101826, 1).fillRoundedRect(x - 36, y - 16, 72, 34, 4);
    g.fillStyle(0x1d3a5c, 1).fillRect(x - 32, y - 12, 64, 26); // sky
    g.fillStyle(0x274b73, 1);
    [-26, -8, 12, 26].forEach((bx, i) => g.fillRect(x + bx, y - 4 + (i % 2) * 4, 12, 18)); // skyline
    g.fillStyle(accent, 0.5).fillCircle(x + 20, y - 6, 4); // sun/moon
    g.lineStyle(3, 0x3a3d52, 1).strokeRoundedRect(x - 36, y - 16, 72, 34, 4);
    g.lineStyle(2, 0x3a3d52, 1).lineBetween(x, y - 14, x, y + 16);
  }

  private drawFramedArt(x: number, y: number, glyph: string, accent: number) {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x - 22, y - 18, 44, 38, 4);
    g.lineStyle(3, accent, 1).strokeRoundedRect(x - 22, y - 18, 44, 38, 4);
    this.add.text(x, y, glyph, { fontSize: '26px' }).setOrigin(0.5).setDepth(3);
  }

  private drawClock(x: number, y: number) {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0xf7f4ee, 1).fillCircle(x, y, 13);
    g.lineStyle(2, 0x2b2d3f, 1).strokeCircle(x, y, 13);
    g.lineStyle(2, 0x2b2d3f, 1).lineBetween(x, y, x, y - 8).lineBetween(x, y, x + 6, y + 2);
  }

  private drawGem(c: Phaser.GameObjects.Container, color: number) {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(0, -11);
    g.lineTo(9, -2);
    g.lineTo(0, 13);
    g.lineTo(-9, -2);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xffffff, 0.55);
    g.fillTriangle(0, -11, 9, -2, 0, -1);
    c.add(g);
  }

  private drawChest(c: Phaser.GameObjects.Container, open: boolean) {
    c.removeAll(true);
    const base = this.add.graphics();
    if (open) {
      base.fillStyle(0x8a5a2b, 1).fillRoundedRect(-14, -6, 28, 16, 3);
      base.fillStyle(0x5a3a1b, 1).fillRoundedRect(-15, -16, 30, 8, 3); // open lid
      base.fillStyle(0xffd23f, 0.8).fillRect(-8, -8, 16, 3);
    } else {
      base.fillStyle(0x9a6630, 1).fillRoundedRect(-15, -8, 30, 18, 4);
      base.fillStyle(0xb87a3a, 1).fillRoundedRect(-15, -16, 30, 10, 4);
      base.fillStyle(0xffd23f, 1).fillRect(-3, -10, 6, 6); // lock
    }
    c.add(base);
  }

  private onPause = () => { this.paused = true; this.mobileVec.set(0, 0); this.player?.stop(); };
  private onResume = () => { this.paused = false; };
  private onMobileMove = (v: { dx: number; dy: number }) => this.mobileVec.set(v.dx, v.dy);
  private onMobileRelease = () => this.mobileVec.set(0, 0);

  private tryInteract = () => {
    if (this.paused) return;
    if (this.focus === 'activity') EventBus.emit('station:enter', { stationId: this.stationId });
    else if (this.focus === 'exit') this.exitToTown();
    else this.interactBuffered = true;
  };

  private exitToTown() {
    EventBus.emit('focus:change', null);
    this.unbind();
    this.scene.stop();
    this.scene.wake('World');
    EventBus.emit('progress:request');
  }

  private unbind() {
    EventBus.off('game:pause', this.onPause, this);
    EventBus.off('game:resume', this.onResume, this);
    EventBus.off('input:move', this.onMobileMove, this);
    EventBus.off('input:release', this.onMobileRelease, this);
    EventBus.off('input:interact', this.tryInteract, this);
  }

  update() {
    if (this.paused) return;
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;
    if (this.mobileVec.lengthSq() > 0.01) { dx = this.mobileVec.x; dy = this.mobileVec.y; }
    this.player.setMove(dx, dy);
    this.player.update();

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    // collect chests + hidden gem on contact
    for (const ch of this.chests) {
      const r = ch.kind === 'gem' ? 30 : 34;
      if (!ch.open && (ch.x - px) ** 2 + (ch.y - py) ** 2 < r * r) {
        if (useGameStore.getState().openChest(ch.key, ch.reward)) {
          ch.open = true;
          if (ch.kind === 'gem') {
            this.popText(ch.x, ch.y, '💎', '#84dbe5');
            ch.obj.destroy();
          } else {
            this.drawChest(ch.obj, true);
          }
          sfx('badge');
          this.popText(ch.x, ch.y, `+${ch.reward} 🪙`, '#ffbc0a');
        }
      }
    }

    // focus: activity vs exit
    const dAct = (this.activity.x - px) ** 2 + (this.activity.y - py) ** 2;
    const dExit = (this.exit.x - px) ** 2 + (this.exit.y - py) ** 2;
    let f: 'activity' | 'exit' | null = null;
    if (dExit < 56 * 56) f = 'exit';
    else if (dAct < 84 * 84) f = 'activity';
    if (f !== this.focus) {
      this.focus = f;
      EventBus.emit('focus:change', f ? { kind: f, id: this.stationId } : null);
    }
    if (this.interactBuffered && this.focus) {
      this.interactBuffered = false;
      this.tryInteract();
    }
  }

  private popText(x: number, y: number, label: string, color: string) {
    const t = this.add.text(x, y - 20, label, { fontFamily: 'monospace', fontSize: '16px', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }
}
