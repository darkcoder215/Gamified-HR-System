import type { StationId } from '@/types';

export interface StationDef {
  id: StationId;
  nameAr: string;
  hintAr: string;
  x: number; // world pixel — the walkable spot in front of the building's door
  y: number;
  signY: number; // world pixel Y where the floating marker hovers (above the roof)
  color: string;
  glyph: string; // emoji marker (safe to render in the canvas)
}

// Placed in front of four distinct, thematically-fitting buildings in the
// Tuxemon town (verified walkable, see plan).
export const stations: StationDef[] = [
  {
    id: 'career',
    nameAr: 'Promotions Tower',
    hintAr: 'Track your career path and request a promotion',
    x: 700,
    y: 300,
    signY: 40,
    color: '#ffbc0a',
    glyph: '🏙️',
  },
  {
    id: 'arena',
    nameAr: 'Assessment Arena',
    hintAr: 'Test your skills in knowledge battles',
    x: 560,
    y: 575,
    signY: 412,
    color: '#00c17a',
    glyph: '⚔️',
  },
  {
    id: 'quests',
    nameAr: 'Quests Hub',
    hintAr: 'Complete development quests and earn XP',
    x: 660,
    y: 880,
    signY: 700,
    color: '#0072f9',
    glyph: '📋',
  },
  {
    id: 'leaderboard',
    nameAr: 'Leaderboard Hall',
    hintAr: 'Compare your ranking and browse your badges',
    x: 270,
    y: 1165,
    signY: 985,
    color: '#82003a',
    glyph: '🏆',
  },
  {
    id: 'org',
    nameAr: 'Headquarters — Org Chart',
    hintAr: 'Get to know the company team and your place in it',
    x: 230,
    y: 300,
    signY: 150,
    color: '#2b2d3f',
    glyph: '🏢',
  },
];
