import type { CareerRung } from '@/types';

// Career ladder — XP thresholds aligned with the leveling curve in gamification.ts.
export const careerLadder: CareerRung[] = [
  {
    level: 1,
    titleAr: 'Junior Employee',
    descAr: 'The start of the journey — learn the basics and build your professional habits.',
    xpThreshold: 0,
    requiredCompetencies: [],
    requiresManagerApproval: false,
  },
  {
    level: 2,
    titleAr: 'Employee',
    descAr: 'You carry out your tasks independently and contribute to your team\'s results.',
    xpThreshold: 200,
    requiredCompetencies: [{ competencyId: 'communication', minScore: 50 }],
    requiresManagerApproval: false,
  },
  {
    level: 3,
    titleAr: 'Senior Employee',
    descAr: 'You lead complex tasks and mentor your more junior colleagues.',
    xpThreshold: 500,
    requiredCompetencies: [
      { competencyId: 'communication', minScore: 60 },
      { competencyId: 'product', minScore: 60 },
    ],
    requiresManagerApproval: true,
  },
  {
    level: 4,
    titleAr: 'Team Lead',
    descAr: 'You take on leading a small team and contribute to strategic decisions.',
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
    titleAr: 'Manager',
    descAr: 'You lead multiple teams and have a clear impact on the product and the business.',
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
