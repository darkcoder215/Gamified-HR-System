export interface DailyState {
  date: string; // YYYY-MM-DD
  assess: number;
  quests: number;
  talk: boolean;
  xp: number;
  claimed: boolean;
}

export interface DailyChallenge {
  id: string;
  labelAr: string;
  target: number;
  done: (d: DailyState) => boolean;
  current: (d: DailyState) => number;
}

export const dailies: DailyChallenge[] = [
  { id: 'assess', labelAr: 'أكمل تقييمين اليوم', target: 2, done: (d) => d.assess >= 2, current: (d) => Math.min(d.assess, 2) },
  { id: 'xp', labelAr: 'اكسب 150 نقطة خبرة اليوم', target: 150, done: (d) => d.xp >= 150, current: (d) => Math.min(d.xp, 150) },
  { id: 'talk', labelAr: 'تحدّث مع أحد الزملاء', target: 1, done: (d) => d.talk, current: (d) => (d.talk ? 1 : 0) },
];

export const DAILY_REWARD = { coins: 60, xp: 120 };

export const freshDaily = (date: string): DailyState => ({
  date,
  assess: 0,
  quests: 0,
  talk: false,
  xp: 0,
  claimed: false,
});

export const allDailiesDone = (d: DailyState): boolean => dailies.every((c) => c.done(d));
