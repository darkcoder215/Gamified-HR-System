// Companion pets (prizes) — flying/moving creatures unlocked by real success.
export interface Pet {
  id: string;
  nameAr: string;
  emoji: string;
  color: string;
  rarity: 'Common' | 'Rare' | 'Legendary';
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
  { id: 'bee', nameAr: 'The Diligent Bee', emoji: '🐝', color: '#ffbc0a', rarity: 'Common', descAr: 'Awarded when you reach level two.', rule: { type: 'level', value: 2 } },
  { id: 'butterfly', nameAr: 'The Perseverance Butterfly', emoji: '🦋', color: '#84dbe5', rarity: 'Common', descAr: 'Keep a 3-day streak.', rule: { type: 'streak', value: 3 } },
  { id: 'bird', nameAr: 'The Soaring Bird', emoji: '🐦', color: '#0072f9', rarity: 'Rare', descAr: 'Surpass 500 XP.', rule: { type: 'xp', value: 500 } },
  { id: 'owl', nameAr: 'The Owl of Wisdom', emoji: '🦉', color: '#82003a', rarity: 'Rare', descAr: 'Unlock 5 badges.', rule: { type: 'badges', value: 5 } },
  { id: 'eagle', nameAr: 'The Leaderboard Falcon', emoji: '🦅', color: '#2b2d3f', rarity: 'Legendary', descAr: 'Break into the top 3 on the leaderboard.', rule: { type: 'rank', value: 3 } },
  { id: 'unicorn', nameAr: 'The Unicorn', emoji: '🦄', color: '#ff00b7', rarity: 'Legendary', descAr: 'Earn your first promotion.', rule: { type: 'promotion' } },
  { id: 'dragon', nameAr: 'The Leadership Dragon', emoji: '🐉', color: '#00c17a', rarity: 'Legendary', descAr: 'Reach level five.', rule: { type: 'level', value: 5 } },
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
