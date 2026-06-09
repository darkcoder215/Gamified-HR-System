import { useEffect } from 'react';
import { Swords, ClipboardList, TrendingUp, Trophy, Building2 } from 'lucide-react';
import type { StationId } from '@/types';
import { useGameStore } from '@/state/store';
import { EventBus } from '@/game/EventBus';
import Modal from '@/ui/Modal';
import AssessmentArena from './arena/AssessmentArena';
import QuestBoard from './quests/QuestBoard';
import CareerLadder from './promotion/CareerLadder';
import LeaderboardHall from './leaderboard/LeaderboardHall';
import OrgHierarchy from './org/OrgHierarchy';

interface StationMeta {
  title: string;
  subtitle: string;
  accent: string;
  icon: JSX.Element;
  Component: () => JSX.Element;
  maxWidth: string;
}

const META: Record<StationId, StationMeta> = {
  arena: {
    title: 'ساحة التقييم',
    subtitle: 'اختبر مهاراتك واكسب الخبرة',
    accent: 'var(--color-green)',
    icon: <Swords size={24} />,
    Component: AssessmentArena,
    maxWidth: '680px',
  },
  quests: {
    title: 'لوحة المهام',
    subtitle: 'أكمل مهام التطوير وارتقِ بمهاراتك',
    accent: 'var(--color-blue)',
    icon: <ClipboardList size={24} />,
    Component: QuestBoard,
    maxWidth: '760px',
  },
  career: {
    title: 'برج الترقيات',
    subtitle: 'مسارك المهني وفرص ترقيتك',
    accent: 'var(--color-amber)',
    icon: <TrendingUp size={24} />,
    Component: CareerLadder,
    maxWidth: '680px',
  },
  leaderboard: {
    title: 'قاعة الصدارة',
    subtitle: 'ترتيبك بين زملائك وأوسمتك',
    accent: 'var(--color-burgundy)',
    icon: <Trophy size={24} />,
    Component: LeaderboardHall,
    maxWidth: '680px',
  },
  org: {
    title: 'الهيكل التنظيمي',
    subtitle: 'فريق ثمانية وموقعك فيه',
    accent: 'var(--color-charcoal)',
    icon: <Building2 size={24} />,
    Component: OrgHierarchy,
    maxWidth: '720px',
  },
};

export default function StationModalRouter() {
  const activeStation = useGameStore((s) => s.activeStation);
  const openStation = useGameStore((s) => s.openStation);
  const closeStation = useGameStore((s) => s.closeStation);

  // Phaser → React: a station was entered.
  useEffect(() => {
    const handler = (p: { stationId: StationId }) => openStation(p.stationId);
    EventBus.on('station:enter', handler);
    return () => {
      EventBus.off('station:enter', handler);
    };
  }, [openStation]);

  const meta = activeStation ? META[activeStation] : null;

  return (
    <Modal
      open={!!meta}
      onClose={closeStation}
      title={meta?.title}
      subtitle={meta?.subtitle}
      icon={meta?.icon}
      accent={meta?.accent}
      maxWidth={meta?.maxWidth}
    >
      {meta ? <meta.Component /> : null}
    </Modal>
  );
}
