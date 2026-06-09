import { Suspense, lazy, useEffect } from 'react';
import { Palette } from 'lucide-react';
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

// Phaser lives in its own chunk so the shell paints first.
const PhaserGame = lazy(() => import('./game/PhaserGame'));

export default function App() {
  const started = useGameStore((s) => s.started);
  const regenEnergy = useGameStore((s) => s.regenEnergy);
  const activeStation = useGameStore((s) => s.activeStation);
  const characterOpen = useGameStore((s) => s.characterOpen);
  const closeCharacter = useGameStore((s) => s.closeCharacter);

  // Passive energy regeneration while playing.
  useEffect(() => {
    const id = window.setInterval(() => regenEnergy(), 30000);
    return () => window.clearInterval(id);
  }, [regenEnergy]);

  // Freeze the world whenever any dashboard/modal is open.
  useEffect(() => {
    EventBus.emit(activeStation || characterOpen ? 'game:pause' : 'game:resume');
  }, [activeStation, characterOpen]);

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
      <Celebrations />
    </div>
  );
}
