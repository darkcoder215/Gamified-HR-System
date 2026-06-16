import { Suspense, lazy, useEffect, useState } from 'react';
import { Palette, BookOpen, BarChart3, ShoppingBag, Flame, Map as MapIcon, Bell, Inbox, Building2, LogOut, LayoutDashboard, PawPrint, Target, Gamepad2 } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { EventBus } from '@/game/EventBus';
import StartScreen from './StartScreen';
import Hud from './hud/Hud';
import ProgressBridge from './hud/ProgressBridge';
import MiniMap from './hud/MiniMap';
import OnboardingChecklist from './hud/OnboardingChecklist';
import Toast from './hud/Toast';
import StationModalRouter from './modules/StationModalRouter';
import Celebrations from './animation/Celebrations';
import MobileControls from './game/input/MobileControls';
import Modal from './ui/Modal';
import CharacterStudio from './modules/character/CharacterStudio';
import GuideModal from './modules/guide/GuideModal';
import AnalyticsDashboard from './modules/analytics/AnalyticsDashboard';
import Shop from './modules/shop/Shop';
import DailyChallenges from './modules/daily/DailyChallenges';
import ZonesPanel from './modules/zones/ZonesPanel';
import Intro from './intro/Intro';
import DialogueBox from './modules/dialogue/DialogueBox';
import PetsPanel from './modules/pets/PetsPanel';
import GoalsPanel from './modules/goals/GoalsPanel';
import GamesPanel from './modules/games/GamesPanel';
import { usePetEngine } from './hooks/usePetEngine';
import NotificationsPanel from './modules/notifications/NotificationsPanel';
import AssignmentsInbox from './modules/assignments/AssignmentsInbox';
import Embassy from './modules/embassy/Embassy';
import { initAudio, setMuted } from './audio/sound';
import { supabase } from './lib/supabase';

const PhaserGame = lazy(() => import('./game/PhaserGame'));

interface Props {
  backend?: boolean;
  onExit?: () => void; // managers/HR return to their dashboard
  signOut?: () => void;
  userId?: string;
}

