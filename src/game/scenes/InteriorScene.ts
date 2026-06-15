import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { stations } from '../stations/stationZones';
import type { StationId } from '@/types';
import PlayerController from '../player/PlayerController';
import { useGameStore } from '@/state/store';
import { sfx } from '@/audio/sound';

const ROOM_W = 760;
const ROOM_H = 560;

// Per-building interior theming. Each room has a centerpiece activity (opens the
// matching panel) + collectible coin chests + decorative props.
const THEMES: Record<StationId, { floor: number; floor2: number; wall: number; accent: string; glyph: string; props: { g: string; x: number; y: number }[] }> = {
  arena: { floor: 0x6a513a, floor2: 0x5a4530, wall: 0x2b2d3f, accent: '#00c17a', glyph: '⚔️', props: [{ g: '🎯', x: 150, y: 200 }, { g: '🛡️', x: 610, y: 200 }, { g: '🔥', x: 120, y: 420 }, { g: '🔥', x: 640, y: 420 }] },
  quests: { floor: 0x7a6648, wall: 0x1f3a5f, floor2: 0x6c5a40, accent: '#0072f9', glyph: '📋', props: [{ g: '🗂️', x: 150, y: 210 }, { g: '🖥️', x: 610, y: 210 }, { g: '🪴', x: 120, y: 430 }, { g: '📚', x: 640, y: 430 }] },
  career: { floor: 0x7a6a52, wall: 0x3a2e10, floor2: 0x6b5c46, accent: '#ffbc0a', glyph: '🏙️', props: [{ g: '🏆', x: 150, y: 210 }, { g: '📈', x: 610, y: 210 }, { g: '🛗', x: 120, y: 430 }, { g: '🪴', x: 640, y: 430 }] },
  leaderboard: { floor: 0x6b4a3a, wall: 0x3a0e22, floor2: 0x5e4030, accent: '#82003a', glyph: '🏆', props: [{ g: '🥇', x: 150, y: 210 }, { g: '🥈', x: 610, y: 210 }, { g: '🥉', x: 120, y: 430 }, { g: '✨', x: 640, y: 430 }] },
  org: { floor: 0x5a5a66, wall: 0x1c2230, floor2: 0x50505c, accent: '#84dbe5', glyph: '🏢', props: [{ g: '🖥️', x: 150, y: 210 }, { g: '🪴', x: 610, y: 210 }, { g: '📊', x: 120, y: 430 }, { g: '👥', x: 640, y: 430 }] },
};
const CHEST_COINS = 25;
const GEM_COINS = 50;

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

  constructor() {
    super('Interior');
  }

  create(data: { stationId: StationId }) {
    this.stationId = data.stationId;
    this.chests = [];
    this.focus = null;
    this.paused = false;
    this.mobileVec.set(0, 0);
    const theme = THEMES[this.stationId];
    const st = stations.find((s) => s.id === this.stationId)!;
    const accent = Phaser.Display.Color.HexStringToColor(theme.accent).color;

    this.physics.world.setBounds(0, 0, ROOM_W, ROOM_H);

    // floor (checker) + walls
    const g = this.add.graphics().setDepth(0);
    for (let y = 0; y < ROOM_H; y += 40) {
      for (let x = 0; x < ROOM_W; x += 40) {
        g.fillStyle((x / 40 + y / 40) % 2 === 0 ? theme.floor : theme.floor2, 1);
        g.fillRect(x, y, 40, 40);
      }
    }
    g.fillStyle(theme.wall, 1).fillRect(0, 0, ROOM_W, 56); // back wall
    g.fillStyle(accent, 0.25).fillRect(0, 52, ROOM_W, 6);

    // collision walls (invisible)
    const walls = this.physics.add.staticGroup();
    const addWall = (x: number, y: number, w: number, h: number) => {
      const r = this.add.rectangle(x, y, w, h).setVisible(false);
      this.physics.add.existing(r, true);
      walls.add(r);
    };
    addWall(ROOM_W / 2, 28, ROOM_W, 56);
    addWall(ROOM_W / 2, ROOM_H - 4, ROOM_W, 8);
    addWall(4, ROOM_H / 2, 8, ROOM_H);
    addWall(ROOM_W - 4, ROOM_H / 2, 8, ROOM_H);

    // wall sign
    this.add.text(ROOM_W / 2, 28, theme.glyph, { fontSize: '28px' }).setOrigin(0.5).setDepth(1);

    // decorative props
    for (const p of theme.props) {
      this.add.text(p.x, p.y, p.g, { fontSize: '30px' }).setOrigin(0.5).setDepth(2);
      this.add.ellipse(p.x, p.y + 20, 30, 8, 0x000000, 0.18).setDepth(1);
    }

    // activity centerpiece (pedestal + glowing glyph)
    this.activity = { x: ROOM_W / 2, y: 160 };
    const halo = this.add.circle(this.activity.x, this.activity.y, 40, accent, 0.18).setDepth(2);
    this.tweens.add({ targets: halo, scale: 1.25, alpha: 0.3, duration: 1300, yoyo: true, repeat: -1 });
    this.add.rectangle(this.activity.x, this.activity.y + 26, 64, 16, 0x000000, 0.25).setDepth(2);
    this.add.text(this.activity.x, this.activity.y, theme.glyph, { fontSize: '46px' }).setOrigin(0.5).setDepth(3);
    const ring = this.add.circle(this.activity.x, this.activity.y, 30, accent, 0).setStrokeStyle(3, accent, 0.7).setDepth(3);
    this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 1600, repeat: -1 });

    // chests
    const opened = useGameStore.getState().chestsOpened;
    const chestSpots = [{ x: 110, y: 320 }, { x: ROOM_W - 110, y: 320 }];
    chestSpots.forEach((spot, i) => {
      const key = `${this.stationId}:c${i}`;
      const isOpen = !!opened[key];
      const c = this.add.container(spot.x, spot.y).setDepth(4);
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
      const c = this.add.container(gx, gy).setDepth(4).setVisible(!gemFound);
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
    this.exit = { x: ROOM_W / 2, y: ROOM_H - 40 };
    this.add.rectangle(this.exit.x, this.exit.y, 56, 60, 0x111421, 1).setDepth(2);
    this.add.rectangle(this.exit.x, this.exit.y, 48, 52, accent, 0.9).setDepth(2);
    this.add.text(this.exit.x, this.exit.y, '🚪', { fontSize: '30px' }).setOrigin(0.5).setDepth(3);

    // player at door
    this.player = new PlayerController(this, this.exit.x, this.exit.y - 60);
    this.physics.add.collider(this.player.sprite, walls);

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
    else if (dAct < 76 * 76) f = 'activity';
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
