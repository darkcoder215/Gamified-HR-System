import { motion } from 'framer-motion';
import type { StationId } from '@/types';

interface Prop {
  g: string;
  left: string;
  size: number;
  delay?: number;
  bottom?: number;
}
interface Interior {
  wall: string;
  wall2: string;
  floor: string;
  accent: string;
  art: string; // framed wall art glyph
  props: Prop[];
}

// Stylized themed room for each building (pure CSS/emoji, no assets).
const INTERIORS: Record<StationId, Interior> = {
  arena: {
    wall: '#2b2d3f',
    wall2: '#1c1e2b',
    floor: '#5a4634',
    accent: '#00c17a',
    art: '⚔️',
    props: [
      { g: '🔥', left: '8%', size: 30, delay: 0 },
      { g: '🎯', left: '32%', size: 40, delay: 0.2 },
      { g: '🛡️', left: '64%', size: 34, delay: 0.1 },
      { g: '🔥', left: '88%', size: 30, delay: 0.3 },
    ],
  },
  quests: {
    wall: '#1f3a5f',
    wall2: '#15294299',
    floor: '#6b5840',
    accent: '#0072f9',
    art: '📋',
    props: [
      { g: '🪴', left: '10%', size: 34 },
      { g: '🗂️', left: '34%', size: 32, delay: 0.15 },
      { g: '🖥️', left: '62%', size: 34, delay: 0.1 },
      { g: '📚', left: '86%', size: 30, delay: 0.2 },
    ],
  },
  career: {
    wall: '#3a2e10',
    wall2: '#241d0a',
    floor: '#7a6a52',
    accent: '#ffbc0a',
    art: '🏙️',
    props: [
      { g: '🏆', left: '12%', size: 34 },
      { g: '📈', left: '36%', size: 32, delay: 0.15 },
      { g: '🛗', left: '64%', size: 34, delay: 0.1 },
      { g: '🪴', left: '88%', size: 30, delay: 0.2 },
    ],
  },
  leaderboard: {
    wall: '#3a0e22',
    wall2: '#240817',
    floor: '#6b4a3a',
    accent: '#82003a',
    art: '🏆',
    props: [
      { g: '🥈', left: '14%', size: 30, bottom: 6 },
      { g: '🥇', left: '40%', size: 44, bottom: 10 },
      { g: '🥉', left: '66%', size: 30, bottom: 6 },
      { g: '✨', left: '88%', size: 26, delay: 0.2 },
    ],
  },
  org: {
    wall: '#1c2230',
    wall2: '#11151f',
    floor: '#5a5a66',
    accent: '#84dbe5',
    art: '📊',
    props: [
      { g: '🖥️', left: '12%', size: 32 },
      { g: '🪴', left: '34%', size: 30, delay: 0.15 },
      { g: '🖥️', left: '60%', size: 32, delay: 0.1 },
      { g: '👥', left: '86%', size: 30, delay: 0.2 },
    ],
  },
};

export default function InteriorScene({ id, title }: { id: StationId; title: string }) {
  const it = INTERIORS[id];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative mb-5 h-32 overflow-hidden rounded-lg sm:h-36"
      style={{ background: `linear-gradient(${it.wall}, ${it.wall2})` }}
    >
      {/* light beam */}
      <motion.div
        className="pointer-events-none absolute -top-6 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${it.accent}55, transparent 70%)` }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* framed wall art */}
      <div
        className="absolute left-1/2 top-3 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-md text-2xl"
        style={{ background: 'rgba(255,255,255,0.1)', border: `2px solid ${it.accent}` }}
      >
        {it.art}
      </div>

      {/* floor */}
      <div className="absolute inset-x-0 bottom-0 h-2/5" style={{ background: it.floor, boxShadow: 'inset 0 6px 10px rgba(0,0,0,0.25)' }} />
      <div className="absolute inset-x-0 bottom-[40%] h-0.5" style={{ background: 'rgba(0,0,0,0.25)' }} />

      {/* floating motes */}
      {[0, 1, 2, 3, 4].map((k) => (
        <motion.span
          key={k}
          className="absolute rounded-full"
          style={{ left: `${10 + k * 20}%`, top: '30%', width: 4, height: 4, background: it.accent, opacity: 0.5 }}
          animate={{ y: [0, -14, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 3 + k, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* props on the floor */}
      {it.props.map((p, k) => (
        <motion.span
          key={k}
          className="absolute"
          style={{ left: p.left, bottom: (p.bottom ?? 4) + 4, fontSize: p.size, transform: 'translateX(-50%)', filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.4))' }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: p.delay ?? 0 }}
        >
          {p.g}
        </motion.span>
      ))}

      {/* character standing inside */}
      <motion.img
        src="/game/tuxemon/char-front.png"
        alt=""
        className="absolute bottom-1 left-1/2 h-16 -translate-x-1/2"
        style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.4))' }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* label */}
      <div className="absolute bottom-2 right-3 rounded-pill bg-black/55 px-3 py-1 font-display text-sm font-bold text-white backdrop-blur-sm">
        {title}
      </div>
    </motion.div>
  );
}
