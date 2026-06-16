import type { StationId } from '@/types';

export interface Zone {
  id: string;
  nameAr: string;
  descAr: string;
  unlockLevel: number;
  stations: StationId[];
  color: string;
  glyph: string;
}

// Districts that progressively unlock as the player levels up.
export const zones: Zone[] = [
  {
    id: 'd1',
    nameAr: 'Starter District',
    descAr: 'Your launch: test your skills and complete your first quests.',
    unlockLevel: 1,
    stations: ['arena', 'quests'],
    color: '#00c17a',
    glyph: '🌱',
  },
  {
    id: 'd2',
    nameAr: 'Team District',
    descAr: 'Get to know the company team and compete with your peers for the leaderboard.',
    unlockLevel: 3,
    stations: ['org', 'leaderboard'],
    color: '#0072f9',
    glyph: '🤝',
  },
  {
    id: 'd3',
    nameAr: 'Leadership District',
    descAr: 'The road to the top — request your promotion and climb the leadership tower.',
    unlockLevel: 5,
    stations: ['career'],
    color: '#ffbc0a',
    glyph: '👑',
  },
];

const stationZoneMap: Record<string, Zone> = {};
for (const z of zones) for (const s of z.stations) stationZoneMap[s] = z;

export const zoneForStation = (id: StationId): Zone | undefined => stationZoneMap[id];

export const stationUnlockLevel = (id: StationId): number => stationZoneMap[id]?.unlockLevel ?? 1;

export const isStationUnlocked = (id: StationId, level: number): boolean =>
  level >= stationUnlockLevel(id);

export const lockedStationIds = (level: number): StationId[] =>
  zones.flatMap((z) => (level < z.unlockLevel ? z.stations : []));
