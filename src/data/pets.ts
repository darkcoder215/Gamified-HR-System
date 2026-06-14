// Companion pets (prizes) — flying/moving creatures unlocked by real success.
export interface Pet {
  id: string;
  nameAr: string;
  emoji: string;
  color: string;
  rarity: 'شائع' | 'نادر' | 'أسطوري';
  descAr: string;
  rule:
    | { type: 'level'; value: number }
    | { type: 'xp'; value: number }
    | { type: 'streak'; value: number }
    | { type: 'badges'; value: number }
    | { type: 'rank'; value: number } // top-N on leaderboard
    | { type: 'promotion' };
}

export interface PetMetrics {
  level: number;
  xp: number;
  streak: number;
  badges: number;
  currentRung: number;
  rank: number; // 1-based; large if unknown
}

export const pets: Pet[] = [
  { id: 'bee', nameAr: 'النحلة المجتهدة', emoji: '🐝', color: '#ffbc0a', rarity: 'شائع', descAr: 'تُمنح عند بلوغ المستوى الثاني.', rule: { type: 'level', value: 2 } },
  { id: 'butterfly', nameAr: 'فراشة المثابرة', emoji: '🦋', color: '#84dbe5', rarity: 'شائع', descAr: 'حافظ على سلسلة ٣ أيام.', rule: { type: 'streak', value: 3 } },
  { id: 'bird', nameAr: 'العصفور المنطلق', emoji: '🐦', color: '#0072f9', rarity: 'نادر', descAr: 'تجاوز ٥٠٠ نقطة خبرة.', rule: { type: 'xp', value: 500 } },
  { id: 'owl', nameAr: 'بومة الحكمة', emoji: '🦉', color: '#82003a', rarity: 'نادر', descAr: 'افتح ٥ أوسمة.', rule: { type: 'badges', value: 5 } },
  { id: 'eagle', nameAr: 'صقر الصدارة', emoji: '🦅', color: '#2b2d3f', rarity: 'أسطوري', descAr: 'ادخل أفضل ٣ في لوحة الصدارة.', rule: { type: 'rank', value: 3 } },
  { id: 'unicorn', nameAr: 'وحيد القرن', emoji: '🦄', color: '#ff00b7', rarity: 'أسطوري', descAr: 'احصل على أول ترقية.', rule: { type: 'promotion' } },
  { id: 'dragon', nameAr: 'تنين القيادة', emoji: '🐉', color: '#00c17a', rarity: 'أسطوري', descAr: 'ابلغ المستوى الخامس.', rule: { type: 'level', value: 5 } },
];

export const getPet = (id: string | null | undefined): Pet | undefined => (id ? pets.find((p) => p.id === id) : undefined);

export function petUnlocked(p: Pet, m: PetMetrics): boolean {
  switch (p.rule.type) {
    case 'level': return m.level >= p.rule.value;
    case 'xp': return m.xp >= p.rule.value;
    case 'streak': return m.streak >= p.rule.value;
    case 'badges': return m.badges >= p.rule.value;
    case 'rank': return m.rank <= p.rule.value;
    case 'promotion': return m.currentRung > 1;
    default: return false;
  }
}

export const earnedPetIds = (m: PetMetrics): string[] => pets.filter((p) => petUnlocked(p, m)).map((p) => p.id);
