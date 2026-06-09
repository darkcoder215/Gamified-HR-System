import { useEffect, useState, type ReactNode } from 'react';
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
} from 'lucide-react';
import { useGameStore } from '@/state/store';
import { buildingGuides } from '@/data/guide';
import { celebrate } from '@/animation/confetti';

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
  const [i, setI] = useState(0);

  const slides: ReactNode[] = [
    // 0 — Welcome
    <Slide key="welcome">
      <motion.img
        src="/logo/thamanyah.png"
        alt="ثمانية"
        className="mb-4 h-20 w-20 rounded-2xl bg-black p-3"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
      />
      <motion.h1 variants={item} className="font-display text-5xl font-black text-black">
        رحلة التطوّر
      </motion.h1>
      <motion.p variants={item} className="mt-2 font-body text-lg text-charcoal">
        أهلًا <span className="highlight">{playerName}</span>! منصّة <b>ثمانية</b> لتطوير الموظفين وتقييمهم وترقيتهم —
        في عالم تفاعلي ممتع.
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

    // 1 — Controls
    <Slide key="controls">
      <motion.span variants={item} className="mb-2 text-5xl">🕹️</motion.span>
      <motion.h2 variants={item} className="font-display text-4xl font-black text-black">تنقّل في العالم</motion.h2>
      <motion.p variants={item} className="mt-2 font-body text-base text-charcoal">حرّك شخصيتك بين المباني واكتشف ما تقدّمه.</motion.p>
      <motion.div variants={item} className="mt-6 flex items-center justify-center gap-2">
        <Kbd>W</Kbd><Kbd>A</Kbd><Kbd>S</Kbd><Kbd>D</Kbd>
        <span className="mx-2 font-ui text-sm text-muted">أو</span>
        <Kbd>↑</Kbd><Kbd>↓</Kbd><Kbd>←</Kbd><Kbd>→</Kbd>
      </motion.div>
      <motion.div variants={item} className="mt-4 flex items-center gap-2 rounded-pill bg-green-light px-4 py-2 font-ui text-sm font-bold text-black">
        اقترب من أي مبنى واضغط <Kbd>E</Kbd> للدخول
      </motion.div>
      <motion.p variants={item} className="mt-3 font-ui text-xs text-muted">📱 على الجوال: استخدم عصا التحكّم وزر التفاعل.</motion.p>
    </Slide>,

    // 2 — Buildings (pseudo-3D showcase of the real buildings)
    <Slide key="buildings">
      <motion.h2 variants={item} className="font-display text-4xl font-black text-black">المباني الخمسة</motion.h2>
      <motion.p variants={item} className="mt-1 mb-6 font-body text-base text-charcoal">لكل مبنى دور يدفعك نحو الترقية.</motion.p>
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
      <motion.h2 variants={item} className="font-display text-4xl font-black text-black">كيف تتقدّم</motion.h2>
      <motion.div variants={item} className="mt-5 w-full max-w-md space-y-3 text-start">
        {[
          { c: '#00c17a', t: 'الخبرة (XP)', d: 'تكسبها من التقييمات والمهام، وترفع مستواك.' },
          { c: '#ffbc0a', t: 'الطاقة', d: 'تنقص مع الإجابات الخاطئة وتتجدّد مع الوقت.' },
          { c: '#0072f9', t: 'الأوسمة', d: 'مكافآت على إنجازاتك المميّزة.' },
          { c: '#82003a', t: 'الترقية', d: 'استوفِ عتبة الخبرة ومتطلبات المهارات لتصعد البرج.' },
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
      <motion.h2 variants={item} className="font-display text-4xl font-black text-black">أدواتك</motion.h2>
      <motion.p variants={item} className="mt-1 mb-5 font-body text-base text-charcoal">كل ما تحتاجه على الشاشة دائمًا.</motion.p>
      <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3">
        {[
          { icon: <MapIcon size={20} />, t: 'الخريطة', c: '#00c17a' },
          { icon: <ListChecks size={20} />, t: 'دليل البداية', c: '#0072f9' },
          { icon: <BarChart3 size={20} />, t: 'تحليلاتي', c: '#82003a' },
          { icon: <BookOpen size={20} />, t: 'الدليل', c: '#ffbc0a' },
          { icon: <Palette size={20} />, t: 'الشخصية (AI)', c: '#ff00b7' },
          { icon: <TrendingUp size={20} />, t: 'برج الترقيات', c: '#2b2d3f' },
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
      <motion.h2 variants={item} className="font-display text-4xl font-black text-black">افعل · تجنّب</motion.h2>
      <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        <motion.div variants={item} className="rounded-lg p-4 text-start" style={{ background: 'var(--color-green-light)' }}>
          <p className="mb-2 flex items-center gap-1.5 font-display text-lg font-black text-black"><Check size={18} className="text-green" /> افعل</p>
          <ul className="space-y-1.5 font-ui text-[13px] text-charcoal">
            {['أكمل التقييمات بانتظام', 'نوّع بين المهارات', 'تابع «تحليلاتي» لخطوتك التالية', 'أكمل المهام لكسب الأوسمة'].map((t) => (
              <li key={t} className="flex items-start gap-1.5"><Check size={14} className="mt-0.5 shrink-0 text-green" />{t}</li>
            ))}
          </ul>
        </motion.div>
        <motion.div variants={item} className="rounded-lg p-4 text-start" style={{ background: 'var(--color-blush)' }}>
          <p className="mb-2 flex items-center gap-1.5 font-display text-lg font-black text-black"><X size={18} className="text-red" /> تجنّب</p>
          <ul className="space-y-1.5 font-ui text-[13px] text-charcoal">
            {['إهمال طاقتك في النزالات', 'طلب الترقية قبل استيفاء المتطلبات', 'التركيز على مهارة واحدة', 'تجاهل المهارات الضعيفة'].map((t) => (
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
      <motion.h2 variants={item} className="font-display text-5xl font-black text-black">هيّا نبدأ!</motion.h2>
      <motion.p variants={item} className="mt-2 font-body text-lg text-charcoal">عالم <b>ثمانية</b> بانتظارك. تطوّر، تنافس، وارتقِ إلى القمّة.</motion.p>
    </Slide>,
  ];

  const last = slides.length - 1;
  const isLast = i === last;

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
          <img src="/logo/thamanyah.png" alt="ثمانية" className="h-8 w-8 rounded-lg bg-black p-1.5" />
          <span className="font-display text-lg font-bold text-black">ثمانية</span>
        </div>
        <button onClick={finishIntro} className="rounded-pill px-4 py-1.5 font-ui text-sm font-bold text-muted transition hover:text-black">
          تخطّي
        </button>
      </div>

      {/* slide area */}
      <div className="relative flex flex-1 items-center justify-center px-6">
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
          <ArrowRight size={16} /> السابق
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
            ابدأ رحلتك
          </motion.button>
        ) : (
          <button
            onClick={() => setI((n) => Math.min(last, n + 1))}
            className="flex items-center gap-1 rounded-pill bg-black px-5 py-2.5 font-ui text-sm font-bold text-white shadow-card"
          >
            التالي <ArrowLeft size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
