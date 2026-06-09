import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { getNpc } from '@/data/npcs';
import { sfx } from '@/audio/sound';

export default function DialogueBox() {
  const activeNpc = useGameStore((s) => s.activeNpc);
  const endDialogue = useGameStore((s) => s.endDialogue);
  const npc = activeNpc ? getNpc(activeNpc) : undefined;

  const [line, setLine] = useState(0);
  const [shown, setShown] = useState('');
  const [typing, setTyping] = useState(false);
  const timer = useRef<number | null>(null);

  const full = npc?.lines[line] ?? '';

  // reset when a new conversation starts
  useEffect(() => {
    setLine(0);
  }, [activeNpc]);

  // typewriter
  useEffect(() => {
    if (!npc) return;
    setShown('');
    setTyping(true);
    let i = 0;
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) {
        if (timer.current) window.clearInterval(timer.current);
        setTyping(false);
      }
    }, 22);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [npc, line, full]);

  if (!npc) return null;

  const advance = () => {
    if (typing) {
      if (timer.current) window.clearInterval(timer.current);
      setShown(full);
      setTyping(false);
      return;
    }
    sfx('talk');
    if (line < npc.lines.length - 1) setLine((l) => l + 1);
    else endDialogue();
  };

  const isLast = line >= npc.lines.length - 1;

  return (
    <AnimatePresence>
      {activeNpc && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={advance}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="pointer-events-auto w-full max-w-2xl cursor-pointer rounded-xl bg-white p-4 shadow-float"
            style={{ borderBottom: `4px solid ${npc.tint}` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg font-display text-2xl font-black text-white"
                style={{ background: npc.tint }}
              >
                {npc.nameAr.trim().charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-black text-black">{npc.nameAr}</span>
                  <span className="rounded-pill bg-warm-gray px-2 py-0.5 font-ui text-[10px] font-bold text-muted">
                    {npc.titleAr}
                  </span>
                </div>
                <p className="mt-1 min-h-[44px] font-body text-base leading-relaxed text-charcoal">
                  {shown}
                  {typing && <span className="animate-pulse">▌</span>}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-1">
                {npc.lines.map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: i === line ? 18 : 6, background: i <= line ? npc.tint : 'var(--color-warm-gray)' }}
                  />
                ))}
              </div>
              <span className="flex items-center gap-1 font-ui text-xs font-bold" style={{ color: npc.tint }}>
                {typing ? 'تخطّي' : isLast ? 'تم' : 'التالي'} <ChevronLeft size={14} />
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
