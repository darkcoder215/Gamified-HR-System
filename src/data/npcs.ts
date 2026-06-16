export interface Npc {
  id: string;
  nameAr: string;
  titleAr: string;
  tint: string; // colors the in-world sprite + dialogue avatar
  x: number;
  y: number;
  glyph: string;
  lines: string[];
}

// Colleagues placed around town. They reuse the org-chart identities for
// consistency. Avatars can later be AI-generated (same pipeline as the player).
export const npcs: Npc[] = [
  {
    id: 'greeter',
    nameAr: 'Maha Al-Subaie',
    titleAr: 'Operations Team',
    tint: '#84dbe5',
    x: 430,
    y: 1185,
    glyph: '💬',
    lines: [
      'Welcome to POWR! I\'m Maha from the Operations Team.',
      'Start at the Assessment Arena to build up your skills, and follow the Getting Started guide at the bottom of the screen.',
      'And if you need a full walkthrough, open the Guide at the top. Good luck! 🌟',
    ],
  },
  {
    id: 'coach',
    nameAr: 'Khalid Al-Dosari',
    titleAr: 'Team Lead',
    tint: '#0072f9',
    x: 430,
    y: 650,
    glyph: '⚔️',
    lines: [
      'The battles in the Assessment Arena are the fastest way to earn XP.',
      'Focus on the skills required for your promotion — you\'ll find them in My Analytics.',
      'And watch your energy, because wrong answers drain it!',
    ],
  },
  {
    id: 'buddy',
    nameAr: 'Noura Al-Ghamdi',
    titleAr: 'Senior Employee',
    tint: '#ffbc0a',
    x: 985,
    y: 560,
    glyph: '📋',
    lines: [
      'Don\'t forget the Quest Hub — quests grant you XP and badges.',
      'Mix up the tracks to develop more than one skill.',
      'Every quest you complete brings you one step closer to a promotion.',
    ],
  },
  {
    id: 'mentor',
    nameAr: 'Sarah Al-Otaibi',
    titleAr: 'Manager',
    tint: '#82003a',
    x: 945,
    y: 860,
    glyph: '🚀',
    lines: [
      'Hi, I\'m Sarah, the team Manager.',
      'Once you meet the XP threshold and the skill requirements, head to the Promotions Tower.',
      'I look forward to seeing you rise through the org chart! 🚀',
    ],
  },
];

export const getNpc = (id: string): Npc | undefined => npcs.find((n) => n.id === id);
