import type { StationId } from '@/types';

export interface StationDef {
  id: StationId;
  nameAr: string;
  hintAr: string;
  x: number; // world pixel center
  y: number;
  color: string; // pad accent
  glyph: string; // emoji marker drawn in canvas (icon, not Arabic text)
}

// World is 1280 x 960 (40x30 tiles of 32px). Stations are spread around a campus.
export const stations: StationDef[] = [
  {
    id: 'arena',
    nameAr: 'ساحة التقييم',
    hintAr: 'اختبر مهاراتك في نزالات معرفية',
    x: 280,
    y: 240,
    color: '#00c17a',
    glyph: '⚔️',
  },
  {
    id: 'quests',
    nameAr: 'لوحة المهام',
    hintAr: 'أكمل مهام التطوير واكسب الخبرة',
    x: 1000,
    y: 240,
    color: '#0072f9',
    glyph: '📋',
  },
  {
    id: 'career',
    nameAr: 'برج الترقيات',
    hintAr: 'تابع مسارك المهني واطلب الترقية',
    x: 280,
    y: 720,
    color: '#ffbc0a',
    glyph: '🏯',
  },
  {
    id: 'leaderboard',
    nameAr: 'قاعة الصدارة',
    hintAr: 'قارن ترتيبك واستعرض أوسمتك',
    x: 1000,
    y: 720,
    color: '#82003a',
    glyph: '🏆',
  },
];
