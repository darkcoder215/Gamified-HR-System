import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lock, Loader2, UserCheck, ChevronUp, Star } from 'lucide-react';
import { careerLadder } from '@/data/careerLadder';
import { getCompetency } from '@/data/competencies';
import { orgTiers } from '@/data/orgChart';
import { useGameStore } from '@/state/store';
import { usePromotionEligibility } from '@/state/selectors';
import { levelProgress } from '@/state/gamification';
import NumberText from '@/ui/NumberText';
import { celebrate } from '@/animation/confetti';
import { sfx } from '@/audio/sound';

type Phase = 'idle' | 'requesting' | 'approved';

function PeopleStrip({ level }: { level: number }) {
  const people = orgTiers.find((t) => t.level === level)?.people ?? [];
  if (!people.length) return null;
  return (
    <div className="flex -space-x-2 rtl:space-x-reverse">
      {people.slice(0, 4).map((p) => (
        <div
          key={p.id}
          title={p.nameAr}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white font-ui text-[11px] font-bold text-white"
          style={{ background: p.avatar }}
        >
          {p.nameAr.trim().charAt(0)}
        </div>
      ))}
    </div>
  );
}

export default function CareerLadder() {
  const player = useGameStore((s) => s.player);
  const currentRung = useGameStore((s) => s.promotionStatus.currentRung);
  const requestPromotion = useGameStore((s) => s.requestPromotion);
  const approvePromotion = useGameStore((s) => s.approvePromotion);
  const elig = usePromotionEligibility();
  const prog = levelProgress(player.xp);
  const [phase, setPhase] = useState<Phase>('idle');

  const needsApproval = elig.next?.requiresManagerApproval ?? false;

  const handleRequest = () => {
    if (!elig.next) return;
    setPhase('requesting');
    requestPromotion();
    window.setTimeout(() => {
      approvePromotion();
      celebrate();
      sfx('promote');
      setPhase('approved');
      window.setTimeout(() => setPhase('idle'), 2600);
    }, 1900);
  };

  const PlayerToken = (
    <motion.div
      layoutId="player-tower-token"
      className="flex items-center gap-1.5 rounded-pill bg-black px-2.5 py-1 shadow-float"
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
    >
      <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full text-[11px] font-black text-white" style={{ background: player.avatar }}>
        {player.avatarImage ? (
          <img src={player.avatarImage} alt="" className="h-full w-full object-cover" style={{ imageRendering: 'pixelated' }} />
        ) : (
          player.nameAr.trim().charAt(0)
        )}
      </span>
      <span className="font-ui text-[11px] font-bold text-white">أنت</span>
    </motion.div>
  );

  const rungs = [...careerLadder].reverse();

  return (
    <div className="relative">
      {/* Goal card */}
      {elig.next ? (
        <div
          className="mb-6 overflow-hidden rounded-xl p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #00c17a, #0072f9)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-ui text-xs font-bold text-white/80">ترقيتك القادمة</p>
              <h3 className="font-display text-2xl font-black">{elig.next.titleAr}</h3>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl font-black">
                <NumberText value={prog.level} />
              </p>
              <p className="font-ui text-[10px] text-white/80">مستواك</p>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between font-ui text-[11px] text-white/90">
              <span>الخبرة</span>
              <span className="num">
                <NumberText value={Math.min(player.xp, elig.next.xpThreshold)} group /> / <NumberText value={elig.next.xpThreshold} group />
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-pill bg-white/25">
              <motion.div
                className="h-full rounded-pill bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (player.xp / elig.next.xpThreshold) * 100)}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
          </div>

          {/* requirement chips */}
          {elig.competencyChecks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {elig.competencyChecks.map((c) => {
                const comp = getCompetency(c.competencyId);
                return (
                  <span
                    key={c.competencyId}
                    className="flex items-center gap-1 rounded-pill px-2.5 py-1 font-ui text-[11px] font-bold"
                    style={{ background: c.met ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)', color: c.met ? '#00865a' : '#fff' }}
                  >
                    {c.met ? <Check size={12} /> : <Lock size={11} />}
                    {comp?.nameAr} <span className="num">{c.score}%/{c.minScore}%</span>
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            {needsApproval && (
              <span className="flex items-center gap-1 font-ui text-[11px] text-white/80">
                <UserCheck size={13} /> تتطلّب موافقة المدير
              </span>
            )}
            <button
              disabled={!elig.allMet || phase !== 'idle'}
              onClick={handleRequest}
              className="ms-auto flex items-center gap-1.5 rounded-pill bg-white px-5 py-2.5 font-ui text-sm font-bold text-black shadow-card transition disabled:opacity-50"
            >
              <ChevronUp size={16} />
              {elig.allMet ? 'اطلب الترقية الآن' : 'أكمل المتطلبات أولًا'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl bg-green-light p-5 text-center">
          <p className="font-display text-xl font-black text-black">🎉 بلغت قمّة المسار المهني!</p>
        </div>
      )}

      {/* The tower */}
      <p className="mb-3 font-ui text-xs font-bold text-muted">سلّم الترقيات — من الأسفل إلى القمّة</p>
      <div className="space-y-2">
        {rungs.map((rung, idx) => {
          const isCurrent = rung.level === currentRung;
          const isPast = rung.level < currentRung;
          const isTop = idx === 0;
          return (
            <motion.div
              key={rung.level}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="relative flex items-center gap-3 rounded-lg p-3"
              style={{
                background: isCurrent
                  ? 'var(--color-green-light)'
                  : isPast
                  ? 'var(--color-white)'
                  : 'var(--color-cream)',
                border: isCurrent ? '2px solid var(--color-green)' : '1px solid var(--color-warm-gray)',
                opacity: isPast || isCurrent ? 1 : 0.85,
              }}
            >
              {isTop && (
                <span className="absolute -top-2 right-4 text-lg" title="القمّة">
                  👑
                </span>
              )}
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-display text-lg font-black text-white"
                style={{ background: isPast ? 'var(--color-green)' : isCurrent ? 'var(--color-black)' : 'var(--color-muted)' }}
              >
                {isPast ? <Check size={20} /> : isCurrent ? <Star size={18} /> : <Lock size={16} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-ui text-sm font-bold text-black">{rung.titleAr}</h4>
                  <span className="num rounded-pill bg-warm-gray px-2 py-0.5 font-ui text-[10px] font-bold text-muted">
                    <NumberText value={rung.xpThreshold} group /> خبرة
                  </span>
                </div>
                <p className="font-ui text-[11px] text-muted">{rung.descAr}</p>
              </div>
              <PeopleStrip level={rung.level} />
              {isCurrent && PlayerToken}
            </motion.div>
          );
        })}
      </div>

      {/* Approval overlay */}
      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(247,244,238,0.93)', backdropFilter: 'blur(2px)' }}
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
                  : 'تمّت الموافقة على ترقيتك! 🎉'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
