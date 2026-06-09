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
    nameAr: 'برج الترقيات',
    hintAr: 'تابع مسارك المهني واطلب الترقية',
    x: 700,
    y: 300,
    signY: 40,
    color: '#ffbc0a',
    glyph: '🏙️',
  },
  {
    id: 'arena',
    nameAr: 'ساحة التقييم',
    hintAr: 'اختبر مهاراتك في نزالات معرفية',
    x: 560,
    y: 575,
    signY: 412,
    color: '#00c17a',
    glyph: '⚔️',
  },
  {
    id: 'quests',
    nameAr: 'مركز المهام',
    hintAr: 'أكمل مهام التطوير واكسب الخبرة',
    x: 660,
    y: 880,
    signY: 700,
    color: '#0072f9',
    glyph: '📋',
  },
  {
    id: 'leaderboard',
    nameAr: 'قاعة الصدارة',
    hintAr: 'قارن ترتيبك واستعرض أوسمتك',
    x: 270,
    y: 1165,
    signY: 985,
    color: '#82003a',
    glyph: '🏆',
  },
  {
    id: 'org',
    nameAr: 'المقر — الهيكل التنظيمي',
    hintAr: 'تعرّف على فريق الشركة وموقعك فيه',
    x: 230,
    y: 300,
    signY: 150,
    color: '#2b2d3f',
    glyph: '🏢',
  },
];
