import { Suspense, lazy, useEffect } from 'react';
import { useGameStore } from '@/state/store';
import StartScreen from './StartScreen';
import Hud from './hud/Hud';
import StationModalRouter from './modules/StationModalRouter';
import Celebrations from './animation/Celebrations';
import MobileControls from './game/input/MobileControls';

// Phaser lives in its own chunk so the shell paints first.
const PhaserGame = lazy(() => import('./game/PhaserGame'));

export default function App() {
  const started = useGameStore((s) => s.started);
  const regenEnergy = useGameStore((s) => s.regenEnergy);

  // Passive energy regeneration while playing.
  useEffect(() => {
    const id = window.setInterval(() => regenEnergy(), 30000);
    return () => window.clearInterval(id);
  }, [regenEnergy]);

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
      <MobileControls />
      <StationModalRouter />
      <Celebrations />
    </div>
  );
}
