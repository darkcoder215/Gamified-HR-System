import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { stations } from '../stations/stationZones';
import type { StationId } from '@/types';
import PlayerController from '../player/PlayerController';
import { useGameStore } from '@/state/store';
import { sfx } from '@/audio/sound';

const ROOM_W = 760;
const ROOM_H = 560;

// Depth bands for things that must always sit behind the y-sorted actors.
const D_FLOOR = -1000;
const D_RUG = -900;
const D_LIGHT = -850;
const D_WALL = -800;

const OUTLINE = 0x15111d;

// Per-building interior theming: every room is a furnished pixel-art office,
// tinted to the building's brand, with a glowing activity podium.
const THEMES: Record<
  StationId,
  { floor: number; floor2: number; seam: number; wall: number; wallLite: number; wallDark: number; accent: number; art: string }
> = {
  arena: { floor: 0x7a5a3c, floor2: 0x6e5034, seam: 0x523a24, wall: 0x2b2d3f, wallLite: 0x3a3d52, wallDark: 0x1d1e2b, accent: 0x00c17a, art: 'target' },
  quests: { floor: 0x7c6646, floor2: 0x6f5b3d, seam: 0x564327, wall: 0x21426c, wallLite: 0x2f5a8c, wallDark: 0x16314f, accent: 0x2b8cff, art: 'map' },
  career: { floor: 0x86714f, floor2: 0x796649, seam: 0x5a4828, wall: 0x4a3a18, wallLite: 0x614a22, wallDark: 0x33280f, accent: 0xffbc0a, art: 'chart' },
  leaderboard: { floor: 0x7a5440, seam: 0x52372a, floor2: 0x6d4a37, wall: 0x4a132c, wallLite: 0x6a1e42, wallDark: 0x320c1d, accent: 0xff2e6e, art: 'cup' },
  org: { floor: 0x64646f, floor2: 0x5a5a66, seam: 0x44444e, wall: 0x232a39, wallLite: 0x333c4f, wallDark: 0x171b26, accent: 0x84dbe5, art: 'people' },
};
const CHEST_COINS = 25;
const GEM_COINS = 50;

