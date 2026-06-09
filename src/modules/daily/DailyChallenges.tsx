import { motion } from 'framer-motion';
import { Flame, Check, Coins, Gift, Sparkles } from 'lucide-react';
import { useGameStore } from '@/state/store';
import { dailies, allDailiesDone, DAILY_REWARD } from '@/data/dailies';
import NumberText from '@/ui/NumberText';
import ProgressBar from '@/ui/ProgressBar';

export default function DailyChallenges() {
  const daily = useGameStore((s) => s.daily);
  const streak = useGameStore((s) => s.streak);
  const claimDaily = useGameStore((s) => s.claimDaily);

  const allDone = allDailiesDone(daily);

  return (
    <div>
      {/* streak */}
      <div className="mb-5 flex items-center justify-between rounded-lg p-4" style={{ background: 'var(--color-blush)' }}>
        <div>
          <p className="font-ui text-xs font-bold text-charcoal">سلسلة الأيام المتتالية</p>
          <p className="font-ui text-[11px] text-muted">واصل النشاط يوميًا لتكبر سلسلتك</p>
        </div>
        <span className="flex items-center gap-1.5 font-display text-3xl font-black text-black">
          <Flame size={26} className="text-red" /> <NumberText value={streak} />
        </span>
      </div>

      <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-black text-black">
        <Sparkles size={18} className="text-green" /> تحديات اليوم
      </h3>
      <div className="space-y-3">
        {dailies.map((c) => {
          const cur = c.current(daily);
          const done = c.done(daily);
          return (
            <div key={c.id} className="rounded-lg bg-white p-3 shadow-soft">
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ background: done ? 'var(--color-green)' : 'var(--color-warm-gray)' }}
                >
                  {done && <Check size={14} className="text-white" />}
                </span>
                <span className={`flex-1 font-ui text-sm ${done ? 'font-bold text-black' : 'text-charcoal'}`}>{c.labelAr}</span>
                <span className="num font-ui text-xs font-bold text-muted">
                  <NumberText value={cur} /> / <NumberText value={c.target} />
                </span>
              </div>
              <ProgressBar pct={(cur / c.target) * 100} color={done ? 'var(--color-green)' : 'var(--color-blue)'} height={6} />
            </div>
          );
        })}
      </div>

      {/* reward */}
      <motion.button
        onClick={claimDaily}
        disabled={!allDone || daily.claimed}
        whileTap={{ scale: 0.97 }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-pill py-3 font-ui text-sm font-bold text-white disabled:opacity-50"
        style={{ background: daily.claimed ? 'var(--color-muted)' : 'var(--color-green)' }}
      >
        {daily.claimed ? (
          <>
            <Check size={16} /> تم استلام مكافأة اليوم
          </>
        ) : (
          <>
            <Gift size={16} /> استلم المكافأة: <Coins size={14} className="text-amber" /> <NumberText value={DAILY_REWARD.coins} /> + <NumberText value={DAILY_REWARD.xp} /> خبرة
          </>
        )}
      </motion.button>
      {!allDone && !daily.claimed && (
        <p className="mt-2 text-center font-ui text-[11px] text-muted">أكمل كل التحديات لاستلام المكافأة.</p>
      )}
    </div>
  );
}
