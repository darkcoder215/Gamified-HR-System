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
  nameAr: 'منيرة الشهري',
  avatar: '#000000',
  glyph: '👑',
};
export const executiveTitleAr = 'الرئيسة التنفيذية';

export const orgTiers: OrgTier[] = [
  {
    level: 5,
    titleAr: 'مدير',
    people: [{ id: 'p1', nameAr: 'سارة العتيبي', avatar: '#82003a', glyph: '🧭' }],
  },
  {
    level: 4,
    titleAr: 'قائد فريق',
    people: [
      { id: 'p2', nameAr: 'خالد الدوسري', avatar: '#0072f9' },
      { id: 'p3', nameAr: 'ريم القحطاني', avatar: '#ff00b7' },
    ],
  },
  {
    level: 3,
    titleAr: 'موظف أول',
    people: [
      { id: 'p4', nameAr: 'عبدالله الشمري', avatar: '#00c17a' },
      { id: 'p5', nameAr: 'نورة الغامدي', avatar: '#ffbc0a' },
    ],
  },
  {
    level: 2,
    titleAr: 'موظف',
    people: [
      { id: 'p6', nameAr: 'فهد المطيري', avatar: '#ff9172' },
      { id: 'p7', nameAr: 'مها السبيعي', avatar: '#84dbe5' },
    ],
  },
  {
    level: 1,
    titleAr: 'موظف مبتدئ',
    people: [{ id: 'p8', nameAr: 'يوسف الحربي', avatar: '#494c6b' }],
  },
];
