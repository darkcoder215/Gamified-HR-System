export const TILE = 32;
// Tuxemon town map is 40x40 tiles → 1280x1280 world.
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 1280;

export const PLAYER_SPEED = 200;
export const SPAWN = { x: 352, y: 1216 };

// Default character: the classic "misa" 4-direction RPG atlas (open-licensed).
// Frames ~30x43, JSON-Hash atlas. Idle frame + 4-frame walk per direction.
export const PLAYER = {
  key: 'player',
  texturePath: '/game/tuxemon/atlas.png',
  atlasPath: '/game/tuxemon/atlas.json',
};

export const PLAYER_ANIMS = {
  down: { idle: 'misa-front', walkPrefix: 'misa-front-walk.' },
  up: { idle: 'misa-back', walkPrefix: 'misa-back-walk.' },
  left: { idle: 'misa-left', walkPrefix: 'misa-left-walk.' },
  right: { idle: 'misa-right', walkPrefix: 'misa-right-walk.' },
} as const;

export const TILEMAP = {
  key: 'town',
  path: '/game/tuxemon/town.json',
  tilesetName: 'tuxmon-sample-32px-extruded', // name as defined inside the Tiled map
  tilesetKey: 'tiles',
  tilesetPath: '/game/tuxemon/tileset.png',
  layers: { below: 'Below Player', world: 'World', above: 'Above Player' },
};
