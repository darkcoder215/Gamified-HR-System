import type { Badge } from '@/types';

export const badges: Badge[] = [
  {
    id: 'first-steps',
    nameAr: 'First Steps',
    descAr: 'You completed your first assessment on the platform.',
    icon: '🌱',
    color: '#b2e2ba',
    rule: { type: 'assessmentCount', value: 1 },
  },
  {
    id: 'sharp-mind',
    nameAr: 'Sharp Mind',
    descAr: 'You aced an assessment with no mistakes.',
    icon: '🎯',
    color: '#00c17a',
    rule: { type: 'perfectAssessment' },
  },
  {
    id: 'quest-starter',
    nameAr: 'Quest Starter',
    descAr: 'You completed your first development quest.',
    icon: '🧭',
    color: '#0072f9',
    rule: { type: 'questCount', value: 1 },
  },
  {
    id: 'quest-master',
    nameAr: 'Quest Master',
    descAr: 'You completed five development quests.',
    icon: '🏅',
    color: '#ffbc0a',
    rule: { type: 'questCount', value: 5 },
  },
  {
    id: 'rising-star',
    nameAr: 'Rising Star',
    descAr: 'You reached level three.',
    icon: '⭐',
    color: '#ff9172',
    rule: { type: 'level', value: 3 },
  },
  {
    id: 'xp-500',
    nameAr: 'XP Collector',
    descAr: 'You surpassed 500 XP.',
    icon: '💎',
    color: '#84dbe5',
    rule: { type: 'xp', value: 500 },
  },
  {
    id: 'leader-elite',
    nameAr: 'Promising Leader',
    descAr: 'You mastered the leadership track.',
    icon: '👑',
    color: '#82003a',
    rule: { type: 'quest', questId: 'quest-lead-1' },
  },
  {
    id: 'promoted',
    nameAr: 'First Promotion',
    descAr: 'You earned your first promotion on your career path.',
    icon: '🚀',
    color: '#ff00b7',
    rule: { type: 'promotion' },
  },
];

export const getBadge = (id: string): Badge | undefined => badges.find((b) => b.id === id);
