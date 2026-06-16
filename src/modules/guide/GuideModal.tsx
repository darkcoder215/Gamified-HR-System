import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Gamepad2, ArrowDownLeft, Sparkles, PlayCircle } from 'lucide-react';
import { buildingGuides } from '@/data/guide';
import { useGameStore } from '@/state/store';

type Tab = 'buildings' | 'howto';

export default function GuideModal() {
  const [tab, setTab] = useState<Tab>('buildings');
  const replayIntro = useGameStore((s) => s.replayIntro);
  const closeGuide = useGameStore((s) => s.closeGuide);

  return (
    <div>
      <div className="mb-5 flex gap-2 rounded-pill bg-warm-gray p-1">
        {([['buildings', 'Buildings', Building2], ['howto', 'How to Play', Gamepad2]] as const).map(
          ([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="relative flex flex-1 items-center justify-center gap-2 rounded-pill px-3 py-2 font-ui text-sm font-bold transition"
              style={{ color: tab === id ? '#fff' : 'var(--color-muted)' }}
            >
              {tab === id && <motion.div layoutId="guide-tab" className="absolute inset-0 rounded-pill bg-black" />}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={15} /> {label}
              </span>
            </button>
          )
        )}
      </div>

      {tab === 'buildings' && (
        <div className="space-y-3">
          <p className="font-body text-sm text-charcoal">
            Explore the <span className="highlight">POWR</span> world and visit the five buildings — each one plays a role that helps you
            develop and get promoted:
          </p>
          {buildingGuides.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-3 rounded-lg bg-white p-4 shadow-soft"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-2xl"
                style={{ background: b.color, color: '#fff' }}
              >
                {b.glyph}
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-black text-black">{b.nameAr}</h3>
                <p className="mt-0.5 font-ui text-[13px] leading-relaxed text-charcoal">{b.whatAr}</p>
                <p className="mt-1.5 flex items-start gap-1.5 font-ui text-[13px] font-bold leading-relaxed text-green">
                  <Sparkles size={14} className="mt-0.5 shrink-0" />
                  {b.benefitAr}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'howto' && (
        <div className="space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-soft">
            <h3 className="mb-2 font-display text-lg font-black text-black">The Goal</h3>
            <p className="font-body text-sm leading-relaxed text-charcoal">
              Develop your skills through assessments and quests, earn XP to raise your Level, and meet each rank's requirements to climb the
              <span className="highlight">Promotion Track</span> all the way to leadership.
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-soft">
            <h3 className="mb-3 font-display text-lg font-black text-black">Controls</h3>
            <ul className="space-y-2 font-ui text-sm text-charcoal">
              <li className="flex items-center gap-2">
                <span className="rounded-md bg-warm-gray px-2 py-1 font-bold"><span className="num">WASD</span></span>
                or the arrow keys to move around the world
              </li>
              <li className="flex items-center gap-2">
                <span className="rounded-md bg-warm-gray px-2 py-1 font-bold"><span className="num">E</span></span>
                to enter a building when you're close to it
              </li>
              <li className="flex items-center gap-2">
                <span className="rounded-md bg-warm-gray px-2 py-1"><ArrowDownLeft size={15} /></span>
                On mobile: use the joystick and the interact button
              </li>
            </ul>
          </div>
          <div className="rounded-lg p-4" style={{ background: 'var(--color-green-light)' }}>
            <p className="font-ui text-sm font-bold text-black">
              💡 Follow the "Getting Started Guide" at the bottom of the screen to complete your first steps, and open "My Analytics" to see where you stand and what your next step is.
            </p>
          </div>
          <button
            onClick={() => {
              closeGuide();
              replayIntro();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-black py-3 font-ui text-sm font-bold text-white transition hover:opacity-90"
          >
            <PlayCircle size={16} /> Watch the intro again
          </button>
        </div>
      )}
    </div>
  );
}
