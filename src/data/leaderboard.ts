import type { Peer } from '@/types';

// Mock peers for the leaderboard. The live player is injected at render time.
export const peers: Peer[] = [
  { id: 'p1', nameAr: 'سارة العتيبي', titleAr: 'مديرة', level: 5, xp: 1680, avatar: '#82003a' },
  { id: 'p2', nameAr: 'خالد الدوسري', titleAr: 'قائد فريق', level: 4, xp: 1120, avatar: '#0072f9' },
  { id: 'p3', nameAr: 'ريم القحطاني', titleAr: 'قائدة فريق', level: 4, xp: 980, avatar: '#ff00b7' },
  { id: 'p4', nameAr: 'عبدالله الشمري', titleAr: 'موظف أول', level: 3, xp: 720, avatar: '#00c17a' },
  { id: 'p5', nameAr: 'نورة الغامدي', titleAr: 'موظفة أولى', level: 3, xp: 640, avatar: '#ffbc0a' },
  { id: 'p6', nameAr: 'فهد المطيري', titleAr: 'موظف', level: 2, xp: 410, avatar: '#ff9172' },
  { id: 'p7', nameAr: 'مها السبيعي', titleAr: 'موظفة', level: 2, xp: 300, avatar: '#84dbe5' },
  { id: 'p8', nameAr: 'يوسف الحربي', titleAr: 'موظف مبتدئ', level: 1, xp: 150, avatar: '#494c6b' },
];
