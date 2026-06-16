import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Map as MapIcon,
  ListChecks,
  BarChart3,
  BookOpen,
  Palette,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import { useGameStore } from '@/state/store';
import { buildingGuides } from '@/data/guide';
import { celebrate } from '@/animation/confetti';
import { useIsTouch } from '@/hooks/useIsTouch';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 180, damping: 18 } },
};

// A pixel building presented as a slowly-rotating pseudo-3D object on a pedestal.
function Building3D({ src, color, delay = 0 }: { src: string; color: string; delay?: number }) {
  return (
    <div style={{ perspective: 700 }} className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 24, rotateX: 25 }}
        animate={{ opacity: 1, y: [0, -8, 0], rotateY: [-12, 12, -12], rotateX: 12 }}
        transition={{
          opacity: { delay, duration: 0.5 },
          y: { delay, duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
          rotateY: { delay, duration: 6, repeat: Infinity, ease: 'easeInOut' },
          rotateX: { delay, duration: 0.6 },
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative"
      >
        <img
          src={src}
          alt=""
          className="h-24 w-auto rounded-md object-contain sm:h-28"
          style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 14px 12px rgba(17,20,33,0.35))' }}
          draggable={false}
        />
        {/* shine sweep */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
          <div className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 animate-shine bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
      </motion.div>
      {/* ground shadow + pedestal */}
      <div className="mt-1 h-2 w-20 rounded-[100%] bg-black/20 blur-[2px]" />
      <div className="-mt-1 h-1.5 w-16 rounded-pill" style={{ background: color, opacity: 0.5 }} />
    </div>
  );
}

function Slide({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex w-full max-w-2xl flex-col items-center text-center"
    >
      {children}
    </motion.div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <motion.span
      variants={item}
      className="num inline-flex h-11 min-w-11 items-center justify-center rounded-lg bg-black px-3 font-ui text-lg font-bold text-white shadow-card"
    >
      {children}
    </motion.span>
  );
}

export default function Intro() {
  const finishIntro = useGameStore((s) => s.finishIntro);
  const playerName = useGameStore((s) => s.player.nameAr);
  const isTouch = useIsTouch();
  const [i, setI] = useState(0);

  const slides: ReactNode[] = [
    // 0 — Welcome
    <Slide key="welcome">
      <motion.img
        src="/logo/made-in-powr.svg"
        alt="made in POWR"
        className="mb-5 h-16 w-auto"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
      />
      <motion.h1 variants={item} className="font-display text-5xl font-black text-black">
        The Growth Journey
      </motion.h1>
      <motion.p variants={item} className="mt-2 font-body text-lg text-charcoal">
        Welcome, <span className="highlight">{playerName}</span>! <b>POWR</b> is the platform for developing,
        assessing, and promoting employees — in a fun, interactive world.
      </motion.p>
      <motion.img
        src="/game/tuxemon/char-front.png"
        alt=""
        className="mt-6 h-28"
        style={{ imageRendering: 'pixelated' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: [0, -10, 0], opacity: 1 }}
        transition={{ y: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }, opacity: { delay: 0.4 } }}
      />
    </Slide>,

    // 1 — Controls (adapts to touch vs keyboard)
    <Slide key="controls">
      <motion.span variants={item} className="mb-2 text-5xl">{isTouch ? '👆' : '🕹️'}</motion.span>
      <motion.h2 variants={item} className="font-display text-4xl font-black text-black">Move around the world</motion.h2>
      {isTouch ? (
        <>
          <motion.p variants={item} className="mt-2 font-body text-base text-charcoal">
            Touch anywhere on the screen <b>and drag</b> to move your character — the joystick appears under your finger.
          </motion.p>
          <motion.div variants={item} className="mt-6 flex flex-col items-center gap-2">
            <motion.div
              className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed"
              style={{ borderColor: 'var(--color-green)', background: 'rgba(0,193,122,0.08)' }}
            >
              <motion.div
                className="h-12 w-12 rounded-full bg-green shadow-card"
                animate={{ x: [0, 22, -18, 0], y: [0, -16, 14, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
            <span className="font-ui text-xs text-muted">Drag to move in any direction</span>
          </motion.div>
          <motion.div variants={item} className="mt-4 flex items-center gap-2 rounded-pill bg-green-light px-4 py-2 text-center font-ui text-sm font-bold text-black">
            To enter a building or talk: get close, then press the green <span className="rounded-full bg-green px-2 py-0.5 text-white">Interact</span> button
          </motion.div>
        </>
      ) : (
        <>
          <motion.p variants={item} className="mt-2 font-body text-base text-charcoal">Move your character between the buildings and discover what each offers.</motion.p>
          <motion.div variants={item} className="mt-6 flex items-center justify-center gap-2">
            <Kbd>W</Kbd><Kbd>A</Kbd><Kbd>S</Kbd><Kbd>D</Kbd>
            <span className="mx-2 font-ui text-sm text-muted">or</span>
            <Kbd>↑</Kbd><Kbd>↓</Kbd><Kbd>←</Kbd><Kbd>→</Kbd>
          </motion.div>
          <motion.div variants={item} className="mt-4 flex items-center gap-2 rounded-pill bg-green-light px-4 py-2 font-ui text-sm font-bold text-black">
            Get close to any building and press <Kbd>E</Kbd> to enter
          </motion.div>
        </>
      )}
    </Slide>,

    // 2 — Buildings (pseudo-3D showcase of the real buildings)
    <Slide key="buildings">
      <motion.h2 variants={item} className="font-display text-4xl font-black text-black">The five buildings</motion.h2>
      <motion.p variants={item} className="mt-1 mb-6 font-body text-base text-charcoal">Each building plays a role that drives you toward promotion.</motion.p>
      <div className="grid w-full grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
        {buildingGuides.map((b, k) => (
          <motion.div key={b.id} variants={item} className="flex flex-col items-center text-center">
            <Building3D src={`/game/buildings/${b.id}.png`} color={b.color} delay={k * 0.12} />
            <p className="mt-2 font-ui text-sm font-bold text-black">
              <span style={{ borderBottom: `3px solid ${b.color}` }}>{b.nameAr}</span>
            </p>
            <p className="mt-1 font-ui text-[11px] leading-tight text-muted">{b.benefitAr}</p>
          </motion.div>
        ))}
      </div>
    </Slide>,

    // 3 — Progression
    <Slide key="progress">
      <motion.span variants={item} className="mb-2 text-5xl">📈</motion.span>
      <motion.h2 variants={item} className="font-display text-4xl font-black text-black">How to progress</motion.h2>
      <motion.div variants={item} className="mt-5 w-full max-w-md space-y-3 text-start">
        {[
          { c: '#00c17a', t: 'XP', d: 'Earn it from assessments and tasks to raise your level.' },
          { c: '#ffbc0a', t: 'Energy', d: 'Drops with wrong answers and refills over time.' },
          { c: '#0072f9', t: 'Badges', d: 'Rewards for your standout achievements.' },
          { c: '#82003a', t: 'Promotion', d: 'Meet the XP threshold and skill requirements to climb the tower.' },
        ].map((r) => (
          <div key={r.t} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-soft">
            <span className="h-9 w-9 shrink-0 rounded-full" style={{ background: r.c }} />
            <div>
              <p className="font-ui text-sm font-bold text-black">{r.t}</p>
              <p className="font-ui text-xs text-muted">{r.d}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </Slide>,

    // 4 — Tools
    <Slide key="tools">
      <motion.h2 variants={item} className="font-display text-4xl font-black text-black">Your tools</motion.h2>
      <motion.p variants={item} className="mt-1 mb-5 font-body text-base text-charcoal">Everything you need, always on screen.</motion.p>
      <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3">
        {[
          { icon: <MapIcon size={20} />, t: 'Map', c: '#00c17a' },
          { icon: <ListChecks size={20} />, t: 'Getting Started', c: '#0072f9' },
          { icon: <BarChart3 size={20} />, t: 'My Analytics', c: '#82003a' },
          { icon: <BookOpen size={20} />, t: 'Guide', c: '#ffbc0a' },
          { icon: <Palette size={20} />, t: 'Character (AI)', c: '#ff00b7' },
          { icon: <ShoppingBag size={20} />, t: 'Shop', c: '#ffbc0a' },
          { icon: <TrendingUp size={20} />, t: 'Promotion Tower', c: '#2b2d3f' },
        ].map((x) => (
          <motion.div key={x.t} variants={item} className="flex flex-col items-center gap-1.5 rounded-lg bg-white p-3 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-md text-white" style={{ background: x.c }}>{x.icon}</span>
            <span className="font-ui text-xs font-bold text-charcoal">{x.t}</span>
          </motion.div>
        ))}
      </div>
    </Slide>,

    // 5 — Do / Don't
    <Slide key="dos">
      <motion.h2 variants={item} className="font-display text-4xl font-black text-black">Do · Avoid</motion.h2>
      <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        <motion.div variants={item} className="rounded-lg p-4 text-start" style={{ background: 'var(--color-green-light)' }}>
          <p className="mb-2 flex items-center gap-1.5 font-display text-lg font-black text-black"><Check size={18} className="text-green" /> Do</p>
          <ul className="space-y-1.5 font-ui text-[13px] text-charcoal">
            {['Complete assessments regularly', 'Mix up your skills', 'Check "My Analytics" for your next step', 'Complete tasks to earn badges'].map((t) => (
              <li key={t} className="flex items-start gap-1.5"><Check size={14} className="mt-0.5 shrink-0 text-green" />{t}</li>
            ))}
          </ul>
        </motion.div>
        <motion.div variants={item} className="rounded-lg p-4 text-start" style={{ background: 'var(--color-blush)' }}>
          <p className="mb-2 flex items-center gap-1.5 font-display text-lg font-black text-black"><X size={18} className="text-red" /> Avoid</p>
          <ul className="space-y-1.5 font-ui text-[13px] text-charcoal">
            {['Neglecting your energy in battles', 'Requesting a promotion before meeting the requirements', 'Focusing on a single skill', 'Ignoring your weak skills'].map((t) => (
              <li key={t} className="flex items-start gap-1.5"><X size={14} className="mt-0.5 shrink-0 text-red" />{t}</li>
            ))}
          </ul>
        </motion.div>
      </div>
    </Slide>,

    // 6 — Start
    <Slide key="start">
      <motion.img
        src="/game/tuxemon/char-right.png"
        alt=""
        className="mb-4 h-24"
        style={{ imageRendering: 'pixelated' }}
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: [0, 12, 0], opacity: 1 }}
        transition={{ x: { repeat: Infinity, duration: 1.2 }, opacity: { duration: 0.4 } }}
      />
      <motion.h2 variants={item} className="font-display text-5xl font-black text-black">Let's go!</motion.h2>
      <motion.p variants={item} className="mt-2 font-body text-lg text-charcoal">The world of <b>POWR</b> awaits you. Develop, compete, and rise to the top.</motion.p>
    </Slide>,
  ];

  const last = slides.length - 1;
  const isLast = i === last;
  const go = (dir: 1 | -1) => setI((n) => Math.max(0, Math.min(last, n + dir)));
  const swipe = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isLast) celebrate();
  }, [isLast]);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #ffffff, #f7f4ee 45%, #eef3ef 100%)' }}
    >
      {/* drifting brand-color blobs */}
      {[
        { c: '#00c17a', s: 320, x: '-8%', y: '-10%' },
        { c: '#0072f9', s: 260, x: '70%', y: '8%' },
        { c: '#ffbc0a', s: 240, x: '78%', y: '64%' },
        { c: '#82003a', s: 280, x: '-6%', y: '62%' },
      ].map((b, k) => (
        <motion.div
          key={`blob-${k}`}
          className="pointer-events-none absolute rounded-full"
          style={{ width: b.s, height: b.s, left: b.x, top: b.y, background: b.c, filter: 'blur(70px)', opacity: 0.16 }}
          animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 14 + k * 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* floating brand decorations */}
      {['⚔️', '📋', '🏆', '🏢', '⭐', '💎', '🚀'].map((g, k) => (
        <motion.span
          key={k}
          className="pointer-events-none absolute text-2xl opacity-[0.08]"
          style={{ top: `${(k * 17 + 8) % 85}%`, left: `${(k * 31 + 5) % 90}%` }}
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 3 + k * 0.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {g}
        </motion.span>
      ))}

      {/* top bar: brand + skip */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-2">
          <img src="/logo/powr-mark.svg" alt="POWR" className="h-8 w-8" />
          <span className="font-display text-lg font-bold text-black">POWR</span>
        </div>
        <button onClick={finishIntro} className="rounded-pill px-4 py-1.5 font-ui text-sm font-bold text-muted transition hover:text-black">
          Skip
        </button>
      </div>

      {/* slide area (swipe left/right to navigate) */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-y-auto px-5 py-2"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const s = swipe.current;
          swipe.current = null;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -12 }}
            transition={{ duration: 0.3 }}
            className="flex w-full justify-center"
          >
            {slides[i]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* footer: dots + nav */}
      <div className="flex items-center justify-between gap-4 p-6">
        <button
          onClick={() => setI((n) => Math.max(0, n - 1))}
          disabled={i === 0}
          className="flex items-center gap-1 rounded-pill bg-white px-4 py-2.5 font-ui text-sm font-bold text-charcoal shadow-soft transition disabled:opacity-0"
        >
          <ArrowRight size={16} /> Previous
        </button>

        <div className="flex items-center gap-2">
          {slides.map((_, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              className="h-2.5 rounded-full transition-all"
              style={{
                width: k === i ? 26 : 10,
                background: k === i ? 'var(--color-green)' : 'var(--color-warm-gray)',
              }}
            />
          ))}
        </div>

        {isLast ? (
          <motion.button
            onClick={finishIntro}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-pill bg-green px-7 py-3 font-ui text-base font-bold text-white shadow-card"
          >
            Start your journey
          </motion.button>
        ) : (
          <button
            onClick={() => setI((n) => Math.min(last, n + 1))}
            className="flex items-center gap-1 rounded-pill bg-black px-5 py-2.5 font-ui text-sm font-bold text-white shadow-card"
          >
            Next <ArrowLeft size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
