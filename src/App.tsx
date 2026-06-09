import { Suspense, lazy, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { EventBus } from '@/game/EventBus';
import StartScreen from './StartScreen';
import Hud from './hud/Hud';
import ProgressBridge from './hud/ProgressBridge';
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
      <Hud />
      <ProgressBridge />
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
