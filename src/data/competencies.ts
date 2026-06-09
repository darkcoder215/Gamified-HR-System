import type { Competency } from '@/types';

export const competencies: Competency[] = [
  {
    id: 'leadership',
    nameAr: 'القيادة',
    descAr: 'توجيه الفِرق وإلهامها واتخاذ القرارات الحاسمة.',
    icon: 'Crown',
    color: '#00c17a',
  },
  {
    id: 'communication',
    nameAr: 'التواصل',
    descAr: 'الإصغاء الفعّال والكتابة الواضحة والإقناع.',
    icon: 'MessagesSquare',
    color: '#0072f9',
  },
  {
    id: 'product',
    nameAr: 'إدارة المنتج',
    descAr: 'فهم المستخدم وتحديد الأولويات وبناء خارطة الطريق.',
    icon: 'Boxes',
    color: '#ffbc0a',
  },
  {
    id: 'data',
    nameAr: 'تحليل البيانات',
    descAr: 'القياس واتخاذ القرار المبني على الأرقام.',
    icon: 'BarChart3',
    color: '#82003a',
  },
  {
    id: 'collaboration',
    nameAr: 'العمل الجماعي',
    descAr: 'التعاون عبر الفِرق وبناء الثقة وحل الخلافات.',
    icon: 'Users',
    color: '#ff9172',
  },
  {
    id: 'innovation',
    nameAr: 'الابتكار',
    descAr: 'التفكير الإبداعي وتبنّي التجارب وإيجاد الحلول.',
    icon: 'Lightbulb',
    color: '#ff00b7',
  },
];

export const getCompetency = (id: string): Competency | undefined =>
  competencies.find((c) => c.id === id);
