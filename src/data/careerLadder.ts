import type { CareerRung } from '@/types';

// Career ladder — XP thresholds aligned with the leveling curve in gamification.ts.
export const careerLadder: CareerRung[] = [
  {
    level: 1,
    titleAr: 'موظف مبتدئ',
    descAr: 'بداية المسيرة — تعلّم الأساسيات وابنِ عاداتك المهنية.',
    xpThreshold: 0,
    requiredCompetencies: [],
    requiresManagerApproval: false,
  },
  {
    level: 2,
    titleAr: 'موظف',
    descAr: 'تنفّذ مهامك باستقلالية وتساهم في نتائج فريقك.',
    xpThreshold: 200,
    requiredCompetencies: [{ competencyId: 'communication', minScore: 50 }],
    requiresManagerApproval: false,
  },
  {
    level: 3,
    titleAr: 'موظف أول',
    descAr: 'تقود مهامًا معقّدة وتوجّه زملاءك الأحدث.',
    xpThreshold: 500,
    requiredCompetencies: [
      { competencyId: 'communication', minScore: 60 },
      { competencyId: 'product', minScore: 60 },
    ],
    requiresManagerApproval: true,
  },
  {
    level: 4,
    titleAr: 'قائد فريق',
    descAr: 'تتولّى قيادة فريق صغير وتُسهم في القرارات الاستراتيجية.',
    xpThreshold: 900,
    requiredCompetencies: [
      { competencyId: 'leadership', minScore: 65 },
      { competencyId: 'collaboration', minScore: 60 },
      { competencyId: 'data', minScore: 55 },
    ],
    requiresManagerApproval: true,
  },
  {
    level: 5,
    titleAr: 'مدير',
    descAr: 'تقود فِرقًا متعددة وتمتلك أثرًا واضحًا على المنتج والأعمال.',
    xpThreshold: 1500,
    requiredCompetencies: [
      { competencyId: 'leadership', minScore: 75 },
      { competencyId: 'innovation', minScore: 65 },
      { competencyId: 'data', minScore: 65 },
      { competencyId: 'product', minScore: 70 },
    ],
    requiresManagerApproval: true,
  },
];
