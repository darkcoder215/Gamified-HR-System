import type { StationId } from '@/types';

export interface BuildingGuide {
  id: StationId;
  glyph: string;
  nameAr: string;
  color: string;
  whatAr: string; // what it does
  benefitAr: string; // how the user benefits
}

export const buildingGuides: BuildingGuide[] = [
  {
    id: 'arena',
    glyph: '⚔️',
    nameAr: 'Assessment Arena',
    color: '#00c17a',
    whatAr: 'Knowledge-question battles in each skill; every correct answer grants you XP while a wrong one drains your energy.',
    benefitAr: 'You raise your skill assessments required for promotion, and earn quick XP to level up.',
  },
  {
    id: 'quests',
    glyph: '📋',
    nameAr: 'Quest Hub',
    color: '#0072f9',
    whatAr: 'Multi-step development quests spread across learning tracks for each skill.',
    benefitAr: 'You build real development habits, and unlock badges and extra XP each time you complete a quest.',
  },
  {
    id: 'career',
    glyph: '🏙️',
    nameAr: 'Promotions Tower',
    color: '#ffbc0a',
    whatAr: 'Shows your career path and each rank\'s thresholds and requirements, along with the promotion request and manager approval.',
    benefitAr: 'You clearly see what you\'re missing for the next promotion, and advance in your job title.',
  },
  {
    id: 'leaderboard',
    glyph: '🏆',
    nameAr: 'Leaderboard Hall',
    color: '#82003a',
    whatAr: 'Ranks employees by XP, plus the collection of badges you\'ve earned.',
    benefitAr: 'You measure where you stand among your peers and get motivated to compete and collect badges.',
  },
  {
    id: 'org',
    glyph: '🏢',
    nameAr: 'Headquarters — Org Chart',
    color: '#2b2d3f',
    whatAr: 'Shows the POWR team as characters arranged across the org chart ranks.',
    benefitAr: 'You understand the company structure, your current position in it, and where you\'re headed with each promotion.',
  },
];