const SKINS = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
const SHIRTS = [0x18b67a, 0x2b8cff, 0xffbc0a, 0xff2e6e, 0x84dbe5, 0x9b6bff, 0xff7a3d];
const HAIRS = [0x2b2118, 0x4a3526, 0x101015, 0x6e4a2b, 0x8a8f99];

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
    const t = THEMES[this.stationId];
    const st = stations.find((s) => s.id === this.stationId)!;

    this.physics.world.setBounds(0, 0, ROOM_W, ROOM_H);
    this.solids = this.physics.add.staticGroup();

    this.buildFloor(t);
    this.buildWall(t);

    this.addSolid(ROOM_W / 2, 30, ROOM_W, 60);
    this.addSolid(ROOM_W / 2, ROOM_H - 4, ROOM_W, 8);
    this.addSolid(4, ROOM_H / 2, 8, ROOM_H);
    this.addSolid(ROOM_W - 4, ROOM_H / 2, 8, ROOM_H);

    // section rugs
    this.rug(178, 332, 210, 300, t.accent);
    this.rug(582, 332, 210, 300, t.accent);
    this.rug(ROOM_W / 2, 372, 232, 158, t.accent);

    // back-wall dressing
    this.framedArt(ROOM_W / 2, 28, t);
    this.whiteboard(150, 28, t.accent);
    this.window(420, 28, t.accent);
    this.window(610, 28, t.accent);
    this.clock(694, 28);

    // workspace desks + seated workers
    this.desk(178, 252, t.accent, true);
    this.desk(178, 414, t.accent, false);
    this.desk(582, 252, t.accent, false);
    this.desk(582, 414, t.accent, true);

    // central meeting table
    this.meetingTable(ROOM_W / 2, 372, t.accent);

    // lounge + plants + cooler
    this.lounge(112, 472, t.accent);
    this.plant(672, 468);
    this.plant(250, 486);
    this.cooler(694, 470, t.accent);

    // activity podium
    this.activity = { x: ROOM_W / 2, y: 150 };
    this.podium(this.activity.x, this.activity.y, t.accent);

    // chests
    const opened = useGameStore.getState().chestsOpened;
    [{ x: 70, y: 300 }, { x: ROOM_W - 70, y: 300 }].forEach((spot, i) => {
      const key = `${this.stationId}:c${i}`;
      const isOpen = !!opened[key];
      const c = this.add.container(spot.x, spot.y).setDepth(spot.y + 12);
      this.drawChest(c, isOpen);
      this.tweens.add({ targets: c, y: spot.y - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.chests.push({ x: spot.x, y: spot.y, key, obj: c, open: isOpen, reward: CHEST_COINS, kind: 'chest' });
    });

    // hidden gem
    {
      const gemKey = `${this.stationId}:gem`;
      const gemFound = !!opened[gemKey];
      const gx = ROOM_W - 110;
      const gy = 100;
      const c = this.add.container(gx, gy).setDepth(gy + 12).setVisible(!gemFound);
      this.drawGem(c, t.accent);
      if (!gemFound) this.tweens.add({ targets: c, y: gy - 5, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.chests.push({ x: gx, y: gy, key: gemKey, obj: c, open: gemFound, reward: GEM_COINS, kind: 'gem' });
    }

    // exit door
    this.exit = { x: ROOM_W / 2, y: ROOM_H - 36 };
    this.door(this.exit.x, this.exit.y, t.accent);

    this.dust(t.accent);

    // player
    this.player = new PlayerController(this, this.exit.x, this.exit.y - 78);
    this.physics.add.collider(this.player.sprite, this.solids);

    this.cameras.main.setBounds(0, 0, ROOM_W, ROOM_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.16, 0.16);
    this.cameras.main.setZoom(1.7);
    this.cameras.main.roundPixels = true;
    this.cameras.main.fadeIn(260);
    // vignette only — no bloom (bloom blurs the pixel art)
    if (this.cameras.main.postFX) this.cameras.main.postFX.addVignette(0.5, 0.5, 0.82, 0.4);

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

    sfx('enter');

    const bonus = useGameStore.getState().claimInteriorVisit(this.stationId);
    if (bonus) {
      this.time.delayedCall(400, () => {
        EventBus.emit('reward:toast', { text: `أول زيارة لـ«${st.nameAr}» · +${bonus.xp} خبرة · +${bonus.coins} 🪙` });
        sfx('badge');
        this.popText(this.player.sprite.x, this.player.sprite.y - 40, `+${bonus.xp} خبرة`, '#18b67a');
      });
    }
  }

  // ---------------- pixel-draw helpers ----------------

  private shade(color: number, amt: number): number {
    const c = Phaser.Display.Color.IntegerToColor(color);
    const f = (v: number) => Phaser.Math.Clamp(Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt)), 0, 255);
    return Phaser.Display.Color.GetColor(f(c.red), f(c.green), f(c.blue));
  }

  // filled block with a 1px dark outline — the staple of the pixel look
  private box(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number, outline = OUTLINE) {
    g.fillStyle(outline, 1).fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(fill, 1).fillRect(x, y, w, h);
  }

  private addSolid(x: number, y: number, w: number, h: number) {
    const r = this.add.rectangle(x, y, w, h).setVisible(false);
    this.physics.add.existing(r, true);
    this.solids.add(r);
  }

  // ---------------- room shell ----------------

  private buildFloor(t: (typeof THEMES)[StationId]) {
    const g = this.add.graphics().setDepth(D_FLOOR);
    const T = 38;
    for (let y = 56; y < ROOM_H; y += T) {
      for (let x = 0; x < ROOM_W; x += T) {
        const even = (Math.floor(x / T) + Math.floor(y / T)) % 2 === 0;
        g.fillStyle(even ? t.floor : t.floor2, 1).fillRect(x, y, T, T);
        g.fillStyle(this.shade(even ? t.floor : t.floor2, 0.07), 1).fillRect(x, y, T, 2); // plank sheen
      }
    }
    g.fillStyle(t.seam, 0.6);
    for (let x = 0; x <= ROOM_W; x += T) g.fillRect(x, 56, 1, ROOM_H);
    for (let y = 56; y <= ROOM_H; y += T) g.fillRect(0, y, ROOM_W, 1);
    // hard-edged ambient occlusion near walls/edges
    const ao = this.add.graphics().setDepth(D_FLOOR + 1);
    ao.fillStyle(0x000000, 0.18).fillRect(0, 56, ROOM_W, 10);
    ao.fillStyle(0x000000, 0.1).fillRect(0, 66, ROOM_W, 6);
    ao.fillStyle(0x000000, 0.12).fillRect(0, 56, 10, ROOM_H).fillRect(ROOM_W - 10, 56, 10, ROOM_H);
    ao.fillStyle(0x000000, 0.12).fillRect(0, ROOM_H - 10, ROOM_W, 10);
  }

  private buildWall(t: (typeof THEMES)[StationId]) {
    const g = this.add.graphics().setDepth(D_WALL);
    this.box(g, 0, 0, ROOM_W, 50, t.wall, t.wallDark);
    g.fillStyle(t.wallLite, 1).fillRect(0, 0, ROOM_W, 3); // crown
    // panelling
    g.fillStyle(t.wallDark, 1).fillRect(0, 38, ROOM_W, 2);
    g.fillStyle(t.wallLite, 0.6);
    for (let x = 22; x < ROOM_W; x += 64) g.fillRect(x, 8, 2, 28);
    // baseboard + accent strip
    g.fillStyle(t.wallDark, 1).fillRect(0, 50, ROOM_W, 4);
    g.fillStyle(t.accent, 1).fillRect(0, 54, ROOM_W, 2);
    g.fillStyle(this.shade(t.accent, 0.4), 0.5).fillRect(0, 56, ROOM_W, 2);
  }

  private rug(x: number, y: number, w: number, h: number, accent: number) {
    const g = this.add.graphics().setDepth(D_RUG);
    g.fillStyle(this.shade(accent, -0.55), 0.32).fillRect(x - w / 2, y - h / 2, w, h);
    g.fillStyle(accent, 0.16).fillRect(x - w / 2 + 6, y - h / 2 + 6, w - 12, h - 12);
    g.fillStyle(accent, 0.3).fillRect(x - w / 2, y - h / 2, w, 2).fillRect(x - w / 2, y + h / 2 - 2, w, 2);
    g.fillStyle(accent, 0.3).fillRect(x - w / 2, y - h / 2, 2, h).fillRect(x + w / 2 - 2, y - h / 2, 2, h);
  }

  private dust(accent: number) {
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(60, ROOM_W - 60);
      const y = Phaser.Math.Between(90, ROOM_H - 80);
      const m = this.add.rectangle(x, y, 2, 2, i % 3 === 0 ? accent : 0xfff1d4, 0.5).setDepth(4000);
      this.tweens.add({ targets: m, y: y - Phaser.Math.Between(16, 40), alpha: { from: 0.12, to: 0.5 }, duration: Phaser.Math.Between(3000, 6000), yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: i * 200 });
    }
  }

  // ---------------- people ----------------

  private worker(x: number, y: number) {
    const skin = SKINS[this.pplIdx % SKINS.length];
    const shirt = SHIRTS[this.pplIdx % SHIRTS.length];
    const hair = HAIRS[this.pplIdx % HAIRS.length];
    this.pplIdx += 1;

    const c = this.add.container(x, y).setDepth(y + 4);
    const shadow = this.add.ellipse(0, 26, 34, 10, 0x000000, 0.22);
    const g = this.add.graphics();
    // office chair back
    this.box(g, -15, -18, 30, 40, 0x3a414d, OUTLINE);
    g.fillStyle(0x4d5666, 1).fillRect(-12, -15, 24, 12);
    // torso
    this.box(g, -13, 0, 26, 22, shirt, OUTLINE);
    g.fillStyle(this.shade(shirt, 0.22), 1).fillRect(-10, 1, 5, 18);
    g.fillStyle(this.shade(shirt, -0.22), 1).fillRect(7, 1, 5, 20);
    // arms + hands
    g.fillStyle(shirt, 1).fillRect(-17, 3, 5, 15).fillRect(12, 3, 5, 15);
    g.fillStyle(skin, 1).fillRect(-17, 16, 5, 5).fillRect(12, 16, 5, 5);
    c.add([shadow, g]);

    // head (own object so it can bob crisply)
    const hg = this.add.graphics();
    this.box(hg, -8, -16, 16, 15, skin, OUTLINE);
    hg.fillStyle(hair, 1).fillRect(-8, -16, 16, 5).fillRect(-8, -16, 3, 9).fillRect(5, -16, 3, 9);
    hg.fillStyle(this.shade(skin, 0.14), 1).fillRect(3, -9, 3, 4); // cheek light
    hg.fillStyle(OUTLINE, 1).fillRect(-4, -8, 2, 2).fillRect(2, -8, 2, 2); // eyes
    c.add(hg);
    this.tweens.add({ targets: hg, y: -2, duration: 1500 + this.pplIdx * 80, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return c;
  }

  // ---------------- furniture ----------------

  private desk(x: number, y: number, accent: number, chatty: boolean) {
    this.worker(x, y - 24);

    const g = this.add.graphics().setDepth(y + 26);
    g.fillStyle(0x000000, 0.22).fillEllipse(x, y + 34, 150, 16); // contact shadow
    // legs
    g.fillStyle(0x3a2a18, 1).fillRect(x - 58, y + 20, 7, 20).fillRect(x + 51, y + 20, 7, 20);
    // body
    this.box(g, x - 66, y - 6, 132, 28, 0x8a5a32);
    g.fillStyle(0xa9743f, 1).fillRect(x - 66, y - 6, 132, 5); // top sheen
    g.fillStyle(0x5e3c20, 1).fillRect(x - 66, y + 17, 132, 5); // front shadow
    // monitor
    this.box(g, x - 21, y - 28, 42, 26, 0x14161f);
    g.fillStyle(accent, 1).fillRect(x - 17, y - 24, 34, 18);
    g.fillStyle(this.shade(accent, 0.35), 1).fillRect(x - 14, y - 21, 16, 3).fillRect(x - 14, y - 16, 26, 3).fillRect(x - 14, y - 11, 12, 3);
    g.fillStyle(0x14161f, 1).fillRect(x - 3, y - 2, 6, 4);
    g.fillStyle(0x0d0f16, 1).fillRect(x - 9, y + 2, 18, 3); // monitor base
    // keyboard + mouse + papers + mug
    this.box(g, x - 22, y + 6, 30, 7, 0x2a2f3a);
    g.fillStyle(0x444b59, 1).fillRect(x - 20, y + 7, 26, 2);
    this.box(g, x + 12, y + 7, 6, 5, 0x2a2f3a);
    this.box(g, x + 22, y + 2, 13, 12, 0xe9e3d6); // papers
    g.fillStyle(0xc9c0ac, 1).fillRect(x + 24, y + 5, 9, 1).fillRect(x + 24, y + 8, 9, 1).fillRect(x + 24, y + 11, 6, 1);
    this.box(g, x - 40, y + 2, 9, 10, 0xe7eef5); // mug
    g.fillStyle(0xe7eef5, 1).fillRect(x - 31, y + 4, 3, 5);
    g.fillStyle(this.shade(accent, 0.2), 1).fillRect(x - 38, y + 4, 5, 2);

    if (chatty) {
      const bx = x + 30;
      const by = y - 42;
      const b = this.add.container(bx, by).setDepth(y + 40).setAlpha(0);
      const bg = this.add.graphics();
      this.box(bg, -12, -9, 24, 16, 0xffffff);
      bg.fillStyle(0xffffff, 1).fillTriangle(-4, 7, 4, 7, -6, 14);
      bg.fillStyle(accent, 1).fillRect(-7, -4, 14, 2).fillRect(-7, 0, 10, 2);
      b.add(bg);
      this.tweens.add({ targets: b, alpha: { from: 0, to: 1 }, y: by - 8, duration: 700, hold: 1200, yoyo: true, repeat: -1, repeatDelay: 2600, ease: 'Sine.inOut' });
    }

    this.addSolid(x, y + 8, 132, 30);
  }

  private meetingTable(x: number, y: number, accent: number) {
    this.worker(x, y - 80);
    this.worker(x - 106, y - 4);
    this.worker(x + 106, y - 4);

    const g = this.add.graphics().setDepth(y + 52);
    g.fillStyle(0x000000, 0.2).fillEllipse(x, y + 40, 214, 28); // soft shadow
    this.pixelEllipse(g, x, y + 2, 92, 58, OUTLINE);
    this.pixelEllipse(g, x, y + 6, 89, 54, 0x6a4326); // side
    this.pixelEllipse(g, x, y, 89, 54, 0x8a5a32); // top
    g.fillStyle(0xa9743f, 0.5).fillEllipse(x - 30, y - 16, 92, 40); // sheen
    // laptops + cups
    this.box(g, x - 44, y - 8, 22, 14, 0x20242e);
    g.fillStyle(accent, 1).fillRect(x - 42, y - 6, 18, 8);
    this.box(g, x + 22, y - 8, 22, 14, 0x20242e);
    g.fillStyle(accent, 1).fillRect(x + 24, y - 6, 18, 8);
    this.box(g, x - 8, y + 6, 8, 8, 0xe7eef5);
    g.fillStyle(this.shade(accent, 0.2), 1).fillRect(x - 6, y + 8, 4, 2);
    this.addSolid(x, y, 150, 78);
  }

  private lounge(x: number, y: number, accent: number) {
    const dark = this.shade(accent, -0.35);
    const lite = this.shade(accent, 0.18);
    const g = this.add.graphics().setDepth(y + 18);
    g.fillStyle(0x000000, 0.2).fillEllipse(x, y + 24, 132, 16);
    this.box(g, x - 56, y - 22, 112, 40, dark); // body
    g.fillStyle(accent, 1).fillRect(x - 52, y - 18, 104, 22); // back cushion
    g.fillStyle(lite, 1).fillRect(x - 50, y - 16, 100, 4);
    g.fillStyle(this.shade(accent, 0.06), 1).fillRect(x - 50, y + 2, 100, 14); // seat
    g.fillStyle(dark, 1).fillRect(x - 56, y - 14, 8, 30).fillRect(x + 48, y - 14, 8, 30); // arms
    g.fillStyle(0xffffff, 0.85).fillRect(x + 16, y - 14, 16, 14); // pillow
    g.fillStyle(0xd9dde6, 1).fillRect(x + 16, y - 1, 16, 2);

    this.worker(x - 4, y - 12);

    // coffee table
    const ct = this.add.graphics().setDepth(y + 14);
    ct.fillStyle(0x000000, 0.18).fillEllipse(x + 80, y + 16, 46, 12);
    this.box(ct, x + 62, y + 2, 36, 10, 0x6a4326);
    ct.fillStyle(0x8a5a32, 1).fillRect(x + 62, y + 2, 36, 4);
    ct.fillStyle(0x2a2f3a, 1).fillRect(x + 70, y + 4, 12, 5); // book
    ct.fillStyle(accent, 1).fillRect(x + 70, y + 4, 12, 1);
    this.addSolid(x, y + 6, 116, 30);
  }

  private plant(x: number, y: number) {
    const g = this.add.graphics().setDepth(y + 12);
    g.fillStyle(0x000000, 0.18).fillEllipse(x, y + 18, 34, 9);
    // pot
    this.box(g, x - 12, y + 4, 24, 16, 0xb5683a);
    g.fillStyle(0xc97c4a, 1).fillRect(x - 12, y + 4, 24, 4);
    g.fillStyle(0x8f4f2a, 1).fillRect(x - 12, y + 16, 24, 4);
    // foliage (layered green blocks)
    g.fillStyle(0x1f6b34, 1).fillRect(x - 14, y - 16, 28, 20);
    g.fillStyle(0x2f8a45, 1).fillRect(x - 11, y - 20, 22, 18);
    g.fillStyle(0x3fa657, 1).fillRect(x - 7, y - 22, 8, 10).fillRect(x + 2, y - 18, 7, 8);
    g.fillStyle(0x1f6b34, 1).fillRect(x - 2, y - 14, 4, 14); // stem hint
    this.addSolid(x, y + 10, 26, 16);
  }

  private cooler(x: number, y: number, accent: number) {
    const g = this.add.graphics().setDepth(y + 12);
    g.fillStyle(0x000000, 0.18).fillEllipse(x, y + 20, 30, 9);
    this.box(g, x - 11, y - 6, 22, 26, 0xdfe7ee); // body
    this.box(g, x - 9, y - 18, 18, 14, 0x9fd6ea); // bottle
    g.fillStyle(0x7cc3dd, 1).fillRect(x - 7, y - 16, 14, 6);
    g.fillStyle(accent, 1).fillRect(x - 8, y + 4, 16, 3); // spout panel
    g.fillStyle(0x2a2f3a, 1).fillRect(x - 5, y + 9, 10, 7);
    this.addSolid(x, y + 8, 24, 22);
  }

  private podium(x: number, y: number, accent: number) {
    this.add.ellipse(x, y + 34, 84, 18, 0x000000, 0.26).setDepth(y + 30);
    const g = this.add.graphics().setDepth(y + 30);
    this.box(g, x - 30, y + 6, 60, 28, 0x262838); // base
    g.fillStyle(0x33364a, 1).fillRect(x - 30, y + 6, 60, 5);
    g.fillStyle(accent, 1).fillRect(x - 30, y + 6, 60, 2);
    g.fillStyle(this.shade(accent, -0.3), 1).fillRect(x - 30, y + 30, 60, 4);
    // soft hard-edged light pool (no blur)
    this.add.rectangle(x, y + 16, 150, 70, accent, 0.06).setDepth(D_LIGHT);
    this.add.rectangle(x, y + 16, 100, 46, accent, 0.06).setDepth(D_LIGHT);

    // floating accent crystal
    const cz = this.add.container(x, y - 6).setDepth(y + 31);
    const cg = this.add.graphics();
    this.pixelDiamond(cg, 0, 0, 16, accent);
    cg.fillStyle(0xffffff, 0.85).fillRect(-4, -8, 4, 8); // glint
    cg.fillStyle(this.shade(accent, -0.4), 1).fillRect(0, 2, 6, 8); // facet shade
    cz.add(cg);
    this.tweens.add({ targets: cz, y: y - 14, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: cz, angle: { from: -4, to: 4 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const ring = this.add.circle(x, y, 22, accent, 0).setStrokeStyle(2, accent, 0.7).setDepth(y + 29);
    this.tweens.add({ targets: ring, scale: 2, alpha: 0, duration: 1700, repeat: -1 });
  }

  private pixelEllipse(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number, color: number) {
    g.fillStyle(color, 1);
    for (let dy = -ry; dy <= ry; dy++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
      g.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
    }
  }

  private pixelDiamond(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: number) {
    g.fillStyle(OUTLINE, 1);
    for (let dy = -r - 1; dy <= r + 1; dy++) {
      const w = Math.round((r + 1) * (1 - Math.abs(dy) / (r + 1)));
      g.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
    }
    g.fillStyle(color, 1);
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.round(r * (1 - Math.abs(dy) / r));
      g.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
    }
  }

  // ---------------- wall decor ----------------

  private framedArt(x: number, y: number, t: (typeof THEMES)[StationId]) {
    const g = this.add.graphics().setDepth(D_WALL + 1);
    this.box(g, x - 26, y - 18, 52, 36, 0x2a2233, 0x0d0a12); // frame
    g.fillStyle(this.shade(t.accent, -0.5), 1).fillRect(x - 22, y - 14, 44, 28); // canvas
    g.fillStyle(t.accent, 1);
    if (t.art === 'target') { g.fillCircle(x, y, 9); g.fillStyle(0x2a2233, 1).fillCircle(x, y, 6); g.fillStyle(t.accent, 1).fillCircle(x, y, 3); }
    else if (t.art === 'cup') { g.fillRect(x - 7, y - 8, 14, 8); g.fillRect(x - 3, y, 6, 6); g.fillRect(x - 6, y + 6, 12, 3); }
    else if (t.art === 'chart') { g.fillRect(x - 12, y + 6, 5, 6).fillRect(x - 5, y, 5, 12).fillRect(x + 2, y - 6, 5, 18); }
    else if (t.art === 'map') { g.fillRect(x - 14, y - 8, 28, 16); g.fillStyle(this.shade(t.accent, -0.4), 1).fillRect(x - 10, y - 4, 8, 3).fillRect(x + 2, y + 1, 9, 3); }
    else { g.fillCircle(x - 6, y - 2, 4).fillCircle(x + 6, y - 2, 4); g.fillRect(x - 11, y + 3, 10, 7).fillRect(x + 1, y + 3, 10, 7); }
  }

  private whiteboard(x: number, y: number, accent: number) {
    const g = this.add.graphics().setDepth(D_WALL + 1);
    this.box(g, x - 30, y - 16, 60, 32, 0xf2f4f7, 0x9aa1ab);
    g.fillStyle(accent, 0.9).fillRect(x - 24, y - 10, 22, 2).fillRect(x - 24, y - 4, 34, 2);
    g.fillStyle(0x9aa1ab, 1).fillRect(x - 24, y + 3, 28, 2).fillRect(x - 24, y + 8, 16, 2);
    g.fillStyle(this.shade(accent, -0.2), 1).fillRect(x + 8, y - 11, 14, 14); // sticky note
  }

  private window(x: number, y: number, accent: number) {
    const g = this.add.graphics().setDepth(D_WALL + 1);
    this.box(g, x - 26, y - 17, 52, 34, 0x121a2a, 0x0c1018);
    g.fillStyle(0x244a73, 1).fillRect(x - 22, y - 13, 44, 26); // sky
    g.fillStyle(0x1b3a5c, 1).fillRect(x - 22, y + 1, 44, 12); // lower sky
    g.fillStyle(accent, 0.8).fillRect(x + 12, y - 9, 5, 5); // sun
    g.fillStyle(0x2d567f, 1);
    [-18, -8, 4, 14].forEach((bx, i) => g.fillRect(x + bx, y - 2 + (i % 2) * 4, 8, 15)); // skyline
    g.fillStyle(0x0c1018, 1).fillRect(x - 1, y - 13, 2, 26).fillRect(x - 22, y, 44, 2); // mullions
  }

  private clock(x: number, y: number) {
    const g = this.add.graphics().setDepth(D_WALL + 1);
    g.fillStyle(0x0d0a12, 1).fillCircle(x, y, 12);
    g.fillStyle(0xf7f4ee, 1).fillCircle(x, y, 10);
    g.fillStyle(0x2b2d3f, 1).fillRect(x - 1, y - 7, 2, 8).fillRect(x, y - 1, 6, 2);
  }

  private door(x: number, y: number, accent: number) {
    const g = this.add.graphics().setDepth(y);
    this.box(g, x - 30, y - 34, 60, 66, 0x0d1019, 0x05070c); // frame
    this.box(g, x - 24, y - 28, 48, 58, this.shade(accent, -0.15));
    g.fillStyle(this.shade(accent, 0.2), 1).fillRect(x - 24, y - 28, 48, 4);
    g.fillStyle(0x0d1019, 0.55).fillRect(x - 18, y - 22, 36, 46); // inner panel
    g.fillStyle(accent, 1).fillRect(x - 18, y - 24, 36, 2);
    g.fillStyle(0xffd23f, 1).fillRect(x + 12, y + 2, 4, 6); // handle
    // EXIT arrow above
    const ag = this.add.graphics().setDepth(y);
    ag.fillStyle(accent, 0.9).fillTriangle(x, y - 44, x - 8, y - 36, x + 8, y - 36);
    ag.fillRect(x - 3, y - 38, 6, 6);
  }

  // ---------------- collectibles ----------------

  private drawGem(c: Phaser.GameObjects.Container, color: number) {
    const g = this.add.graphics();
    this.pixelDiamond(g, 0, 0, 11, color);
    g.fillStyle(0xffffff, 0.8).fillRect(-3, -6, 3, 6);
    g.fillStyle(this.shade(color, -0.4), 1).fillRect(1, 2, 4, 6);
    c.add(g);
  }

  private drawChest(c: Phaser.GameObjects.Container, open: boolean) {
    c.removeAll(true);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.22).fillEllipse(0, 14, 36, 9);
    this.box(g, -16, -4, 32, 18, 0x9a6630); // body
    g.fillStyle(0x7a4d24, 1).fillRect(-16, 8, 32, 6);
    g.fillStyle(0xc99a4e, 1).fillRect(-16, -4, 32, 3);
    if (open) {
      this.box(g, -16, -18, 32, 8, 0x7a4d24); // lid up
      g.fillStyle(0xffd23f, 1).fillRect(-9, -2, 18, 4); // gold
      g.fillStyle(0xfff0a8, 1).fillRect(-7, -1, 6, 2);
    } else {
      this.box(g, -16, -12, 32, 8, 0xb87a3a); // lid
      g.fillStyle(0xc99a4e, 1).fillRect(-16, -12, 32, 2);
      g.fillStyle(0xffd23f, 1).fillRect(-3, -8, 6, 8); // lock
      g.fillStyle(0x9a6630, 1).fillRect(-1, -5, 2, 3);
    }
    c.add(g);
  }

  // ---------------- input & lifecycle ----------------

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
    this.player.sprite.setDepth(py + 22);

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

    const dAct = (this.activity.x - px) ** 2 + (this.activity.y - py) ** 2;
    const dExit = (this.exit.x - px) ** 2 + (this.exit.y - py) ** 2;
    let f: 'activity' | 'exit' | null = null;
    if (dExit < 58 * 58) f = 'exit';
    else if (dAct < 86 * 86) f = 'activity';
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
    const t = this.add.text(x, y - 20, label, { fontFamily: 'monospace', fontSize: '16px', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(9000);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }
}
