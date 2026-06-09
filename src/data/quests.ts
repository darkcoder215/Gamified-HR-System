import type { Quest } from '@/types';

// Seeded improvement / learning quests, grouped by learning path.
export const quests: Quest[] = [
  {
    id: 'quest-lead-1',
    titleAr: 'أساسيات القيادة',
    descAr: 'ابنِ حضورك القيادي عبر خطوات عملية في توجيه الفريق.',
    pathAr: 'مسار القيادة',
    competencyId: 'leadership',
    difficulty: 'easy',
    xpReward: 120,
    badgeId: 'leader-elite',
    steps: [
      { id: 's1', titleAr: 'اقرأ دليل «القيادة الموقفية» القصير' },
      { id: 's2', titleAr: 'أجرِ جلسة 1:1 مع أحد أعضاء فريقك' },
      { id: 's3', titleAr: 'دوّن ثلاثة قرارات اتخذتها هذا الأسبوع' },
    ],
  },
  {
    id: 'quest-comm-1',
    titleAr: 'تواصل بوضوح',
    descAr: 'طوّر مهارة إيصال الأفكار باختصار وإقناع.',
    pathAr: 'مسار التواصل',
    competencyId: 'communication',
    difficulty: 'easy',
    xpReward: 100,
    steps: [
      { id: 's1', titleAr: 'لخّص مشروعك الحالي في ثلاث جُمل' },
      { id: 's2', titleAr: 'اطلب تغذية راجعة على رسالة كتبتها' },
      { id: 's3', titleAr: 'قدّم تحديثًا شفهيًا في أقل من دقيقتين' },
    ],
  },
  {
    id: 'quest-prod-1',
    titleAr: 'اكتشاف المنتج',
    descAr: 'تعلّم كيف تنطلق من المشكلة لا من الحل.',
    pathAr: 'مسار المنتج',
    competencyId: 'product',
    difficulty: 'medium',
    xpReward: 150,
    steps: [
      { id: 's1', titleAr: 'أجرِ مقابلتين مع مستخدمين' },
      { id: 's2', titleAr: 'اكتب بيان المشكلة في فقرة واحدة' },
      { id: 's3', titleAr: 'حدّد ثلاثة فرضيات قابلة للاختبار' },
      { id: 's4', titleAr: 'صمّم نموذجًا أوليًا بسيطًا' },
    ],
  },
  {
    id: 'quest-data-1',
    titleAr: 'القرار بالأرقام',
    descAr: 'اجعل قراراتك مبنية على البيانات لا الانطباعات.',
    pathAr: 'مسار البيانات',
    competencyId: 'data',
    difficulty: 'medium',
    xpReward: 150,
    steps: [
      { id: 's1', titleAr: 'حدّد مؤشّر الأداء الرئيسي لمشروعك' },
      { id: 's2', titleAr: 'ابنِ لوحة بيانات بسيطة لمتابعته' },
      { id: 's3', titleAr: 'استخلص رؤية واحدة قابلة للتنفيذ' },
    ],
  },
  {
    id: 'quest-collab-1',
    titleAr: 'فريق متناغم',
    descAr: 'عزّز التعاون والثقة داخل فريقك.',
    pathAr: 'مسار العمل الجماعي',
    competencyId: 'collaboration',
    difficulty: 'easy',
    xpReward: 110,
    steps: [
      { id: 's1', titleAr: 'نظّم جلسة استرجاع (Retro) قصيرة' },
      { id: 's2', titleAr: 'وثّق اتفاقيات العمل المشتركة' },
      { id: 's3', titleAr: 'قدّم تقديرًا علنيًا لزميل' },
    ],
  },
  {
    id: 'quest-inno-1',
    titleAr: 'شرارة الابتكار',
    descAr: 'درّب نفسك على توليد الأفكار واختبارها بسرعة.',
    pathAr: 'مسار الابتكار',
    competencyId: 'innovation',
    difficulty: 'hard',
    xpReward: 180,
    steps: [
      { id: 's1', titleAr: 'أجرِ جلسة عصف ذهني لعشر أفكار' },
      { id: 's2', titleAr: 'اختر فكرة وابنِ نموذجًا أوليًا في يوم' },
      { id: 's3', titleAr: 'اختبر الفكرة مع ثلاثة مستخدمين' },
      { id: 's4', titleAr: 'دوّن ما تعلّمته من التجربة' },
    ],
  },
];

export const getQuest = (id: string): Quest | undefined => quests.find((q) => q.id === id);
