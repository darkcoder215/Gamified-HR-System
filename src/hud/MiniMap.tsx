import { useEffect, useState } from 'react';
import { EventBus } from '@/game/EventBus';
import { stations } from '@/game/stations/stationZones';
import { npcs } from '@/data/npcs';
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/game/gameConfig';
import { useIsTouch } from '@/hooks/useIsTouch';

export default function MiniMap() {
  const isTouch = useIsTouch();
  const SIZE = isTouch ? 104 : 150;
  const [pos, setPos] = useState({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 });

  useEffect(() => {
    const handler = (p: { x: number; y: number }) => setPos(p);
    EventBus.on('player:pos', handler);
    return () => EventBus.off('player:pos', handler);
  }, []);

  const sx = SIZE / WORLD_WIDTH;
  const sy = SIZE / WORLD_HEIGHT;

  return (
    // bottom-left on phones (keeps clear of the interact button), bottom-right on desktop
    <div className="pointer-events-none fixed bottom-4 left-4 z-20 sm:left-auto sm:right-4">
      <div className="rounded-xl bg-white p-1.5 shadow-card sm:p-2">
        <div className="mb-1 hidden items-center justify-between px-0.5 sm:flex">
          <span className="font-ui text-[11px] font-bold text-charcoal">Map</span>
          <span className="num font-ui text-[10px] text-muted">POWR</span>
        </div>
        <div className="relative overflow-hidden rounded-lg" style={{ width: SIZE, height: SIZE }} dir="ltr">
          <img
            src="/game/tuxemon/minimap.png"
            alt=""
            width={SIZE}
            height={SIZE}
            style={{ imageRendering: 'pixelated', display: 'block' }}
          />
          {/* NPC dots */}
          {npcs.map((n) => (
            <span
              key={n.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80"
              style={{ left: n.x * sx, top: n.y * sy, width: 5, height: 5, background: n.tint, border: '1px solid #fff' }}
            />
          ))}
          {/* station dots */}
          {stations.map((st) => (
            <span
              key={st.id}
              title={st.nameAr}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: st.x * sx, top: st.y * sy, width: 8, height: 8, background: st.color, border: '1.5px solid #fff' }}
            />
          ))}
          {/* player dot */}
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: pos.x * sx,
              top: pos.y * sy,
              width: 10,
              height: 10,
              background: 'var(--color-green)',
              border: '2px solid #000',
              boxShadow: '0 0 0 3px rgba(0,193,122,0.35)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
