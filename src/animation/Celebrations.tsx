import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Badge } from '@/types';
import type { Zone } from '@/data/zones';
import { EventBus } from '@/game/EventBus';
import { celebrate, smallBurst } from './confetti';
import NumberText from '@/ui/NumberText';

// Listens to EventBus celebration signals emitted by the store and renders
// full-screen level-up + queued badge-unlock animations.
export default function Celebrations() {
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<Badge[]>([]);
  const [zone, setZone] = useState<Zone | null>(null);
  const current = badgeQueue[0] ?? null;

  useEffect(() => {
    const onLevel = (p: { level: number }) => {
      setLevelUp(p.level);
      celebrate();
      window.setTimeout(() => setLevelUp(null), 2600);
    };
    const onBadge = (b: Badge) => {
      setBadgeQueue((q) => [...q, b]);
      smallBurst();
    };
    const onZone = (z: Zone) => {
      setZone(z);
      celebrate();
      window.setTimeout(() => setZone(null), 3200);
    };
    EventBus.on('player:levelup', onLevel);
    EventBus.on('badge:unlock', onBadge);
    EventBus.on('zone:unlock', onZone);
    return () => {
      EventBus.off('player:levelup', onLevel);
      EventBus.off('badge:unlock', onBadge);
      EventBus.off('zone:unlock', onZone);
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    const t = window.setTimeout(() => setBadgeQueue((q) => q.slice(1)), 2400);
    return () => window.clearTimeout(t);
  }, [current]);

  return (
    <>
      {/* Zone / district unlocked */}
      <AnimatePresence>
        {zone && (
          <motion.div
            className="pointer-events-none fixed inset-x-0 top-1/3 z-[60] flex justify-center px-4"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <motion.div
              className="flex items-center gap-3 rounded-2xl px-6 py-4 text-white shadow-float"
              style={{ background: `linear-gradient(135deg, ${zone.color}, var(--color-charcoal))` }}
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            >
              <span className="text-4xl">{zone.glyph}</span>
              <div className="text-start">
                <p className="font-ui text-xs font-bold text-white/80">🎉 فُتح حيٌّ جديد!</p>
                <p className="font-display text-2xl font-black">{zone.nameAr}</p>
                <p className="font-ui text-[11px] text-white/80">{zone.descAr}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level up */}
      <AnimatePresence>
        {levelUp !== null && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute h-[60vmin] w-[60vmin] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(0,193,122,0.35), transparent 70%)' }}
              initial={{ scale: 0 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
            />
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ scale: 0.5, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            >
              <span className="font-ui text-lg font-bold text-green">أحسنت!</span>
              <h2 className="font-display text-5xl font-black text-black drop-shadow">
                ترقّيت إلى المستوى <NumberText value={levelUp} />
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge unlock */}
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            className="pointer-events-none fixed bottom-10 left-1/2 z-[55] -translate-x-1/2"
            initial={{ y: 80, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <div className="relative flex items-center gap-4 overflow-hidden rounded-xl bg-white px-6 py-4 shadow-float">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                style={{ background: current.color }}
              >
                {current.icon}
              </div>
              <div>
                <p className="font-ui text-xs font-bold text-green">وسام جديد!</p>
                <p className="font-display text-xl font-black text-black">{current.nameAr}</p>
                <p className="font-ui text-xs text-muted">{current.descAr}</p>
              </div>
              <div className="pointer-events-none absolute inset-0 -skew-x-12 animate-shine bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
