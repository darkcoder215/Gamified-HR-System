import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, Sparkles, RotateCcw, Palette, BookOpen, BarChart3, Volume2, VolumeX, MessageSquare, ShoppingBag, Coins, Flame, Menu, X } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { levelProgress } from '@/state/gamification';
import { stations } from '@/game/stations/stationZones';
import { npcs } from '@/data/npcs';
import { badges as allBadges } from '@/data/badges';
import { frameStyle } from '@/data/frames';
import { useFocus } from '@/hooks/useFocus';
import { useIsTouch } from '@/hooks/useIsTouch';
import { EventBus } from '@/game/EventBus';
import NumberText from '@/ui/NumberText';
import ProgressBar from '@/ui/ProgressBar';

export default function Hud() {
  const player = useGameStore((s) => s.player);
  const badgeMap = useGameStore((s) => s.badges);
  const focus = useFocus();
  const isTouch = useIsTouch();
  const activeStation = useGameStore((s) => s.activeStation);
  const activeNpc = useGameStore((s) => s.activeNpc);
  const resetSave = useGameStore((s) => s.resetSave);
  const openCharacter = useGameStore((s) => s.openCharacter);
  const openGuide = useGameStore((s) => s.openGuide);
  const openAnalytics = useGameStore((s) => s.openAnalytics);
  const muted = useGameStore((s) => s.muted);
  const toggleMuted = useGameStore((s) => s.toggleMuted);
  const openShop = useGameStore((s) => s.openShop);
  const openDaily = useGameStore((s) => s.openDaily);
  const coins = useGameStore((s) => s.coins);
  const [menuOpen, setMenuOpen] = useState(false);

  const prog = levelProgress(player.xp);
  const energyColor =
    player.energy > 50 ? 'var(--color-green)' : player.energy > 25 ? 'var(--color-amber)' : 'var(--color-red)';

  const unlocked = allBadges.filter((b) => badgeMap[b.id]).slice(-4);
  const stationFocus = focus?.kind === 'station' ? stations.find((s) => s.id === focus.id) : undefined;
  const npcFocus = focus?.kind === 'npc' ? npcs.find((n) => n.id === focus.id) : undefined;
  const showPrompt = !activeStation && !activeNpc && (stationFocus || npcFocus);

  const confirmReset = () => {
    if (window.confirm('هل تريد إعادة ضبط كل تقدّمك والبدء من جديد؟')) resetSave();
  };
  const controls: { id: string; icon: ReactNode; label: string; color: string; onClick: () => void }[] = [
    { id: 'guide', icon: <BookOpen size={15} />, label: 'الدليل', color: 'var(--color-blue)', onClick: openGuide },
    { id: 'daily', icon: <Flame size={15} />, label: 'التحديات', color: 'var(--color-red)', onClick: openDaily },
    { id: 'analytics', icon: <BarChart3 size={15} />, label: 'تحليلاتي', color: 'var(--color-green)', onClick: openAnalytics },
    { id: 'shop', icon: <ShoppingBag size={15} />, label: 'المتجر', color: 'var(--color-amber)', onClick: openShop },
    { id: 'character', icon: <Palette size={15} />, label: 'الشخصية', color: 'var(--color-charcoal)', onClick: openCharacter },
    {
      id: 'mute',
      icon: muted ? <VolumeX size={15} /> : <Volume2 size={15} />,
      label: muted ? 'تشغيل الصوت' : 'كتم الصوت',
      color: 'var(--color-muted)',
      onClick: toggleMuted,
    },
    { id: 'reset', icon: <RotateCcw size={14} />, label: 'إعادة ضبط', color: 'var(--color-muted)', onClick: confirmReset },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* ===================== DESKTOP TOP (sm+) ===================== */}
      <div className="hidden sm:block">
        <div className="flex items-start justify-between gap-3 p-4">
          {/* Player card */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-auto flex min-w-[280px] items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-card"
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-xl font-black text-white"
              style={{ background: player.avatar, ...frameStyle(player.frame) }}
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
                <span className="shrink-0 rounded-pill px-2 py-0.5 font-ui text-[11px] font-bold text-white" style={{ background: 'var(--color-black)' }}>
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

          {/* Brand + energy + coins + badges */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-auto flex flex-col items-end gap-2"
          >
            <div className="flex items-center gap-3 rounded-xl bg-black py-2 pe-4 ps-2 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-black">
                <img src="/logo/thamanyah.png" alt="ثمانية" className="h-8 w-8 select-none" draggable={false} />
              </span>
              <span className="h-8 w-px bg-white/15" />
              <div className="text-end leading-none">
                <p className="font-display text-base font-bold text-white">ثمانية</p>
                <p className="mt-0.5 font-ui text-[10px] text-white/55">تطوير الموظفين</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-card">
              <Zap size={16} style={{ color: energyColor }} />
              <div className="w-24"><ProgressBar pct={player.energy} color={energyColor} height={7} /></div>
              <span className="num font-ui text-xs font-bold" style={{ color: energyColor }}><NumberText value={player.energy} /></span>
              <span className="mx-0.5 h-4 w-px bg-warm-gray" />
              <button onClick={openShop} className="flex items-center gap-1 font-ui text-xs font-bold text-black" title="المتجر">
                <Coins size={14} className="text-amber" /> <NumberText value={coins} group />
              </button>
            </div>
            {unlocked.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 shadow-card">
                <Sparkles size={14} className="text-muted" />
                {unlocked.map((b) => (
                  <div key={b.id} title={b.nameAr} className="flex h-7 w-7 items-center justify-center rounded-full text-sm" style={{ background: b.color }}>
                    {b.icon}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Inline toolbar (desktop, top-center) */}
        <div className="pointer-events-none fixed top-3 left-1/2 z-30 flex -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-pill bg-white/70 p-1 backdrop-blur-sm">
          {controls.map((c) => (
            <button
              key={c.id}
              onClick={c.onClick}
              title={c.label}
              className="pointer-events-auto flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 font-ui text-xs font-bold shadow-soft transition hover:opacity-80"
              style={{ color: c.color }}
            >
              {c.icon} <span className="hidden md:inline">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===================== MOBILE TOP (below sm) ===================== */}
      {/* Compact stat chip — physical right */}
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto fixed top-3 right-3 flex items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 shadow-card sm:hidden"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-sm font-black text-white"
          style={{ background: player.avatar, ...frameStyle(player.frame) }}
        >
          {player.avatarImage ? (
            <img src={player.avatarImage} alt="" className="h-full w-full object-cover" style={{ imageRendering: 'pixelated' }} />
          ) : (
            player.nameAr.trim().charAt(0) || '؟'
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-pill bg-black px-1.5 py-0.5 font-ui text-[10px] font-bold text-white">
              <NumberText value={prog.level} />
            </span>
            <span className="num flex items-center gap-0.5 font-ui text-[11px] font-bold" style={{ color: energyColor }}>
              <Zap size={11} /> <NumberText value={player.energy} />
            </span>
            <span className="num flex items-center gap-0.5 font-ui text-[11px] font-bold text-black">
              <Coins size={11} className="text-amber" /> <NumberText value={coins} />
            </span>
          </div>
          <div className="mt-1 w-28"><ProgressBar pct={prog.pct} height={5} /></div>
        </div>
      </motion.div>

      {/* Menu — physical left */}
      <div className="pointer-events-none fixed top-3 left-3 z-30 flex flex-col items-start gap-2 sm:hidden">
        <div className="flex items-center gap-2">
          <img src="/logo/thamanyah.png" alt="ثمانية" className="pointer-events-auto h-9 w-9 rounded-lg bg-black p-1.5" draggable={false} />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black shadow-card"
            aria-label="القائمة"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              className="pointer-events-auto grid w-52 grid-cols-2 gap-1.5 rounded-xl bg-white p-2 shadow-float"
            >
              {controls.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    c.onClick();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-pill bg-off-white px-2.5 py-2 font-ui text-[11px] font-bold"
                  style={{ color: c.color }}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom interaction prompt (station or NPC) */}
      <AnimatePresence>
        {showPrompt && stationFocus && (
          <motion.button
            key={`st-${stationFocus.id}`}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={() => EventBus.emit('station:enter', { stationId: stationFocus.id })}
            className="pointer-events-auto fixed bottom-32 left-1/2 -translate-x-1/2 rounded-xl bg-white px-6 py-3 text-center shadow-float sm:bottom-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stationFocus.glyph}</span>
              <div className="text-start">
                <p className="font-display text-lg font-black text-black">{stationFocus.nameAr}</p>
                <p className="font-ui text-xs text-muted">{stationFocus.hintAr}</p>
              </div>
              <span className="ms-2 rounded-pill px-3 py-1 font-ui text-xs font-bold text-white" style={{ background: 'var(--color-green)' }}>
                {isTouch ? 'زر التفاعل ←' : <>اضغط <span className="num">E</span> للدخول</>}
              </span>
            </div>
          </motion.button>
        )}
        {showPrompt && npcFocus && (
          <motion.button
            key={`npc-${npcFocus.id}`}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={() => EventBus.emit('npc:talk', { npcId: npcFocus.id })}
            className="pointer-events-auto fixed bottom-32 left-1/2 -translate-x-1/2 rounded-xl bg-white px-6 py-3 text-center shadow-float sm:bottom-6"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-black text-white"
                style={{ background: npcFocus.tint }}
              >
                {npcFocus.nameAr.trim().charAt(0)}
              </span>
              <div className="text-start">
                <p className="font-display text-lg font-black text-black">{npcFocus.nameAr}</p>
                <p className="font-ui text-xs text-muted">{npcFocus.titleAr}</p>
              </div>
              <span className="ms-2 flex items-center gap-1 rounded-pill px-3 py-1 font-ui text-xs font-bold text-white" style={{ background: npcFocus.tint }}>
                <MessageSquare size={12} /> {isTouch ? 'تحدّث' : <>تحدّث · <span className="num">E</span></>}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
