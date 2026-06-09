import { Suspense, lazy, useEffect } from 'react';
import { Palette, BookOpen, BarChart3 } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { EventBus } from '@/game/EventBus';
import StartScreen from './StartScreen';
import Hud from './hud/Hud';
import ProgressBridge from './hud/ProgressBridge';
import MiniMap from './hud/MiniMap';
import OnboardingChecklist from './hud/OnboardingChecklist';
import StationModalRouter from './modules/StationModalRouter';
import Celebrations from './animation/Celebrations';
import MobileControls from './game/input/MobileControls';
import Modal from './ui/Modal';
import CharacterStudio from './modules/character/CharacterStudio';
import GuideModal from './modules/guide/GuideModal';
import AnalyticsDashboard from './modules/analytics/AnalyticsDashboard';

// Phaser lives in its own chunk so the shell paints first.
const PhaserGame = lazy(() => import('./game/PhaserGame'));

export default function App() {
  const started = useGameStore((s) => s.started);
  const regenEnergy = useGameStore((s) => s.regenEnergy);
  const activeStation = useGameStore((s) => s.activeStation);
  const characterOpen = useGameStore((s) => s.characterOpen);
  const closeCharacter = useGameStore((s) => s.closeCharacter);
  const guideOpen = useGameStore((s) => s.guideOpen);
  const closeGuide = useGameStore((s) => s.closeGuide);
  const analyticsOpen = useGameStore((s) => s.analyticsOpen);
  const closeAnalytics = useGameStore((s) => s.closeAnalytics);

  // Passive energy regeneration while playing.
  useEffect(() => {
    const id = window.setInterval(() => regenEnergy(), 30000);
    return () => window.clearInterval(id);
  }, [regenEnergy]);

  // Freeze the world whenever any dashboard/modal is open.
  const anyModal = !!activeStation || characterOpen || guideOpen || analyticsOpen;
  useEffect(() => {
    EventBus.emit(anyModal ? 'game:pause' : 'game:resume');
  }, [anyModal]);

  if (!started) return <StartScreen />;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-off-white">
            <p className="animate-pulse font-display text-2xl font-black text-green">جارٍ تحميل العالم…</p>
          </div>
        }
      >
        <PhaserGame />
      </Suspense>

      {/* Thmanyah color grade over the pixel world for brand cohesion */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 35%, rgba(0,193,122,0.10), rgba(0,114,249,0.06) 55%, rgba(130,0,58,0.10) 100%)',
          mixBlendMode: 'soft-light',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: 'radial-gradient(110% 110% at 50% 45%, transparent 60%, rgba(17,20,33,0.34) 100%)',
        }}
      />

      <Hud />
      <ProgressBridge />
      <MiniMap />
      <OnboardingChecklist />
      <MobileControls />
      <StationModalRouter />
      <Modal
        open={characterOpen}
        onClose={closeCharacter}
        title="تخصيص الشخصية"
        subtitle="اصنع شخصيتك ولونها"
        icon={<Palette size={24} />}
        accent="var(--color-hot-pink)"
        maxWidth="640px"
      >
        <CharacterStudio />
      </Modal>
      <Modal
        open={guideOpen}
        onClose={closeGuide}
        title="الدليل"
        subtitle="ما الذي يقدّمه كل مبنى وكيف تستفيد"
        icon={<BookOpen size={24} />}
        accent="var(--color-blue)"
        maxWidth="640px"
      >
        <GuideModal />
      </Modal>
      <Modal
        open={analyticsOpen}
        onClose={closeAnalytics}
        title="تحليلاتي"
        subtitle="أين تقف الآن وكيف تتقدّم"
        icon={<BarChart3 size={24} />}
        accent="var(--color-green)"
        maxWidth="760px"
      >
        <AnalyticsDashboard />
      </Modal>
      <Celebrations />
    </div>
  );
}
