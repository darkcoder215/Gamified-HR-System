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
    nameAr: 'حي البداية',
    descAr: 'انطلاقتك: اختبر مهاراتك وأكمل أولى مهامك.',
    unlockLevel: 1,
    stations: ['arena', 'quests'],
    color: '#00c17a',
    glyph: '🌱',
  },
  {
    id: 'd2',
    nameAr: 'حي الفريق',
    descAr: 'تعرّف على فريق الشركة ونافس زملاءك على الصدارة.',
    unlockLevel: 3,
    stations: ['org', 'leaderboard'],
    color: '#0072f9',
    glyph: '🤝',
  },
  {
    id: 'd3',
    nameAr: 'حي القيادة',
    descAr: 'الطريق إلى القمّة — اطلب ترقيتك وتسلّق برج القيادة.',
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
