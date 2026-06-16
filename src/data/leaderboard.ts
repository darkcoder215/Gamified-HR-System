import type { Peer } from '@/types';

// Mock peers for the leaderboard. The live player is injected at render time.
export const peers: Peer[] = [
  { id: 'p1', nameAr: 'Sarah Al-Otaibi', titleAr: 'Manager', level: 5, xp: 1680, avatar: '#82003a' },
  { id: 'p2', nameAr: 'Khalid Al-Dosari', titleAr: 'Team Lead', level: 4, xp: 1120, avatar: '#0072f9' },
  { id: 'p3', nameAr: 'Reem Al-Qahtani', titleAr: 'Team Lead', level: 4, xp: 980, avatar: '#ff00b7' },
  { id: 'p4', nameAr: 'Abdullah Al-Shammari', titleAr: 'Senior Employee', level: 3, xp: 720, avatar: '#00c17a' },
  { id: 'p5', nameAr: 'Noura Al-Ghamdi', titleAr: 'Senior Employee', level: 3, xp: 640, avatar: '#ffbc0a' },
  { id: 'p6', nameAr: 'Fahad Al-Mutairi', titleAr: 'Employee', level: 2, xp: 410, avatar: '#ff9172' },
  { id: 'p7', nameAr: 'Maha Al-Subaie', titleAr: 'Employee', level: 2, xp: 300, avatar: '#84dbe5' },
  { id: 'p8', nameAr: 'Youssef Al-Harbi', titleAr: 'Junior Employee', level: 1, xp: 150, avatar: '#494c6b' },
];
