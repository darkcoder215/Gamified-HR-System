import { useEffect, useRef, useState } from 'react';
import { Hand } from 'lucide-react';
import { EventBus } from '../EventBus';

// On-screen joystick + interact button for touch devices. Rendered in React so
// it can be styled per brand; it emits movement through the EventBus.
export default function MobileControls() {
  const [isTouch, setIsTouch] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activeId = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouch(mq.matches || 'ontouchstart' in window);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  if (!isTouch) return null;

  const RADIUS = 52;

  const handleMove = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(dist, RADIUS);
    const nx = (dx / dist) * clamped;
    const ny = (dy / dist) * clamped;
    setKnob({ x: nx, y: ny });
    EventBus.emit('input:move', { dx: nx / RADIUS, dy: ny / RADIUS });
  };

  const reset = () => {
    activeId.current = null;
    setKnob({ x: 0, y: 0 });
    EventBus.emit('input:release');
  };

  return (
    <>
      <div
        ref={baseRef}
        className="pointer-events-auto fixed bottom-8 start-6 z-30 h-32 w-32 touch-none rounded-full"
        style={{ background: 'rgba(43,45,63,0.35)', backdropFilter: 'blur(4px)' }}
        onPointerDown={(e) => {
          activeId.current = e.pointerId;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          handleMove(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (activeId.current === e.pointerId) handleMove(e.clientX, e.clientY);
        }}
        onPointerUp={reset}
        onPointerCancel={reset}
      >
        <div
          className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-white/90 shadow-card"
          style={{ transform: `translate(-50%, -50%) translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>

      <button
        className="pointer-events-auto fixed bottom-12 end-8 z-30 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-float active:scale-95"
        style={{ background: 'var(--color-green)' }}
        onPointerDown={(e) => {
          e.preventDefault();
          EventBus.emit('input:interact');
        }}
        aria-label="تفاعل"
      >
        <Hand size={30} />
      </button>
    </>
  );
}
