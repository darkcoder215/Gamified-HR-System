import { AnimatePresence, motion } from 'framer-motion';
import { Zap, Sparkles, RotateCcw, Palette, BookOpen, BarChart3 } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { levelProgress } from '@/state/gamification';
import { stations } from '@/game/stations/stationZones';
import { badges as allBadges } from '@/data/badges';
import { useNearStation } from '@/hooks/useNearStation';
import { EventBus } from '@/game/EventBus';
import NumberText from '@/ui/NumberText';
import ProgressBar from '@/ui/ProgressBar';

export default function Hud() {
  const player = useGameStore((s) => s.player);
  const badgeMap = useGameStore((s) => s.badges);
  const near = useNearStation();
  const activeStation = useGameStore((s) => s.activeStation);
  const resetSave = useGameStore((s) => s.resetSave);
  const openCharacter = useGameStore((s) => s.openCharacter);
  const openGuide = useGameStore((s) => s.openGuide);
  const openAnalytics = useGameStore((s) => s.openAnalytics);

  const prog = levelProgress(player.xp);
  const energyColor =
    player.energy > 50 ? 'var(--color-green)' : player.energy > 25 ? 'var(--color-amber)' : 'var(--color-red)';

  const unlocked = allBadges.filter((b) => badgeMap[b.id]).slice(-4);
  const nearDef = stations.find((s) => s.id === near);

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-3 p-4">
        {/* Player card */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-card"
          style={{ minWidth: 280 }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-xl font-black text-white"
            style={{ background: player.avatar }}
          >
            {player.avatarImage ? (
              <img src={player.avatarImage} alt="" className="h-full w-full object-cover" style={{ imageRendering: 'pixelated' }} />
            ) : (
              player.nameAr.trim().charAt(0) || '؟'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-display text-base font-bold text-black">{player.nameAr}</span>
              <span
                className="shrink-0 rounded-pill px-2 py-0.5 font-ui text-[11px] font-bold text-white"
                style={{ background: 'var(--color-black)' }}
              >
                المستوى <NumberText value={prog.level} />
              </span>
            </div>
            <p className="font-ui text-xs text-muted">{player.titleAr}</p>
            <div className="mt-1.5">
              <ProgressBar pct={prog.pct} glow height={7} />
              <div className="mt-0.5 flex justify-between font-ui text-[10px] text-muted">
                <span>
                  <NumberText value={prog.currentLevelXp} /> / <NumberText value={prog.neededForNext} /> خبرة
                </span>
                <span>التالي: <NumberText value={prog.xpToNext} /></span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right cluster: logo + energy + badges */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto flex flex-col items-end gap-2"
        >
          {/* Brand lockup — icon kept in its own safe-space square */}
          <div className="flex items-center gap-3 rounded-xl bg-black py-2 pe-4 ps-2 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-black">
              <img
                src="/logo/thamanyah.png"
                alt="ثمانية"
                className="h-8 w-8 select-none"
                draggable={false}
                style={{ imageRendering: 'auto' }}
              />
            </span>
            <span className="h-8 w-px bg-white/15" />
            <div className="text-end leading-none">
              <p className="font-display text-base font-bold text-white">ثمانية</p>
              <p className="mt-0.5 font-ui text-[10px] text-white/55">تطوير الموظفين</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-card">
            <Zap size={16} style={{ color: energyColor }} />
            <div className="w-28">
              <ProgressBar pct={player.energy} color={energyColor} height={7} />
            </div>
            <span className="num font-ui text-xs font-bold" style={{ color: energyColor }}>
              <NumberText value={player.energy} />
            </span>
          </div>

          {unlocked.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 shadow-card">
              <Sparkles size={14} className="text-muted" />
              {unlocked.map((b) => (
                <div
                  key={b.id}
                  title={b.nameAr}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-sm"
                  style={{ background: b.color }}
                >
                  {b.icon}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Control toolbar */}
      <div className="pointer-events-none fixed top-4 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2">
        <button
          onClick={openGuide}
          className="pointer-events-auto flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 font-ui text-xs font-bold shadow-soft transition hover:opacity-80"
          style={{ color: 'var(--color-blue)' }}
          title="الدليل"
        >
          <BookOpen size={14} /> الدليل
        </button>
        <button
          onClick={openAnalytics}
          className="pointer-events-auto flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 font-ui text-xs font-bold shadow-soft transition hover:opacity-80"
          style={{ color: 'var(--color-green)' }}
          title="تحليلاتي"
        >
          <BarChart3 size={14} /> تحليلاتي
        </button>
        <button
          onClick={openCharacter}
          className="pointer-events-auto flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 font-ui text-xs font-bold shadow-soft transition hover:opacity-80"
          style={{ color: 'var(--color-charcoal)' }}
          title="تخصيص الشخصية"
        >
          <Palette size={14} /> الشخصية
        </button>
        <button
          onClick={() => {
            if (window.confirm('هل تريد إعادة ضبط كل تقدّمك والبدء من جديد؟')) resetSave();
          }}
          className="pointer-events-auto hidden items-center gap-1 rounded-pill bg-white px-3 py-1.5 font-ui text-xs font-medium text-muted shadow-soft transition hover:text-red sm:flex"
          title="إعادة ضبط التقدّم"
        >
          <RotateCcw size={13} /> إعادة ضبط
        </button>
      </div>

      {/* Bottom interaction prompt */}
      <AnimatePresence>
        {nearDef && !activeStation && (
          <motion.button
            key={nearDef.id}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={() => EventBus.emit('station:enter', { stationId: nearDef.id })}
            className="pointer-events-auto fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-white px-6 py-3 text-center shadow-float"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{nearDef.glyph}</span>
              <div className="text-start">
                <p className="font-display text-lg font-black text-black">{nearDef.nameAr}</p>
                <p className="font-ui text-xs text-muted">{nearDef.hintAr}</p>
              </div>
              <span
                className="ms-2 rounded-pill px-3 py-1 font-ui text-xs font-bold text-white"
                style={{ background: 'var(--color-green)' }}
              >
                اضغط <span className="num">E</span> للدخول
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
