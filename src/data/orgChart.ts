// Company hierarchy, mirrored on the career ladder titles. Each tier groups
// the people at that rung. The player is slotted into the tier matching their
// current rung at render time.
export interface OrgPerson {
  id: string;
  nameAr: string;
  avatar: string; // disc color
  glyph?: string; // small role glyph
}

export interface OrgTier {
  level: number; // matches careerLadder rung level
  titleAr: string;
  people: OrgPerson[];
}

// Top of the company (above the ladder) — the executive.
export const executive: OrgPerson = {
  id: 'ceo',
  nameAr: 'Munira Al-Shehri',
  avatar: '#000000',
  glyph: '👑',
};
export const executiveTitleAr = 'Chief Executive Officer';

export const orgTiers: OrgTier[] = [
  {
    level: 5,
    titleAr: 'Manager',
    people: [{ id: 'p1', nameAr: 'Sarah Al-Otaibi', avatar: '#82003a', glyph: '🧭' }],
  },
  {
    level: 4,
    titleAr: 'Team Lead',
    people: [
      { id: 'p2', nameAr: 'Khalid Al-Dosari', avatar: '#0072f9' },
      { id: 'p3', nameAr: 'Reem Al-Qahtani', avatar: '#ff00b7' },
    ],
  },
  {
    level: 3,
    titleAr: 'Senior Employee',
    people: [
      { id: 'p4', nameAr: 'Abdullah Al-Shammari', avatar: '#00c17a' },
      { id: 'p5', nameAr: 'Noura Al-Ghamdi', avatar: '#ffbc0a' },
    ],
  },
  {
    level: 2,
    titleAr: 'Employee',
    people: [
      { id: 'p6', nameAr: 'Fahad Al-Mutairi', avatar: '#ff9172' },
      { id: 'p7', nameAr: 'Maha Al-Subaie', avatar: '#84dbe5' },
    ],
  },
  {
    level: 1,
    titleAr: 'Junior Employee',
    people: [{ id: 'p8', nameAr: 'Youssef Al-Harbi', avatar: '#494c6b' }],
  },
];
