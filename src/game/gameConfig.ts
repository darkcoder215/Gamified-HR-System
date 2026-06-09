export const TILE = 32;
export const WORLD_COLS = 40;
export const WORLD_ROWS = 30;
export const WORLD_WIDTH = TILE * WORLD_COLS; // 1280
export const WORLD_HEIGHT = TILE * WORLD_ROWS; // 960

export const PLAYER_SPEED = 220;

// Frame layout for a swappable player spritesheet at /game/player.png.
// To use real character art, drop in player.png matching this grid
// (columns = walk frames, rows = down/left/right/up) and adjust here if needed.
export const PLAYER_SPRITE_CONFIG = {
  path: '/game/player.png',
  frameWidth: 32,
  frameHeight: 48,
  framesPerRow: 4,
  rows: ['down', 'left', 'right', 'up'] as const,
};
