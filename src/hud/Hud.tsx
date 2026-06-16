import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, Sparkles, RotateCcw, Palette, BookOpen, BarChart3, Volume2, VolumeX, MessageSquare, ShoppingBag, Coins, Flame, Menu, X, Map as MapIcon, Lock, Bell, Inbox, Building2, LogOut, LayoutDashboard } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { levelProgress } from '@/state/gamification';
import { stations } from '@/game/stations/stationZones';
import { npcs } from '@/data/npcs';
import { badges as allBadges } from '@/data/badges';
import { frameStyle } from '@/data/frames';
import { isStationUnlocked, stationUnlockLevel } from '@/data/zones';
import { PawPrint, Target, Gamepad2 } from 'lucide-react';
import PetSprite from '@/ui/PetSprite';
import { useFocus } from '@/hooks/useFocus';
import { useIsTouch } from '@/hooks/useIsTouch';
import { EventBus } from '@/game/EventBus';
import NumberText from '@/ui/NumberText';
import ProgressBar from '@/ui/ProgressBar';

interface HudProps {
  backend?: boolean;
  unread?: number;
  onExit?: () => void;
  signOut?: () => void;
}

export default function Hud({ backend, unread = 0, onExit, signOut }: HudProps = {}) {
  const player = useGameStore((s) => s.player);
  const badgeMap = useGameStore((s) => s.badges);
  const openNotif = useGameStore((s) => s.openNotif);
  const openInbox = useGameStore((s) => s.openInbox);
  const openEmbassy = useGameStore((s) => s.openEmbassy);
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
  const openZones = useGameStore((s) => s.openZones);
  const openPets = useGameStore((s) => s.openPets);
  const openGoals = useGameStore((s) => s.openGoals);
  const openGames = useGameStore((s) => s.openGames);
  const equippedPet = useGameStore((s) => s.equippedPet);
  const coins = useGameStore((s) => s.coins);
  const level = useGameStore((s) => s.player.level);
  const [menuOpen, setMenuOpen] = useState(false);

  const prog = levelProgress(player.xp);
  const energyColor =
    player.energy > 50 ? 'var(--color-green)' : player.energy > 25 ? 'var(--color-amber)' : 'var(--color-red)';

  const unlocked = allBadges.filter((b) => badgeMap[b.id]).slice(-4);
  const stationFocus = focus?.kind === 'station' ? stations.find((s) => s.id === focus.id) : undefined;
  const npcFocus = focus?.kind === 'npc' ? npcs.find((n) => n.id === focus.id) : undefined;
  const activityFocus = focus?.kind === 'activity' ? stations.find((s) => s.id === focus.id) : undefined;
  const exitFocus = focus?.kind === 'exit';
  const stationLocked = stationFocus ? !isStationUnlocked(stationFocus.id, level) : false;
  const showPrompt = !activeStation && !activeNpc && (stationFocus || npcFocus || activityFocus || exitFocus);

  const confirmReset = () => {
    if (window.confirm('Do you want to reset all your progress and start over?')) resetSave();
  };
  const controls: { id: string; icon: ReactNode; label: string; color: string; onClick: () => void }[] = [
    { id: 'guide', icon: <BookOpen size={15} />, label: 'Guide', color: 'var(--color-blue)', onClick: openGuide },
    { id: 'zones', icon: <MapIcon size={15} />, label: 'Districts', color: 'var(--color-green)', onClick: openZones },
    { id: 'daily', icon: <Flame size={15} />, label: 'Challenges', color: 'var(--color-red)', onClick: openDaily },
    { id: 'goals', icon: <Target size={15} />, label: 'My Goals', color: 'var(--color-green)', onClick: openGoals },
    { id: 'games', icon: <Gamepad2 size={15} />, label: 'Games', color: 'var(--color-blue)', onClick: openGames },
    { id: 'analytics', icon: <BarChart3 size={15} />, label: 'My Analytics', color: 'var(--color-green)', onClick: openAnalytics },
    { id: 'shop', icon: <ShoppingBag size={15} />, label: 'Shop', color: 'var(--color-amber)', onClick: openShop },
    { id: 'pets', icon: <PawPrint size={15} />, label: 'Companions', color: 'var(--color-hot-pink)', onClick: openPets },
    { id: 'character', icon: <Palette size={15} />, label: 'Character', color: 'var(--color-charcoal)', onClick: openCharacter },
    {
      id: 'mute',
      icon: muted ? <VolumeX size={15} /> : <Volume2 size={15} />,
      label: muted ? 'Unmute' : 'Mute',
      color: 'var(--color-muted)',
      onClick: toggleMuted,
    },
    { id: 'reset', icon: <RotateCcw size={14} />, label: 'Reset', color: 'var(--color-muted)', onClick: confirmReset },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-3 p-4">
        {/* Player card */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto flex max-w-[44vw] items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-card sm:max-w-none sm:min-w-[280px] sm:gap-3 sm:px-4 sm:py-3"
        >
          <div className="relative shrink-0">
            <div
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full font-display text-base font-black text-white sm:h-12 sm:w-12 sm:text-xl"
              style={{ background: player.avatar, ...frameStyle(player.frame) }}
            >
              {player.avatarImage ? (
                <img src={player.avatarImage} alt="" className="h-full w-full object-cover" style={{ imageRendering: 'pixelated' }} />
              ) : (
                player.nameAr.trim().charAt(0) || '?'
              )}
            </div>
            {equippedPet && (
              <motion.div
                className="absolute -top-2 -end-2"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <PetSprite id={equippedPet} size={22} />
              </motion.div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-display text-base font-bold text-black">{player.nameAr}</span>
              <span
                className="shrink-0 whitespace-nowrap rounded-pill px-1.5 py-0.5 font-ui text-[11px] font-bold text-white"
                style={{ background: 'var(--color-black)' }}
              >
                LV <NumberText value={prog.level} />
              </span>
            </div>
            <p className="hidden font-ui text-xs text-muted sm:block">{player.titleAr}</p>
            <div className="mt-1.5">
              <ProgressBar pct={prog.pct} glow height={7} />
              <div className="mt-0.5 hidden justify-between font-ui text-[10px] text-muted sm:flex">
                <span>
                  <NumberText value={prog.currentLevelXp} /> / <NumberText value={prog.neededForNext} /> XP
                </span>
                <span>Next: <NumberText value={prog.xpToNext} /></span>
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
          <div className="flex items-center gap-3 rounded-xl bg-black p-2 shadow-card sm:py-2 sm:pe-4 sm:ps-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black sm:h-10 sm:w-10">
              <img
                src="/logo/powr-mark.svg"
                alt="POWR"
                className="h-7 w-7 select-none sm:h-8 sm:w-8"
                draggable={false}
                style={{ imageRendering: 'auto' }}
              />
            </span>
            <span className="hidden h-8 w-px bg-white/15 sm:block" />
            <div className="hidden text-end leading-none sm:block">
              <p className="font-display text-base font-bold text-white">POWR</p>
              <p className="mt-0.5 font-ui text-[10px] text-white/55">Employee Development</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 shadow-card sm:px-3 sm:py-2">
            <Zap size={16} style={{ color: energyColor }} />
            <div className="w-16 sm:w-28">
              <ProgressBar pct={player.energy} color={energyColor} height={7} />
            </div>
            <span className="num font-ui text-xs font-bold" style={{ color: energyColor }}>
              <NumberText value={player.energy} />
            </span>
            <span className="mx-0.5 h-4 w-px bg-warm-gray" />
            <button onClick={openShop} className="pointer-events-auto flex items-center gap-1 font-ui text-xs font-bold text-black" title="Shop">
              <Coins size={14} className="text-amber" /> <NumberText value={coins} group />
            </button>
          </div>

          {unlocked.length > 0 && (
            <div className="hidden items-center gap-1.5 rounded-xl bg-white px-3 py-2 shadow-card sm:flex">
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

      {/* Control toolbar — inline on desktop */}
      <div className="pointer-events-none fixed top-3 left-1/2 z-30 hidden -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-pill bg-white/90 p-1 sm:flex">
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

      {/* Control menu — full-screen sheet on mobile (keeps clear of the HUD bars) */}
      <div className="sm:hidden">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="pointer-events-auto fixed top-3 left-1/2 z-40 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-white text-black shadow-card"
          aria-label="Menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
          {backend && unread > 0 && !menuOpen && (
            <span className="num absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">{unread}</span>
          )}
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="pointer-events-auto fixed inset-0 z-[39] flex items-start justify-center bg-black/40 p-4 pt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[78vh] w-full max-w-xs overflow-y-auto rounded-xl bg-white p-3 shadow-float"
              >
                <p className="mb-1.5 px-1 font-ui text-[11px] font-bold uppercase tracking-wide text-muted">Menu</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {controls.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { c.onClick(); setMenuOpen(false); }}
                      className="flex items-center gap-1.5 rounded-pill bg-off-white px-3 py-2 font-ui text-xs font-bold"
                      style={{ color: c.color }}
                    >
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>

                {backend && (
                  <>
                    <p className="mb-1.5 mt-3 px-1 font-ui text-[11px] font-bold uppercase tracking-wide text-muted">Workspace</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button onClick={() => { openNotif(); setMenuOpen(false); }} className="relative flex items-center gap-1.5 rounded-pill bg-off-white px-3 py-2 font-ui text-xs font-bold text-charcoal">
                        <Bell size={15} /> Notifications
                        {unread > 0 && <span className="num absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">{unread}</span>}
                      </button>
                      <button onClick={() => { openInbox(); setMenuOpen(false); }} className="flex items-center gap-1.5 rounded-pill bg-off-white px-3 py-2 font-ui text-xs font-bold text-blue"><Inbox size={15} /> My Tasks</button>
                      <button onClick={() => { openEmbassy(); setMenuOpen(false); }} className="flex items-center gap-1.5 rounded-pill bg-off-white px-3 py-2 font-ui text-xs font-bold text-amber"><Building2 size={15} /> Embassy</button>
                      {onExit && <button onClick={() => { onExit(); setMenuOpen(false); }} className="flex items-center gap-1.5 rounded-pill bg-black px-3 py-2 font-ui text-xs font-bold text-white"><LayoutDashboard size={15} /> Dashboard</button>}
                      {signOut && <button onClick={() => { signOut(); setMenuOpen(false); }} className="col-span-2 flex items-center justify-center gap-1.5 rounded-pill bg-off-white px-3 py-2 font-ui text-xs font-bold text-muted"><LogOut size={15} /> Sign out</button>}
                    </div>
                  </>
                )}
              </motion.div>
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
            onClick={() =>
              EventBus.emit(stationLocked ? 'station:locked' : 'station:enter', { stationId: stationFocus.id })
            }
            className="pointer-events-auto fixed bottom-32 left-1/2 -translate-x-1/2 rounded-xl bg-white px-6 py-3 text-center shadow-float sm:bottom-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" style={{ filter: stationLocked ? 'grayscale(1)' : undefined }}>{stationFocus.glyph}</span>
              <div className="text-start">
                <p className="font-display text-lg font-black text-black">{stationFocus.nameAr}</p>
                <p className="font-ui text-xs text-muted">{stationFocus.hintAr}</p>
              </div>
              {stationLocked ? (
                <span className="ms-2 flex items-center gap-1 rounded-pill px-3 py-1 font-ui text-xs font-bold text-white" style={{ background: 'var(--color-muted)' }}>
                  <Lock size={12} /> Level <span className="num">{stationUnlockLevel(stationFocus.id)}</span>
                </span>
              ) : (
                <span className="ms-2 rounded-pill px-3 py-1 font-ui text-xs font-bold text-white" style={{ background: 'var(--color-green)' }}>
                  {isTouch ? 'Interact button ←' : <>Press <span className="num">E</span> to enter</>}
                </span>
              )}
            </div>
          </motion.button>
        )}
        {showPrompt && activityFocus && (
          <motion.button
            key={`act-${activityFocus.id}`}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={() => EventBus.emit('station:enter', { stationId: activityFocus.id })}
            className="pointer-events-auto fixed bottom-32 left-1/2 -translate-x-1/2 rounded-xl bg-white px-6 py-3 text-center shadow-float sm:bottom-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activityFocus.glyph}</span>
              <div className="text-start">
                <p className="font-display text-lg font-black text-black">{activityFocus.nameAr}</p>
                <p className="font-ui text-xs text-muted">{activityFocus.hintAr}</p>
              </div>
              <span className="ms-2 rounded-pill px-3 py-1 font-ui text-xs font-bold text-white" style={{ background: 'var(--color-green)' }}>
                {isTouch ? 'Start ←' : <>Press <span className="num">E</span> to start</>}
              </span>
            </div>
          </motion.button>
        )}
        {showPrompt && exitFocus && (
          <motion.button
            key="exit-door"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={() => EventBus.emit('input:interact')}
            className="pointer-events-auto fixed bottom-32 left-1/2 -translate-x-1/2 rounded-xl bg-white px-6 py-3 text-center shadow-float sm:bottom-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚪</span>
              <div className="text-start">
                <p className="font-display text-lg font-black text-black">Exit</p>
                <p className="font-ui text-xs text-muted">Back to the city</p>
              </div>
              <span className="ms-2 rounded-pill px-3 py-1 font-ui text-xs font-bold text-white" style={{ background: 'var(--color-charcoal)' }}>
                {isTouch ? 'Exit ←' : <>Press <span className="num">E</span> to exit</>}
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
                <MessageSquare size={12} /> {isTouch ? 'Talk' : <>Talk · <span className="num">E</span></>}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
