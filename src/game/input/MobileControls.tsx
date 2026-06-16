import { useEffect, useRef, useState } from 'react';
import { Hand } from 'lucide-react';
import { EventBus } from '../EventBus';
import { useIsTouch } from '@/hooks/useIsTouch';

// Floating joystick: touch anywhere in the play area and drag to move — the
// stick spawns where your thumb lands, which is far easier on a phone than a
// fixed pad. The top HUD bar and the interact button sit above this layer.
const RADIUS = 60;
const DEAD = 0.16;

export default function MobileControls() {
  const isTouch = useIsTouch();
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [showHint, setShowHint] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const pointerId = useRef<number | null>(null);

  useEffect(() => {
    if (!isTouch) return;
    const t = window.setTimeout(() => setShowHint(false), 6000);
    return () => window.clearTimeout(t);
  }, [isTouch]);

  // Hide the controls while any panel/modal is open (world paused).
  useEffect(() => {
    const pause = () => setDisabled(true);
    const resume = () => setDisabled(false);
    EventBus.on('game:pause', pause);
    EventBus.on('game:resume', resume);
    return () => {
      EventBus.off('game:pause', pause);
      EventBus.off('game:resume', resume);
    };
  }, []);

  if (!isTouch || disabled) return null;

  const emit = (ox: number, oy: number, cx: number, cy: number) => {
    let dx = cx - ox;
    let dy = cy - oy;
    const dist = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(dist, RADIUS);
    const nx = (dx / dist) * clamped;
    const ny = (dy / dist) * clamped;
    setKnob({ x: nx, y: ny });
    const mx = nx / RADIUS;
    const my = ny / RADIUS;
    EventBus.emit('input:move', {
      dx: Math.abs(mx) < DEAD ? 0 : mx,
      dy: Math.abs(my) < DEAD ? 0 : my,
    });
  };

  const reset = () => {
    pointerId.current = null;
    setOrigin(null);
    setKnob({ x: 0, y: 0 });
    EventBus.emit('input:release');
  };

  return (
    <>
      {/* Movement zone — covers the play area (below the top HUD bar). */}
      <div
        className="pointer-events-auto fixed inset-x-0 bottom-0 top-24 z-[15] touch-none"
        onPointerDown={(e) => {
          pointerId.current = e.pointerId;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setOrigin({ x: e.clientX, y: e.clientY });
          setKnob({ x: 0, y: 0 });
          setShowHint(false);
        }}
        onPointerMove={(e) => {
          if (pointerId.current === e.pointerId && origin) emit(origin.x, origin.y, e.clientX, e.clientY);
        }}
        onPointerUp={reset}
        onPointerCancel={reset}
      />

      {/* Joystick visual at the touch origin */}
      {origin && (
        <div className="pointer-events-none fixed z-20" style={{ left: origin.x, top: origin.y }}>
          <div
            className="absolute rounded-full border-2 border-white/70"
            style={{ width: RADIUS * 2, height: RADIUS * 2, transform: 'translate(-50%, -50%)', background: 'rgba(43,45,63,0.35)' }}
          />
          <div
            className="absolute h-14 w-14 rounded-full bg-white/90 shadow-card"
            style={{ transform: `translate(-50%, -50%) translate(${knob.x}px, ${knob.y}px)` }}
          />
        </div>
      )}

      {/* First-time movement hint */}
      {showHint && !origin && (
        <div className="pointer-events-none fixed bottom-28 left-1/2 z-20 -translate-x-1/2 animate-pulse rounded-pill bg-black/80 px-4 py-2 font-ui text-xs font-bold text-white">
          Drag anywhere to move 👆
        </div>
      )}

      {/* Interact button (physical right corner) */}
      <button
        className="pointer-events-auto fixed bottom-10 right-6 z-30 flex h-20 w-20 flex-col items-center justify-center gap-0.5 rounded-full text-white shadow-float active:scale-95"
        style={{ background: 'var(--color-green)' }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          EventBus.emit('input:interact');
        }}
        aria-label="Interact"
      >
        <Hand size={26} />
        <span className="font-ui text-[10px] font-bold">Interact</span>
      </button>
    </>
  );
}
