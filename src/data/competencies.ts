import type { Competency } from '@/types';

export const competencies: Competency[] = [
  {
    id: 'leadership',
    nameAr: 'Leadership',
    descAr: 'Guiding and inspiring teams and making decisive calls.',
    icon: 'Crown',
    color: '#00c17a',
  },
  {
    id: 'communication',
    nameAr: 'Communication',
    descAr: 'Active listening, clear writing, and persuasion.',
    icon: 'MessagesSquare',
    color: '#0072f9',
  },
  {
    id: 'product',
    nameAr: 'Product Management',
    descAr: 'Understanding the user, setting priorities, and building the roadmap.',
    icon: 'Boxes',
    color: '#ffbc0a',
  },
  {
    id: 'data',
    nameAr: 'Data Analysis',
    descAr: 'Measuring and making decisions grounded in numbers.',
    icon: 'BarChart3',
    color: '#82003a',
  },
  {
    id: 'collaboration',
    nameAr: 'Teamwork',
    descAr: 'Collaborating across teams, building trust, and resolving conflicts.',
    icon: 'Users',
    color: '#ff9172',
  },
  {
    id: 'innovation',
    nameAr: 'Innovation',
    descAr: 'Creative thinking, embracing experimentation, and finding solutions.',
    icon: 'Lightbulb',
    color: '#ff00b7',
  },
  {
    id: 'problem',
    nameAr: 'Problem Solving',
    descAr: 'Analyzing complex situations and reaching practical solutions.',
    icon: 'Puzzle',
    color: '#84dbe5',
  },
  {
    id: 'time',
    nameAr: 'Time Management',
    descAr: 'Prioritizing, staying focused, and getting what matters done.',
    icon: 'Clock',
    color: '#d1c4e2',
  },
];

export const getCompetency = (id: string): Competency | undefined =>
  competencies.find((c) => c.id === id);
