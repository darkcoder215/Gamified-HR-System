import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lock, TrendingUp, Loader2, UserCheck } from 'lucide-react';
import { careerLadder } from '@/data/careerLadder';
import { getCompetency } from '@/data/competencies';
import { useGameStore } from '@/state/store';
import { usePromotionEligibility } from '@/state/selectors';
import Button from '@/ui/Button';
import NumberText from '@/ui/NumberText';
import ProgressBar from '@/ui/ProgressBar';
import { celebrate } from '@/animation/confetti';

type Phase = 'idle' | 'requesting' | 'approved';

export default function CareerLadder() {
  const xp = useGameStore((s) => s.player.xp);
  const currentRung = useGameStore((s) => s.promotionStatus.currentRung);
  const requestPromotion = useGameStore((s) => s.requestPromotion);
  const approvePromotion = useGameStore((s) => s.approvePromotion);
  const elig = usePromotionEligibility();
  const [phase, setPhase] = useState<Phase>('idle');

  const handleRequest = () => {
    if (!elig.next) return;
    setPhase('requesting');
    requestPromotion();
    window.setTimeout(() => {
      approvePromotion();
      celebrate();
      setPhase('approved');
      window.setTimeout(() => setPhase('idle'), 2600);
    }, 1900);
  };

  const needsApproval = elig.next?.requiresManagerApproval ?? false;

  // Ladder rendered top (highest) to bottom (lowest)
  const rungs = [...careerLadder].reverse();

  return (
    <div className="relative">
      {/* Eligibility panel for the next promotion */}
      {elig.next ? (
        <div className="mb-6 rounded-lg bg-white p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-green" />
            <h3 className="font-display text-lg font-black text-black">
              الترقية التالية: <span className="highlight">{elig.next.titleAr}</span>
            </h3>
          </div>

          {/* XP requirement */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between font-ui text-xs">
              <span className="font-bold text-charcoal">الخبرة المطلوبة</span>
              <span className={elig.xpMet ? 'font-bold text-green' : 'text-muted'}>
                <NumberText value={Math.min(xp, elig.next.xpThreshold)} group /> / <NumberText value={elig.next.xpThreshold} group />
              </span>
            </div>
            <ProgressBar pct={Math.min(100, (xp / elig.next.xpThreshold) * 100)} />
          </div>

          {/* Competency requirements */}
          {elig.competencyChecks.length > 0 && (
            <div className="space-y-2">
              {elig.competencyChecks.map((c) => {
                const comp = getCompetency(c.competencyId);
                return (
                  <div key={c.competencyId} className="flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: c.met ? 'var(--color-green)' : 'var(--color-warm-gray)' }}
                    >
                      {c.met ? <Check size={14} className="text-white" /> : <Lock size={12} className="text-muted" />}
                    </div>
                    <span className="flex-1 font-ui text-sm text-charcoal">{comp?.nameAr}</span>
                    <span className={`font-ui text-xs font-bold ${c.met ? 'text-green' : 'text-muted'}`}>
                      <NumberText value={c.score} />% / <NumberText value={c.minScore} />%
                    </span>
                  </div>
                );
              })}
              <p className="pt-1 font-ui text-[11px] text-muted">
                ارفع تقييم مهاراتك في «ساحة التقييم» لاستيفاء المتطلبات.
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            {elig.next.requiresManagerApproval && (
              <span className="flex items-center gap-1 font-ui text-xs text-muted">
                <UserCheck size={14} /> تتطلّب موافقة المدير
              </span>
            )}
            <Button
              variant={elig.allMet ? 'accent' : 'secondary'}
              disabled={!elig.allMet || phase !== 'idle'}
              onClick={handleRequest}
              className="ms-auto"
            >
              {elig.allMet ? 'اطلب الترقية' : 'لم تستوفِ المتطلبات بعد'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg bg-green-light p-5 text-center">
          <p className="font-display text-lg font-black text-black">🎉 بلغت أعلى رتبة في المسار!</p>
        </div>
      )}

      {/* The ladder */}
      <div className="relative space-y-2">
        {rungs.map((rung) => {
          const isCurrent = rung.level === currentRung;
          const isPast = rung.level < currentRung;
          return (
            <div
              key={rung.level}
              className="flex items-center gap-3 rounded-lg p-3 transition"
              style={{
                background: isCurrent ? 'var(--color-green-light)' : 'var(--color-white)',
                border: isCurrent ? '2px solid var(--color-green)' : '1px solid var(--color-warm-gray)',
                opacity: rung.level > currentRung + (elig.next ? 0 : 0) && !isCurrent && !isPast ? 0.7 : 1,
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-black text-white"
                style={{ background: isPast ? 'var(--color-green)' : isCurrent ? 'var(--color-black)' : 'var(--color-muted)' }}
              >
                {isPast ? <Check size={18} /> : <NumberText value={rung.level} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-ui text-sm font-bold text-black">{rung.titleAr}</h4>
                  {isCurrent && (
                    <span className="rounded-pill bg-black px-2 py-0.5 font-ui text-[10px] font-bold text-white">رتبتك الحالية</span>
                  )}
                </div>
                <p className="font-ui text-xs text-muted">{rung.descAr}</p>
              </div>
              <span className="font-ui text-[11px] font-bold text-muted">
                <NumberText value={rung.xpThreshold} group /> خبرة
              </span>
            </div>
          );
        })}
      </div>

      {/* Approval overlay */}
      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(247,244,238,0.92)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-charcoal text-white">
                {phase === 'requesting' ? (
                  <Loader2 size={36} className="animate-spin" />
                ) : (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <UserCheck size={36} className="text-green" />
                  </motion.div>
                )}
              </div>
              <p className="mt-4 font-display text-xl font-black text-black">
                {phase === 'requesting'
                  ? needsApproval
                    ? 'يراجع مديرك طلب ترقيتك…'
                    : 'جارٍ ترقيتك…'
                  : 'تمّت الموافقة على ترقيتك!'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