export default function GameApp({ backend, onExit, signOut, userId }: Props) {
  const started = useGameStore((s) => s.started);
  const regenEnergy = useGameStore((s) => s.regenEnergy);
  const activeStation = useGameStore((s) => s.activeStation);
  const characterOpen = useGameStore((s) => s.characterOpen);
  const closeCharacter = useGameStore((s) => s.closeCharacter);
  const guideOpen = useGameStore((s) => s.guideOpen);
  const closeGuide = useGameStore((s) => s.closeGuide);
  const analyticsOpen = useGameStore((s) => s.analyticsOpen);
  const closeAnalytics = useGameStore((s) => s.closeAnalytics);
  const shopOpen = useGameStore((s) => s.shopOpen);
  const closeShop = useGameStore((s) => s.closeShop);
  const dailyOpen = useGameStore((s) => s.dailyOpen);
  const closeDaily = useGameStore((s) => s.closeDaily);
  const zonesOpen = useGameStore((s) => s.zonesOpen);
  const closeZones = useGameStore((s) => s.closeZones);
  const petsOpen = useGameStore((s) => s.petsOpen);
  const closePets = useGameStore((s) => s.closePets);
  const goalsOpen = useGameStore((s) => s.goalsOpen);
  const closeGoals = useGameStore((s) => s.closeGoals);
  const gamesOpen = useGameStore((s) => s.gamesOpen);
  const closeGames = useGameStore((s) => s.closeGames);
  const inboxOpen = useGameStore((s) => s.inboxOpen);
  const closeInbox = useGameStore((s) => s.closeInbox);
  const openInbox = useGameStore((s) => s.openInbox);
  const embassyOpen = useGameStore((s) => s.embassyOpen);
  const closeEmbassy = useGameStore((s) => s.closeEmbassy);
  const openEmbassy = useGameStore((s) => s.openEmbassy);
  const notifOpen = useGameStore((s) => s.notifOpen);
  const closeNotif = useGameStore((s) => s.closeNotif);
  const openNotif = useGameStore((s) => s.openNotif);
  const introReplay = useGameStore((s) => s.introReplay);
  const introSeen = useGameStore((s) => s.onboarding.introSeen);
  const showIntro = introReplay || !introSeen;
  const activeNpc = useGameStore((s) => s.activeNpc);
  const muted = useGameStore((s) => s.muted);

  const [unread, setUnread] = useState(0);

  usePetEngine();
  useEffect(() => { initAudio(); }, []);
  useEffect(() => { setMuted(muted); }, [muted]);
  useEffect(() => {
    const id = window.setInterval(() => regenEnergy(), 30000);
    return () => window.clearInterval(id);
  }, [regenEnergy]);

  // Unread notification count + realtime (backend mode)
  useEffect(() => {
    if (!backend || !userId) return;
    const refresh = () =>
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false).then(({ count }) => setUnread(count ?? 0));
    refresh();
    const ch = supabase
      .channel('notif-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [backend, userId, notifOpen]);

  const anyModal =
    !!activeStation || characterOpen || guideOpen || analyticsOpen || shopOpen || dailyOpen || zonesOpen ||
    petsOpen || goalsOpen || gamesOpen || inboxOpen || embassyOpen || notifOpen || showIntro || !!activeNpc;
  useEffect(() => {
    EventBus.emit(anyModal ? 'game:pause' : 'game:resume');
  }, [anyModal]);

  if (!backend && !started) return <StartScreen />;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-off-white">
            <p className="animate-pulse font-display text-2xl font-black text-green">Loading the world…</p>
          </div>
        }
      >
        <PhaserGame />
      </Suspense>

      <div className="pointer-events-none absolute inset-0 z-10" style={{ background: 'radial-gradient(120% 120% at 50% 35%, rgba(0,193,122,0.10), rgba(0,114,249,0.06) 55%, rgba(130,0,58,0.10) 100%)', mixBlendMode: 'soft-light' }} />
      <div className="pointer-events-none absolute inset-0 z-10" style={{ background: 'radial-gradient(110% 110% at 50% 45%, transparent 60%, rgba(17,20,33,0.34) 100%)' }} />

      <Hud />
      <ProgressBridge />
      <MiniMap />
      <OnboardingChecklist />
      <MobileControls />

      {/* Backend toolbar (auth mode): notifications, inbox, embassy, exit/sign-out */}
      {backend && (
        <div className="pointer-events-none fixed bottom-2 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5">
          <button onClick={openNotif} className="pointer-events-auto relative flex items-center gap-1 rounded-pill bg-white px-3 py-1.5 font-ui text-xs font-bold text-charcoal shadow-card">
            <Bell size={14} /> Notifications
            {unread > 0 && <span className="num absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">{unread}</span>}
          </button>
          <button onClick={openInbox} className="pointer-events-auto flex items-center gap-1 rounded-pill bg-white px-3 py-1.5 font-ui text-xs font-bold text-blue shadow-card"><Inbox size={14} /> My Tasks</button>
          <button onClick={openEmbassy} className="pointer-events-auto flex items-center gap-1 rounded-pill bg-white px-3 py-1.5 font-ui text-xs font-bold text-amber shadow-card"><Building2 size={14} /> Embassy</button>
          {onExit && <button onClick={onExit} className="pointer-events-auto flex items-center gap-1 rounded-pill bg-black px-3 py-1.5 font-ui text-xs font-bold text-white shadow-card"><LayoutDashboard size={14} /> My Dashboard</button>}
          {signOut && <button onClick={signOut} className="pointer-events-auto flex items-center gap-1 rounded-pill bg-white px-2.5 py-1.5 font-ui text-xs font-bold text-muted shadow-card" title="Sign out"><LogOut size={14} /></button>}
        </div>
      )}

      <StationModalRouter />
      <Modal open={characterOpen} onClose={closeCharacter} title="Customize Character" subtitle="Create and color your character" icon={<Palette size={24} />} accent="var(--color-hot-pink)" maxWidth="640px"><CharacterStudio /></Modal>
      <Modal open={guideOpen} onClose={closeGuide} title="Guide" subtitle="What each building offers and how to make the most of it" icon={<BookOpen size={24} />} accent="var(--color-blue)" maxWidth="640px"><GuideModal /></Modal>
      <Modal open={analyticsOpen} onClose={closeAnalytics} title="My Analytics" subtitle="Where you stand now and how to progress" icon={<BarChart3 size={24} />} accent="var(--color-green)" maxWidth="760px"><AnalyticsDashboard /></Modal>
      <Modal open={shopOpen} onClose={closeShop} title="Shop" subtitle="Spend your coins on looks and perks" icon={<ShoppingBag size={24} />} accent="var(--color-amber)" maxWidth="640px"><Shop /></Modal>
      <Modal open={dailyOpen} onClose={closeDaily} title="Daily Challenges" subtitle="Complete today's challenges and keep your streak" icon={<Flame size={24} />} accent="var(--color-red)" maxWidth="560px"><DailyChallenges /></Modal>
      <Modal open={zonesOpen} onClose={closeZones} title="Zones" subtitle="The world's districts and what unlocks as you progress" icon={<MapIcon size={24} />} accent="var(--color-green)" maxWidth="600px"><ZonesPanel /></Modal>
      <Modal open={petsOpen} onClose={closePets} title="Companions" subtitle="The pets you've earned through your achievements" icon={<PawPrint size={24} />} accent="var(--color-hot-pink)" maxWidth="600px"><PetsPanel /></Modal>
      {backend && <Modal open={goalsOpen} onClose={closeGoals} title="My Goals & KPIs" subtitle="Track your goals and performance indicators" icon={<Target size={24} />} accent="var(--color-green)" maxWidth="620px"><GoalsPanel /></Modal>}
      <Modal open={gamesOpen} onClose={closeGames} title="Games" subtitle="Quick challenges that build your skills" icon={<Gamepad2 size={24} />} accent="var(--color-blue)" maxWidth="600px"><GamesPanel /></Modal>
      {backend && <Modal open={notifOpen} onClose={closeNotif} title="Notifications" subtitle="Latest updates" icon={<Bell size={24} />} accent="var(--color-blue)" maxWidth="520px"><NotificationsPanel /></Modal>}
      {backend && <Modal open={inboxOpen} onClose={closeInbox} title="My Tasks" subtitle="Tasks and assessments assigned to you" icon={<Inbox size={24} />} accent="var(--color-blue)" maxWidth="600px"><AssignmentsInbox /></Modal>}
      {backend && <Modal open={embassyOpen} onClose={closeEmbassy} title="Embassy" subtitle="Leave and requests" icon={<Building2 size={24} />} accent="var(--color-amber)" maxWidth="620px"><Embassy /></Modal>}

      <DialogueBox />
      <Toast />
      <Celebrations />
      {showIntro && <Intro />}
    </div>
  );
}
