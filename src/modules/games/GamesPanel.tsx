import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, Zap, RotateCcw, Gauge } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { decisionBank, shuffle, type TFStatement } from '@/data/miniGames';
import { sfx } from '@/audio/sound';
import { smallBurst } from '@/animation/confetti';
import Button from '@/ui/Button';
import ScoreBadge from '@/ui/ScoreBadge';
import NumberText from '@/ui/NumberText';

type Phase = 'intro' | 'play' | 'done';
const ROUND = 8;

export default function GamesPanel() {
  const recordGameResult = useGameStore((s) => s.recordGameResult);
  const [phase, setPhase] = useState<Phase>('intro');
  const [items, setItems] = useState<TFStatement[]>([]);
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);

  const start = () => {
    setItems(shuffle(decisionBank).slice(0, ROUND));
    setI(0); setCorrect(0); setPicked(null); setPhase('play');
  };

  const q = items[i];

  const answer = (val: boolean) => {
    if (picked !== null || !q) return;
    setPicked(val);
    const ok = val === q.answer;
    if (ok) { setCorrect((c) => c + 1); sfx('correct'); smallBurst(); } else sfx('wrong');
    window.setTimeout(() => {
      if (i >= items.length - 1) finish(ok ? correct + 1 : correct);
      else { setI((n) => n + 1); setPicked(null); }
    }, 650);
  };

  const finish = (finalCorrect: number) => {
    const scorePct = Math.round((finalCorrect / items.length) * 100);
    recordGameResult('problem', scorePct, finalCorrect * 8, finalCorrect * 3);
    setPhase('done');
  };

  const scorePct = useMemo(() => Math.round((correct / Math.max(1, items.length)) * 100), [correct, items.length]);

  if (phase === 'intro')
    return (
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue text-white"><Gauge size={30} /></div>
        <h3 className="font-display text-2xl font-black text-black">تحدّي القرار السريع</h3>
        <p className="mx-auto mt-2 max-w-sm font-body text-sm text-charcoal">
          ٨ عبارات عن حلّ المشكلات واتخاذ القرار — حدّد بسرعة إن كانت <b>صحيحة</b> أم <b>خاطئة</b>. كل إجابة صحيحة تمنحك خبرة وعملات وترفع مهارة «حل المشكلات».
        </p>
        <Button variant="accent" onClick={start} className="mt-5">ابدأ التحدّي</Button>
      </div>
    );

  if (phase === 'done')
    return (
      <div className="flex flex-col items-center text-center">
        <ScoreBadge score={scorePct} />
        <h3 className="mt-4 font-display text-2xl font-black text-black">انتهى التحدّي!</h3>
        <div className="mt-3 grid w-full max-w-sm grid-cols-2 gap-3">
          <div className="rounded-lg bg-white p-3 shadow-soft"><p className="font-ui text-xs text-muted">إجابات صحيحة</p><p className="font-display text-2xl font-black text-green"><NumberText value={correct} /> / <NumberText value={items.length} /></p></div>
          <div className="rounded-lg bg-white p-3 shadow-soft"><p className="font-ui text-xs text-muted">خبرة</p><p className="font-display text-2xl font-black text-blue">+<NumberText value={correct * 8} /></p></div>
        </div>
        <Button variant="accent" onClick={start} className="mt-5"><RotateCcw size={16} className="ms-1 inline" /> مرة أخرى</Button>
      </div>
    );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-pill bg-warm-gray px-3 py-1 font-ui text-xs font-bold text-charcoal">عبارة <NumberText value={i + 1} /> / <NumberText value={items.length} /></span>
        <span className="flex items-center gap-1 font-ui text-xs font-bold text-green"><Zap size={14} /> <NumberText value={correct} /></span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
          <div className="mb-6 rounded-xl bg-white p-6 text-center shadow-card">
            <p className="font-display text-xl font-bold leading-relaxed text-black">{q.textAr}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map((val) => {
              const isAns = picked !== null && q.answer === val;
              const isWrongPick = picked === val && val !== q.answer;
              return (
                <motion.button
                  key={String(val)}
                  disabled={picked !== null}
                  onClick={() => answer(val)}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 py-4 font-ui text-lg font-bold transition"
                  style={{
                    background: isAns ? 'var(--color-green-light)' : isWrongPick ? 'var(--color-blush)' : 'var(--color-white)',
                    borderColor: isAns ? 'var(--color-green)' : isWrongPick ? 'var(--color-red)' : 'var(--color-warm-gray)',
                    color: 'var(--color-black)',
                  }}
                >
                  {val ? <Check size={20} className="text-green" /> : <X size={20} className="text-red" />} {val ? 'صحيح' : 'خطأ'}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
