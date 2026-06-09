import { useEffect, useState } from 'react';
import { EventBus } from '@/game/EventBus';
import { stations } from '@/game/stations/stationZones';
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/game/gameConfig';

const SIZE = 150; // displayed minimap size in px

export default function MiniMap() {
  const [pos, setPos] = useState({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 });

  useEffect(() => {
    const handler = (p: { x: number; y: number }) => setPos(p);
    EventBus.on('player:pos', handler);
    return () => EventBus.off('player:pos', handler);
  }, []);

  const sx = SIZE / WORLD_WIDTH;
  const sy = SIZE / WORLD_HEIGHT;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-20 hidden sm:block">
      <div className="rounded-xl bg-white p-2 shadow-card">
        <div className="mb-1 flex items-center justify-between px-0.5">
          <span className="font-ui text-[11px] font-bold text-charcoal">الخريطة</span>
          <span className="num font-ui text-[10px] text-muted">ثمانية</span>
        </div>
        <div className="relative overflow-hidden rounded-lg" style={{ width: SIZE, height: SIZE }} dir="ltr">
          <img
            src="/game/tuxemon/minimap.png"
            alt=""
            width={SIZE}
            height={SIZE}
            style={{ imageRendering: 'pixelated', display: 'block' }}
          />
          {/* station dots */}
          {stations.map((st) => (
            <span
              key={st.id}
              title={st.nameAr}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: st.x * sx,
                top: st.y * sy,
                width: 8,
                height: 8,
                background: st.color,
                border: '1.5px solid #fff',
              }}
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
