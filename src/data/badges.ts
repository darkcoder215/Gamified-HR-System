import type { Badge } from '@/types';

export const badges: Badge[] = [
  {
    id: 'first-steps',
    nameAr: 'الخطوات الأولى',
    descAr: 'أكملت أوّل تقييم لك في المنصّة.',
    icon: '🌱',
    color: '#b2e2ba',
    rule: { type: 'assessmentCount', value: 1 },
  },
  {
    id: 'sharp-mind',
    nameAr: 'العقل المتّقد',
    descAr: 'حقّقت تقييمًا كاملًا بلا أخطاء.',
    icon: '🎯',
    color: '#00c17a',
    rule: { type: 'perfectAssessment' },
  },
  {
    id: 'quest-starter',
    nameAr: 'باشر المسيرة',
    descAr: 'أكملت أوّل مهمّة تطويرية.',
    icon: '🧭',
    color: '#0072f9',
    rule: { type: 'questCount', value: 1 },
  },
  {
    id: 'quest-master',
    nameAr: 'سيّد المهام',
    descAr: 'أكملت خمس مهام تطويرية.',
    icon: '🏅',
    color: '#ffbc0a',
    rule: { type: 'questCount', value: 5 },
  },
  {
    id: 'rising-star',
    nameAr: 'النجم الصاعد',
    descAr: 'بلغت المستوى الثالث.',
    icon: '⭐',
    color: '#ff9172',
    rule: { type: 'level', value: 3 },
  },
  {
    id: 'xp-500',
    nameAr: 'جامع الخبرة',
    descAr: 'تجاوزت 500 نقطة خبرة.',
    icon: '💎',
    color: '#84dbe5',
    rule: { type: 'xp', value: 500 },
  },
  {
    id: 'leader-elite',
    nameAr: 'القائد الواعد',
    descAr: 'أتقنت مسار القيادة.',
    icon: '👑',
    color: '#82003a',
    rule: { type: 'quest', questId: 'quest-lead-1' },
  },
  {
    id: 'promoted',
    nameAr: 'أوّل ترقية',
    descAr: 'حصلت على أوّل ترقية في مسارك المهني.',
    icon: '🚀',
    color: '#ff00b7',
    rule: { type: 'promotion' },
  },
];

export const getBadge = (id: string): Badge | undefined => badges.find((b) => b.id === id);
