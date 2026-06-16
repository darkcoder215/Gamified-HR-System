import type { StationId } from '@/types';

export interface BuildingGuide {
  id: StationId;
  glyph: string;
  nameAr: string;
  color: string;
  whatAr: string; // what it does
  benefitAr: string; // how the user benefits
}

export const buildingGuides: BuildingGuide[] = [
  {
    id: 'arena',
    glyph: '⚔️',
    nameAr: 'ساحة التقييم',
    color: '#00c17a',
    whatAr: 'نزالات أسئلة معرفية في كل مهارة، كل إجابة صحيحة تمنحك خبرة والخطأ يُنقص طاقتك.',
    benefitAr: 'ترفع تقييم مهاراتك المطلوبة للترقية، وتكسب خبرة سريعة لرفع مستواك.',
  },
  {
    id: 'quests',
    glyph: '📋',
    nameAr: 'مركز المهام',
    color: '#0072f9',
    whatAr: 'مهام تطويرية متعدّدة الخطوات موزّعة على مسارات تعلّم لكل مهارة.',
    benefitAr: 'تبني عادات تطوير حقيقية، وتفتح أوسمة وخبرة إضافية عند إكمال كل مهمة.',
  },
  {
    id: 'career',
    glyph: '🏙️',
    nameAr: 'برج الترقيات',
    color: '#ffbc0a',
    whatAr: 'يعرض مسارك المهني وعتبات كل رتبة ومتطلباتها مع طلب الترقية وموافقة المدير.',
    benefitAr: 'ترى بوضوح ما ينقصك للترقية القادمة، وتتقدّم في المسمّى الوظيفي.',
  },
  {
    id: 'leaderboard',
    glyph: '🏆',
    nameAr: 'قاعة الصدارة',
    color: '#82003a',
    whatAr: 'ترتيب الموظفين حسب الخبرة، إضافة إلى مجموعة الأوسمة التي حقّقتها.',
    benefitAr: 'تقيس موقعك بين زملائك وتتحفّز للمنافسة وجمع الأوسمة.',
  },
  {
    id: 'org',
    glyph: '🏢',
    nameAr: 'المقر — الهيكل التنظيمي',
    color: '#2b2d3f',
    whatAr: 'يعرض فريق باور بالشخصيات موزّعين على رتب الهيكل التنظيمي.',
    benefitAr: 'تفهم بنية الشركة وموقعك الحالي فيها وإلى أين تتجه مع كل ترقية.',
  },
];
