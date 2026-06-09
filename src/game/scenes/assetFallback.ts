import Phaser from 'phaser';

// Programmatically generated textures so the world always renders even with
// zero binary assets. Drop real art into /public/game/ later to upgrade.

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color;

export function generateGroundTextures(scene: Phaser.Scene) {
  // Lawn tile — soft mint with subtle blades
  let g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(hex('#cfe8d6'));
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(hex('#bfe0c9'));
  g.fillRect(4, 6, 3, 3);
  g.fillRect(20, 14, 3, 3);
  g.fillRect(12, 24, 3, 3);
  g.fillStyle(hex('#d8eede'));
  g.fillRect(26, 4, 2, 2);
  g.fillRect(8, 18, 2, 2);
  g.generateTexture('tile-grass', 32, 32);
  g.destroy();

  // Path tile — warm cream plaza with faint speckle
  g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(hex('#f4f2ed'));
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(hex('#ece8df'));
  g.fillRect(0, 0, 32, 1);
  g.fillRect(0, 0, 1, 32);
  g.fillStyle(hex('#efece4'));
  g.fillRect(9, 12, 2, 2);
  g.fillRect(22, 22, 2, 2);
  g.generateTexture('tile-path', 32, 32);
  g.destroy();
}

export function generateTreeTexture(scene: Phaser.Scene) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // trunk
  g.fillStyle(hex('#8a5a36'));
  g.fillRect(20, 40, 8, 16);
  // foliage layers
  g.fillStyle(hex('#2f9e6a'));
  g.fillCircle(24, 24, 20);
  g.fillStyle(hex('#3fb87f'));
  g.fillCircle(18, 20, 13);
  g.fillStyle(hex('#5fcf97'));
  g.fillCircle(30, 18, 11);
  g.generateTexture('tree', 48, 58);
  g.destroy();
}

export function generateRockTexture(scene: Phaser.Scene) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(hex('#b9b4a9'));
  g.fillRoundedRect(2, 8, 28, 18, 8);
  g.fillStyle(hex('#cfcabf'));
  g.fillRoundedRect(6, 6, 16, 10, 6);
  g.generateTexture('rock', 32, 30);
  g.destroy();
}

// A station pavilion: a rounded plinth in the station color with a roof.
export function generateStationTexture(scene: Phaser.Scene, id: string, color: string) {
  const key = `station-${id}`;
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const c = hex(color);
  // glow pad
  g.fillStyle(c, 0.18);
  g.fillCircle(48, 70, 46);
  // plinth
  g.fillStyle(hex('#ffffff'));
  g.fillRoundedRect(18, 44, 60, 44, 12);
  g.lineStyle(3, c, 1);
  g.strokeRoundedRect(18, 44, 60, 44, 12);
  // roof
  g.fillStyle(c, 1);
  g.fillTriangle(10, 46, 86, 46, 48, 12);
  g.fillStyle(hex('#000000'), 0.12);
  g.fillTriangle(48, 12, 86, 46, 48, 46);
  // door
  g.fillStyle(c, 0.85);
  g.fillRoundedRect(40, 60, 16, 28, 4);
  g.generateTexture(key, 96, 96);
  g.destroy();
  return key;
}

const SKIN = '#f1c9a5';
const HAIR = '#3a2a1a';
const PANTS = '#2b2d3f';
const SHOES = '#15161f';

function drawCharacter(
  g: Phaser.GameObjects.Graphics,
  dir: 'down' | 'up' | 'left' | 'right',
  frame: 0 | 1,
  shirt: number
) {
  g.clear();
  const legLift = frame === 0 ? 0 : 1;
  // shadow
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(16, 46, 22, 6);
  // legs (alternate for walk)
  g.fillStyle(hex(PANTS));
  g.fillRect(10, 34 - legLift, 5, 9 + legLift);
  g.fillRect(17, 34 + legLift, 5, 9 - legLift);
  // shoes
  g.fillStyle(hex(SHOES));
  g.fillRect(10, 42 - legLift, 5, 3);
  g.fillRect(17, 42 + legLift, 5, 3);
  // body / shirt
  g.fillStyle(shirt);
  g.fillRoundedRect(8, 20, 16, 16, 5);
  // arms
  g.fillStyle(shirt);
  g.fillRoundedRect(5, 21, 4, 11, 2);
  g.fillRoundedRect(23, 21, 4, 11, 2);
  // head
  g.fillStyle(hex(SKIN));
  g.fillCircle(16, 13, 9);
  // hair
  g.fillStyle(hex(HAIR));
  if (dir === 'up') {
    g.fillCircle(16, 13, 9); // full back of head
  } else {
    g.fillRect(7, 5, 18, 6);
    g.fillCircle(16, 7, 9);
    g.fillStyle(hex(SKIN));
    g.fillRect(9, 11, 14, 8); // face area
  }
  // eyes per direction
  g.fillStyle(0x1a1a1a);
  if (dir === 'down') {
    g.fillRect(12, 13, 2, 2);
    g.fillRect(18, 13, 2, 2);
  } else if (dir === 'left') {
    g.fillRect(11, 13, 2, 2);
  } else if (dir === 'right') {
    g.fillRect(19, 13, 2, 2);
  }
}

export function generatePlayerTextures(scene: Phaser.Scene, shirtColor = '#0072f9') {
  const shirt = hex(shirtColor);
  const dirs: Array<'down' | 'up' | 'left' | 'right'> = ['down', 'up', 'left', 'right'];
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (const dir of dirs) {
    for (const frame of [0, 1] as const) {
      drawCharacter(g, dir, frame, shirt);
      g.generateTexture(`pc-${dir}-${frame}`, 32, 48);
    }
  }
  g.destroy();
}
