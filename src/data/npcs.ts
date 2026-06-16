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
    nameAr: 'مها السبيعي',
    titleAr: 'فريق العمليات',
    tint: '#84dbe5',
    x: 430,
    y: 1185,
    glyph: '💬',
    lines: [
      'أهلًا بك في باور! أنا مها من فريق العمليات.',
      'ابدأ من «ساحة التقييم» لرفع مهاراتك، وتابع «دليل البداية» أسفل الشاشة.',
      'وإن احتجت شرحًا كاملًا، افتح «الدليل» في الأعلى. بالتوفيق! 🌟',
    ],
  },
  {
    id: 'coach',
    nameAr: 'خالد الدوسري',
    titleAr: 'قائد فريق',
    tint: '#0072f9',
    x: 430,
    y: 650,
    glyph: '⚔️',
    lines: [
      'النزالات في «ساحة التقييم» هي أسرع طريق لكسب الخبرة.',
      'ركّز على المهارات المطلوبة لترقيتك — تجدها في «تحليلاتي».',
      'وانتبه لطاقتك، فالإجابات الخاطئة تستنزفها!',
    ],
  },
  {
    id: 'buddy',
    nameAr: 'نورة الغامدي',
    titleAr: 'موظفة أولى',
    tint: '#ffbc0a',
    x: 985,
    y: 560,
    glyph: '📋',
    lines: [
      'لا تنسَ «مركز المهام» — المهام تمنحك خبرة وأوسمة.',
      'نوّع بين المسارات لتطوّر أكثر من مهارة.',
      'كل مهمة تكملها تقرّبك خطوة من الترقية.',
    ],
  },
  {
    id: 'mentor',
    nameAr: 'سارة العتيبي',
    titleAr: 'مديرة',
    tint: '#82003a',
    x: 945,
    y: 860,
    glyph: '🚀',
    lines: [
      'مرحبًا، أنا سارة، مديرة الفريق.',
      'حين تستوفي عتبة الخبرة ومتطلبات المهارات، توجّه إلى «برج الترقيات».',
      'أتطلّع لرؤيتك تصعد في الهيكل التنظيمي! 🚀',
    ],
  },
];

export const getNpc = (id: string): Npc | undefined => npcs.find((n) => n.id === id);
