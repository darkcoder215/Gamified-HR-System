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
const D_RUG = -800;
const D_LIGHT = -500;
const D_BEAM = -460;
const D_LAMP = -440;
const WARM = 0xfff1d4;

// Per-building interior theming. Every room is a furnished open-plan office
// (desks + seated workers, a meeting table, a lounge) tinted to the building's
// brand, with a glowing activity podium that opens the matching panel.
const THEMES: Record<
  StationId,
  { floor: number; floor2: number; grout: number; wallTop: number; wallBot: number; wainscot: number; accent: string; glyph: string; art: string; deskItem: string }
> = {
  arena: { floor: 0x6f553d, floor2: 0x644b35, grout: 0x4c3826, wallTop: 0x232535, wallBot: 0x2b2d3f, wainscot: 0x363951, accent: '#00c17a', glyph: '⚔️', art: '🎯', deskItem: '🛡️' },
  quests: { floor: 0x726045, floor2: 0x67553c, grout: 0x4f4029, wallTop: 0x17304f, wallBot: 0x1f3a5f, wainscot: 0x2c4f7d, accent: '#0072f9', glyph: '📋', art: '🗺️', deskItem: '🗂️' },
  career: { floor: 0x7d6d54, floor2: 0x72624a, grout: 0x564525, wallTop: 0x2c2310, wallBot: 0x3a2e10, wainscot: 0x554121, accent: '#ffbc0a', glyph: '🏙️', art: '📈', deskItem: '🏆' },
  leaderboard: { floor: 0x6f4d3c, floor2: 0x644536, grout: 0x4a3326, wallTop: 0x2c0a1a, wallBot: 0x3a0e22, wainscot: 0x551534, accent: '#82003a', glyph: '🏆', art: '🥇', deskItem: '🎖️' },
  org: { floor: 0x5d5d69, floor2: 0x545460, grout: 0x3d3d48, wallTop: 0x161b27, wallBot: 0x1c2230, wainscot: 0x2c3344, accent: '#84dbe5', glyph: '🏢', art: '📊', deskItem: '🖥️' },
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
    this.makeGlowTexture();

    this.buildFloor(theme, accent);
    this.buildWall(theme, accent);

    // collision walls (invisible)
    this.addSolid(ROOM_W / 2, 30, ROOM_W, 60);
    this.addSolid(ROOM_W / 2, ROOM_H - 4, ROOM_W, 8);
    this.addSolid(4, ROOM_H / 2, 8, ROOM_H);
    this.addSolid(ROOM_W - 4, ROOM_H / 2, 8, ROOM_H);

    // section rugs (define zones)
    this.addRug(178, 332, 210, 300, accent);
    this.addRug(582, 332, 210, 300, accent);
    this.addRug(ROOM_W / 2, 372, 230, 156, accent, true);

    // ambient lighting: ceiling lamps, beams, floor pools
    this.buildLighting(accent);

    // back-wall dressing
    this.drawFramedArt(ROOM_W / 2, 26, theme.art, accent);
    this.drawWindow(190, 26, accent);
    this.drawWindow(570, 26, accent);
    this.drawClock(686, 26);
    this.add.text(76, 26, theme.deskItem, { fontSize: '20px' }).setOrigin(0.5).setDepth(26);

    // workspace desks with seated workers (2 left, 2 right)
    this.deskUnit(178, 250, accent, theme.deskItem, true);
    this.deskUnit(178, 412, accent, '📄', false);
    this.deskUnit(582, 250, accent, '☕', false);
    this.deskUnit(582, 412, accent, theme.deskItem, true);

    // central meeting table with a small standup
    this.meetingTable(ROOM_W / 2, 372, accent);

    // lounge corner + plants
    this.lounge(112, 470, accent);
    this.drawPlant(672, 466);
    this.drawPlant(244, 486);

    // activity podium (opens the building's panel)
    this.activity = { x: ROOM_W / 2, y: 150 };
    this.addGlow(this.activity.x, this.activity.y + 18, 220, 120, accent, 0.3, D_LIGHT);
    this.add.ellipse(this.activity.x, this.activity.y + 32, 78, 20, 0x000000, 0.28).setDepth(this.activity.y + 30);
    const podium = this.add.graphics().setDepth(this.activity.y + 30);
    podium.fillStyle(0x20222f, 1).fillRoundedRect(this.activity.x - 32, this.activity.y + 6, 64, 28, 7);
    podium.fillStyle(0x2b2d3f, 1).fillRoundedRect(this.activity.x - 32, this.activity.y + 4, 64, 8, 4);
    podium.fillStyle(accent, 0.95).fillRoundedRect(this.activity.x - 32, this.activity.y + 4, 64, 4, 2);
    const icon = this.add.text(this.activity.x, this.activity.y - 6, theme.glyph, { fontSize: '46px' }).setOrigin(0.5).setDepth(this.activity.y + 30);
    this.tweens.add({ targets: icon, y: this.activity.y - 12, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const ring = this.add.circle(this.activity.x, this.activity.y, 30, accent, 0).setStrokeStyle(3, accent, 0.7).setDepth(this.activity.y + 29);
    this.tweens.add({ targets: ring, scale: 1.9, alpha: 0, duration: 1700, repeat: -1 });

    // collectible chests (edge lanes)
    const opened = useGameStore.getState().chestsOpened;
    const chestSpots = [{ x: 70, y: 300 }, { x: ROOM_W - 70, y: 300 }];
    chestSpots.forEach((spot, i) => {
      const key = `${this.stationId}:c${i}`;
      const isOpen = !!opened[key];
      this.addGlow(spot.x, spot.y + 6, 70, 40, 0xffd23f, isOpen ? 0.1 : 0.28, D_LIGHT);
      const c = this.add.container(spot.x, spot.y).setDepth(spot.y + 12);
      this.drawChest(c, isOpen);
      this.tweens.add({ targets: c, y: spot.y - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.chests.push({ x: spot.x, y: spot.y, key, obj: c, open: isOpen, reward: CHEST_COINS, kind: 'chest' });
    });

    // hidden gem — tucked into the far corner, worth more, easy to miss
    {
      const gemKey = `${this.stationId}:gem`;
      const gemFound = !!opened[gemKey];
      const gx = ROOM_W - 60;
      const gy = 104;
      const c = this.add.container(gx, gy).setDepth(gy + 12).setVisible(!gemFound);
      this.drawGem(c, accent);
      if (!gemFound) {
        const glow = this.add.circle(0, 0, 12, accent, 0.3);
        c.addAt(glow, 0);
        this.tweens.add({ targets: glow, scale: 1.8, alpha: 0, duration: 1400, repeat: -1 });
        this.tweens.add({ targets: c, y: gy - 5, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
      this.chests.push({ x: gx, y: gy, key: gemKey, obj: c, open: gemFound, reward: GEM_COINS, kind: 'gem' });
    }

    // exit door
    this.exit = { x: ROOM_W / 2, y: ROOM_H - 38 };
    const ex = this.add.graphics().setDepth(this.exit.y);
    ex.fillStyle(0x0d1019, 1).fillRoundedRect(this.exit.x - 30, this.exit.y - 32, 60, 64, 6);
    ex.fillStyle(accent, 0.9).fillRoundedRect(this.exit.x - 24, this.exit.y - 26, 48, 52, 4);
    ex.fillStyle(0x0d1019, 0.85).fillRoundedRect(this.exit.x - 18, this.exit.y - 20, 36, 40, 3);
    this.add.text(this.exit.x, this.exit.y - 2, '🚪', { fontSize: '28px' }).setOrigin(0.5).setDepth(this.exit.y);
    this.addGlow(this.exit.x, this.exit.y + 16, 110, 50, accent, 0.25, D_LIGHT);

    // floating dust motes
    this.dustMotes(accent);

    // player
    this.player = new PlayerController(this, this.exit.x, this.exit.y - 74);
    this.physics.add.collider(this.player.sprite, this.solids);

    this.cameras.main.setBounds(0, 0, ROOM_W, ROOM_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.15, 0.15);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.roundPixels = true;
    this.cameras.main.fadeIn(280);

    // cinematic post-processing
    const fx = this.cameras.main.postFX;
    if (fx) {
      fx.addVignette(0.5, 0.5, 0.78, 0.45);
      fx.addBloom(0xffffff, 1, 1, 1, 0.7, 4);
    }

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
        this.popText(this.player.sprite.x, this.player.sprite.y - 40, `+${bonus.xp} خبرة`, '#00c17a');
      });
    }
  }

  // ---------------- room shell ----------------

  private makeGlowTexture() {
    if (this.textures.exists('int-glow')) return;
    const size = 256;
    const tex = this.textures.createCanvas('int-glow', size, size);
    if (!tex) return;
    const ctx = tex.getContext();
    const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.5, 'rgba(255,255,255,0.45)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }

  private addGlow(x: number, y: number, w: number, h: number, tint: number, alpha: number, depth: number) {
    this.add
      .image(x, y, 'int-glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(tint)
      .setAlpha(alpha)
      .setDisplaySize(w, h)
      .setDepth(depth);
  }

  private buildFloor(theme: (typeof THEMES)[StationId], accent: number) {
    const g = this.add.graphics().setDepth(D_FLOOR);
    const T = 40;
    for (let y = 56; y < ROOM_H; y += T) {
      for (let x = 0; x < ROOM_W; x += T) {
        const even = (x / T + y / T) % 2 === 0;
        g.fillStyle(even ? theme.floor : theme.floor2, 1).fillRect(x, y, T, T);
        // soft top-left sheen on each tile
        g.fillStyle(0xffffff, 0.04).fillRect(x + 1, y + 1, T - 2, 3);
        g.fillStyle(0xffffff, 0.03).fillRect(x + 1, y + 1, 3, T - 2);
      }
    }
    // grout grid
    g.lineStyle(1, theme.grout, 0.5);
    for (let x = 0; x <= ROOM_W; x += T) g.lineBetween(x, 56, x, ROOM_H);
    for (let y = 56; y <= ROOM_H; y += T) g.lineBetween(0, y, ROOM_W, y);
    // inner ambient occlusion near walls
    const ao = this.add.graphics().setDepth(D_FLOOR + 1);
    ao.fillStyle(0x000000, 0.16).fillRect(0, 56, ROOM_W, 14);
    ao.fillStyle(0x000000, 0.12).fillRect(0, 56, 12, ROOM_H);
    ao.fillStyle(0x000000, 0.12).fillRect(ROOM_W - 12, 56, 12, ROOM_H);
    ao.fillStyle(0x000000, 0.1).fillRect(0, ROOM_H - 12, ROOM_W, 12);
    // big soft center light on the floor
    this.addGlow(ROOM_W / 2, ROOM_H / 2 + 40, 760, 520, accent, 0.05, D_FLOOR + 2);
  }

  private buildWall(theme: (typeof THEMES)[StationId], accent: number) {
    const g = this.add.graphics().setDepth(D_FLOOR + 3);
    // vertical gradient via stacked bands
    const top = Phaser.Display.Color.IntegerToColor(theme.wallTop);
    const bot = Phaser.Display.Color.IntegerToColor(theme.wallBot);
    for (let i = 0; i < 56; i += 2) {
      const t = i / 56;
      const r = Math.round(top.red + (bot.red - top.red) * t);
      const gg = Math.round(top.green + (bot.green - top.green) * t);
      const bb = Math.round(top.blue + (bot.blue - top.blue) * t);
      g.fillStyle(Phaser.Display.Color.GetColor(r, gg, bb), 1).fillRect(0, i, ROOM_W, 2);
    }
    // wainscot panelling line + baseboard with accent LED
    g.fillStyle(theme.wainscot, 1).fillRect(0, 40, ROOM_W, 4);
    g.fillStyle(0x000000, 0.3).fillRect(0, 52, ROOM_W, 4);
    g.fillStyle(accent, 0.6).fillRect(0, 56, ROOM_W, 3);
    this.addGlow(ROOM_W / 2, 58, 760, 60, accent, 0.12, D_FLOOR + 4);
  }

  private buildLighting(accent: number) {
    [190, 380, 570].forEach((x) => {
      // pendant lamp fixture
      const lamp = this.add.graphics().setDepth(D_LAMP);
      lamp.fillStyle(0x11141f, 1).fillRect(x - 1, 56, 2, 16);
      lamp.fillStyle(0x2b2d3f, 1).fillRoundedRect(x - 16, 70, 32, 10, 4);
      lamp.fillStyle(WARM, 0.9).fillRoundedRect(x - 13, 76, 26, 4, 2);
      // downward beam + floor pool
      this.add
        .image(x, 80, 'int-glow')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(WARM)
        .setAlpha(0.1)
        .setDisplaySize(150, 360)
        .setOrigin(0.5, 0)
        .setDepth(D_BEAM);
      this.addGlow(x, 300, 280, 360, WARM, 0.06, D_LIGHT - 1);
    });
    void accent;
  }

  private dustMotes(accent: number) {
    for (let i = 0; i < 16; i++) {
      const x = Phaser.Math.Between(60, ROOM_W - 60);
      const y = Phaser.Math.Between(90, ROOM_H - 80);
      const m = this.add.circle(x, y, Phaser.Math.FloatBetween(1, 2.4), i % 3 === 0 ? accent : WARM, 0.5)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(5000);
      this.tweens.add({ targets: m, y: y - Phaser.Math.Between(20, 50), x: x + Phaser.Math.Between(-16, 16), alpha: { from: 0.15, to: 0.6 }, duration: Phaser.Math.Between(3000, 6000), yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: i * 180 });
    }
  }

  // ---------------- furniture & people ----------------

  private addSolid(x: number, y: number, w: number, h: number) {
    const r = this.add.rectangle(x, y, w, h).setVisible(false);
    this.physics.add.existing(r, true);
    this.solids.add(r);
  }

  private addRug(x: number, y: number, w: number, h: number, accent: number, oval = false) {
    const g = this.add.graphics().setDepth(D_RUG);
    g.fillStyle(accent, 0.1);
    if (oval) g.fillEllipse(x, y, w, h);
    else g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
    g.lineStyle(2, accent, 0.22);
    if (oval) g.strokeEllipse(x, y, w, h);
    else g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 18);
    g.lineStyle(1, accent, 0.1);
    if (!oval) g.strokeRoundedRect(x - w / 2 + 10, y - h / 2 + 10, w - 20, h - 20, 14);
  }

  // A seated worker drawn into a container (origin at the chest, facing viewer).
  private drawPerson(c: Phaser.GameObjects.Container) {
    const skin = SKINS[this.pplIdx % SKINS.length];
    const shirt = SHIRTS[this.pplIdx % SHIRTS.length];
    const hair = HAIRS[this.pplIdx % HAIRS.length];
    const skinDark = this.shade(skin, -0.18);
    const shirtDark = this.shade(shirt, -0.2);
    const shirtLite = this.shade(shirt, 0.16);
    this.pplIdx += 1;

    const shadow = this.add.ellipse(0, 24, 34, 11, 0x000000, 0.2);
    const chair = this.add.graphics();
    chair.fillStyle(0x2b3038, 1).fillRoundedRect(-16, -18, 32, 38, 8); // back
    chair.fillStyle(0x3a414d, 1).fillRoundedRect(-13, -15, 26, 30, 6); // cushion
    chair.fillStyle(0x21262e, 1).fillRoundedRect(-18, 14, 36, 11, 5); // seat front
    const body = this.add.graphics();
    body.fillStyle(shirtDark, 1).fillRoundedRect(-14, -3, 28, 26, 10); // torso shade
    body.fillStyle(shirt, 1).fillRoundedRect(-13, -3, 24, 24, 9); // torso
    body.fillStyle(shirtLite, 1).fillRoundedRect(-10, -2, 7, 18, 4); // highlight
    body.fillStyle(shirt, 1).fillRoundedRect(-18, 2, 8, 17, 4); // left arm
    body.fillStyle(shirtDark, 1).fillRoundedRect(10, 2, 8, 17, 4); // right arm
    body.fillStyle(skin, 1).fillCircle(-15, 19, 4).fillCircle(15, 19, 4); // hands
    const neck = this.add.graphics();
    neck.fillStyle(skinDark, 1).fillRoundedRect(-4, -8, 8, 8, 2);
    const head = this.add.circle(0, -14, 8.5, skin);
    const cheek = this.add.circle(2.5, -12, 3.2, this.shade(skin, 0.12), 0.7);
    const hairG = this.add.graphics();
    hairG.fillStyle(hair, 1);
    hairG.fillRoundedRect(-9, -24, 18, 11, 5); // hair cap
    hairG.fillRoundedRect(-9, -16, 4, 6, 2); // sideburn
    hairG.fillRoundedRect(5, -16, 4, 6, 2);
    const face = this.add.container(0, 0, [neck, head, cheek, hairG]);
    this.tweens.add({ targets: face, y: -2, duration: 1500 + this.pplIdx * 90, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    c.add([shadow, chair, body, face]);
  }

  private deskUnit(x: number, y: number, accent: number, item: string, chatty: boolean) {
    const accentLite = this.shade(accent, 0.25);
    // worker behind the desk
    const person = this.add.container(x, y - 20).setDepth(y - 18);
    this.drawPerson(person);

    // desk in front of the worker
    const desk = this.add.graphics().setDepth(y + 26);
    desk.fillStyle(0x000000, 0.22).fillEllipse(x, y + 34, 150, 18); // contact shadow
    desk.fillStyle(0x4a3527, 1).fillRect(x - 56, y + 22, 8, 20).fillRect(x + 48, y + 22, 8, 20); // legs
    desk.fillStyle(0x5a4230, 1).fillRoundedRect(x - 66, y + 16, 132, 10, 4); // front apron
    desk.fillStyle(0x7a5c41, 1).fillRoundedRect(x - 66, y - 6, 132, 26, 7); // top
    desk.fillStyle(0x8a6a4c, 1).fillRoundedRect(x - 66, y - 6, 132, 6, 5); // top sheen
    // monitor
    desk.fillStyle(0x14161f, 1).fillRoundedRect(x - 20, y - 26, 40, 26, 4);
    desk.fillStyle(accent, 0.95).fillRoundedRect(x - 17, y - 23, 34, 20, 2); // screen
    desk.fillStyle(accentLite, 0.9).fillRect(x - 13, y - 19, 16, 3).fillRect(x - 13, y - 13, 24, 3).fillRect(x - 13, y - 7, 12, 3); // ui lines
    desk.fillStyle(0x14161f, 1).fillRect(x - 4, y - 2, 8, 4).fillRoundedRect(x - 10, y + 1, 20, 3, 2); // stand
    // desk props
    desk.fillStyle(0x101019, 1).fillRoundedRect(x - 18, y + 6, 30, 6, 2); // keyboard
    desk.fillStyle(0xe9e3d6, 1).fillRoundedRect(x + 20, y + 4, 14, 12, 2); // papers
    this.add.text(x - 40, y + 4, item, { fontSize: '16px' }).setOrigin(0.5).setDepth(y + 27);
    this.addGlow(x, y - 14, 70, 50, accent, 0.18, D_LIGHT); // screen bloom on desk

    if (chatty) {
      const b = this.add.text(x + 26, y - 40, '💬', { fontSize: '15px' }).setOrigin(0.5).setDepth(y + 40).setAlpha(0);
      this.tweens.add({ targets: b, alpha: { from: 0, to: 1 }, y: y - 50, duration: 700, hold: 1100, yoyo: true, repeat: -1, repeatDelay: 2600, ease: 'Sine.inOut' });
    }

    this.addSolid(x, y + 8, 132, 30);
  }

  private meetingTable(x: number, y: number, accent: number) {
    // colleagues first (behind the table where appropriate)
    [
      { sx: x, sy: y - 76 },
      { sx: x - 104, sy: y + 2 },
      { sx: x + 104, sy: y + 2 },
    ].forEach((s) => {
      const p = this.add.container(s.sx, s.sy).setDepth(s.sy + 2);
      this.drawPerson(p);
    });

    const t = this.add.graphics().setDepth(y + 52);
    t.fillStyle(0x000000, 0.18).fillEllipse(x, y + 40, 210, 30); // shadow
    t.fillStyle(0x5a4230, 1).fillEllipse(x, y + 10, 178, 110); // table side
    t.fillStyle(0x7a5a3f, 1).fillEllipse(x, y, 178, 110); // top
    t.fillStyle(0x8a6a4c, 0.5).fillEllipse(x - 24, y - 18, 90, 40); // sheen
    t.lineStyle(3, accent, 0.55).strokeEllipse(x, y, 178, 110);
    this.add.text(x - 36, y + 2, '☕', { fontSize: '16px' }).setOrigin(0.5).setDepth(y + 53);
    this.add.text(x + 36, y + 2, '📄', { fontSize: '16px' }).setOrigin(0.5).setDepth(y + 53);
    this.add.text(x, y - 6, '💻', { fontSize: '18px' }).setOrigin(0.5).setDepth(y + 53);
    this.addGlow(x, y, 200, 120, accent, 0.08, D_LIGHT);

    this.addSolid(x, y, 150, 78);
  }

  private lounge(x: number, y: number, accent: number) {
    const accentDark = this.shade(accent, -0.25);
    const g = this.add.graphics().setDepth(y + 18);
    g.fillStyle(0x000000, 0.18).fillEllipse(x, y + 24, 130, 18);
    g.fillStyle(accentDark, 1).fillRoundedRect(-56 + x, y - 22, 112, 40, 12); // sofa body
    g.fillStyle(accent, 1).fillRoundedRect(-52 + x, y - 18, 104, 26, 10); // back cushion
    g.fillStyle(this.shade(accent, 0.18), 1).fillRoundedRect(-50 + x, y + 2, 100, 16, 8); // seat cushion
    g.fillStyle(accentDark, 1).fillRoundedRect(-58 + x, y - 14, 10, 30, 5).fillRoundedRect(48 + x, y - 14, 10, 30, 5); // arms
    g.fillStyle(0xffffff, 0.18).fillRoundedRect(x + 16, y - 14, 18, 16, 5); // throw pillow
    // colleague relaxing
    const p = this.add.container(x - 6, y - 8).setDepth(y - 6);
    this.drawPerson(p);
    // coffee table
    this.add.ellipse(x + 78, y + 10, 42, 18, 0x4a3527, 1).setDepth(y + 12);
    this.add.ellipse(x + 78, y + 7, 42, 18, 0x5e4636, 1).setDepth(y + 12);
    this.add.text(x + 78, y + 4, '🍵', { fontSize: '15px' }).setOrigin(0.5).setDepth(y + 13);
    this.addSolid(x, y + 6, 116, 30);
  }

  private drawPlant(x: number, y: number) {
    const g = this.add.graphics().setDepth(y + 12);
    g.fillStyle(0x000000, 0.18).fillEllipse(x, y + 18, 32, 9);
    g.fillStyle(0x6f4424, 1).fillRoundedRect(x - 12, y + 2, 24, 18, 4); // pot
    g.fillStyle(0x8a5a2b, 1).fillRoundedRect(x - 12, y + 2, 24, 5, 3); // rim
    this.add.text(x, y - 8, '🪴', { fontSize: '28px' }).setOrigin(0.5).setDepth(y + 13);
    this.addSolid(x, y + 10, 26, 16);
  }

  private drawWindow(x: number, y: number, accent: number) {
    const g = this.add.graphics().setDepth(y);
    g.fillStyle(0x0d1422, 1).fillRoundedRect(x - 38, y - 17, 76, 36, 5);
    g.fillStyle(0x1d3a5c, 1).fillRect(x - 33, y - 12, 66, 27); // sky
    g.fillStyle(0x16314f, 1).fillRect(x - 33, y - 2, 66, 17); // horizon
    g.fillStyle(0x274b73, 1);
    [-28, -16, -2, 12, 24].forEach((bx, i) => g.fillRect(x + bx, y - 6 + (i % 2) * 5, 11, 20)); // skyline
    g.fillStyle(accent, 0.85).fillCircle(x + 22, y - 7, 4); // sun/moon
    this.addGlow(x, y, 80, 40, accent, 0.12, y - 1);
    g.lineStyle(3, 0x3a3d52, 1).strokeRoundedRect(x - 38, y - 17, 76, 36, 5);
    g.lineStyle(2, 0x3a3d52, 1).lineBetween(x, y - 15, x, y + 17).lineBetween(x - 36, y, x + 36, y);
  }

  private drawFramedArt(x: number, y: number, glyph: string, accent: number) {
    const g = this.add.graphics().setDepth(y);
    g.fillStyle(0x0d1019, 0.85).fillRoundedRect(x - 24, y - 20, 48, 40, 5);
    g.lineStyle(3, accent, 1).strokeRoundedRect(x - 24, y - 20, 48, 40, 5);
    this.add.text(x, y, glyph, { fontSize: '26px' }).setOrigin(0.5).setDepth(y + 1);
  }

  private drawClock(x: number, y: number) {
    const g = this.add.graphics().setDepth(y);
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
      base.fillStyle(0x5a3a1b, 1).fillRoundedRect(-15, -16, 30, 8, 3);
      base.fillStyle(0xffd23f, 0.8).fillRect(-8, -8, 16, 3);
    } else {
      base.fillStyle(0x9a6630, 1).fillRoundedRect(-15, -8, 30, 18, 4);
      base.fillStyle(0xb87a3a, 1).fillRoundedRect(-15, -16, 30, 10, 4);
      base.fillStyle(0xffd23f, 1).fillRect(-3, -10, 6, 6);
    }
    c.add(base);
  }

  private shade(color: number, amt: number): number {
    const c = Phaser.Display.Color.IntegerToColor(color);
    const f = (v: number) => Phaser.Math.Clamp(Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt)), 0, 255);
    return Phaser.Display.Color.GetColor(f(c.red), f(c.green), f(c.blue));
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
    this.player.sprite.setDepth(py + 20); // y-sort against furniture

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
    const t = this.add.text(x, y - 20, label, { fontFamily: 'monospace', fontSize: '16px', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(9000);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }
}
