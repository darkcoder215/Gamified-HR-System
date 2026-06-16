import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, ClipboardList, TrendingUp, Trophy } from 'lucide-react';
import { useGameStore } from '@/state/store';

const FEATURES = [
  { icon: Swords, label: 'Assessment Battles', color: '#00c17a' },
  { icon: ClipboardList, label: 'Development Tasks', color: '#0072f9' },
  { icon: TrendingUp, label: 'Promotion Path', color: '#ffbc0a' },
  { icon: Trophy, label: 'Leaderboard & Badges', color: '#82003a' },
];

export default function StartScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const [name, setName] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startGame(name);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-6"
      style={{ background: 'radial-gradient(circle at 50% 30%, #1a2436, #111421 70%)' }}
    >
      {/* decorative floating glyphs */}
      {['⚔️', '📋', '🏆', '🚀', '💎', '⭐'].map((g, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute text-3xl opacity-20"
          style={{ top: `${15 + (i * 13) % 70}%`, left: `${(i * 29) % 90}%` }}
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
        >
          {g}
        </motion.span>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className="relative z-10 w-full max-w-lg rounded-xl bg-off-white p-8 text-center shadow-float"
      >
        <motion.img
          src="/logo/made-in-powr.svg"
          alt="made in POWR"
          className="mx-auto mb-5 h-14 w-auto"
          initial={{ rotate: -10, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        />
        <h1 className="font-display text-4xl font-black text-black">The Growth Journey</h1>
        <p className="mt-1 font-body text-base text-charcoal">
          <span className="highlight">POWR</span> — the platform for developing, assessing, and promoting employees
        </p>

        <div className="my-6 grid grid-cols-4 gap-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md text-white" style={{ background: f.color }}>
                <f.icon size={22} />
              </div>
              <span className="font-ui text-[10px] font-medium text-muted">{f.label}</span>
            </motion.div>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block text-end font-ui text-sm font-bold text-charcoal">What's your name?</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type your name here"
            maxLength={24}
            className="w-full rounded-pill border-2 border-warm-gray bg-white px-5 py-3 text-center font-ui text-lg text-black outline-none transition focus:border-green"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-pill bg-green py-4 font-ui text-lg font-bold text-white shadow-card"
          >
            Start the journey
          </motion.button>
        </form>
        <p className="mt-4 font-ui text-[11px] text-muted">
          Move with the arrow keys or <span className="num">WASD</span> · get close to stations and press <span className="num">E</span>
        </p>
      </motion.div>
    </div>
  );
}
