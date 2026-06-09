import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Swords, ClipboardList, Award, TrendingUp, Zap, ArrowUpRight, Lightbulb } from 'lucide-react';
import { competencies, getCompetency } from '@/data/competencies';
import { quests } from '@/data/quests';
import { badges as allBadges } from '@/data/badges';
import { useGameStore } from '@/state/store';
import { usePromotionEligibility, useLeaderboard } from '@/state/selectors';
import { levelProgress } from '@/state/gamification';
import { scoreColor } from '@/lib/score';
import NumberText from '@/ui/NumberText';
import ProgressBar from '@/ui/ProgressBar';

function Radar({ scores }: { scores: Record<string, number> }) {
  const n = competencies.length;
  const size = 240;
  const c = size / 2;
  const R = c - 34;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, r: number) => [c + r * Math.cos(angle(i)), c + r * Math.sin(angle(i))];
  const rings = [0.25, 0.5, 0.75, 1];

  const valuePts = competencies.map((comp, i) => pt(i, R * ((scores[comp.id] ?? 0) / 100)));
  const poly = valuePts.map((p) => p.join(',')).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {rings.map((rr, k) => (
        <polygon
          key={k}
          points={competencies.map((_, i) => pt(i, R * rr).join(',')).join(' ')}
          fill="none"
          stroke="var(--color-warm-gray)"
          strokeWidth={1}
        />
      ))}
      {competencies.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--color-warm-gray)" strokeWidth={1} />;
      })}
      <motion.polygon
        points={poly}
        fill="rgba(0,193,122,0.22)"
        stroke="var(--color-green)"
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: 'center' }}
      />
      {competencies.map((comp, i) => {
        const [x, y] = pt(i, R + 16);
        return (
          <text
            key={comp.id}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 700, fill: 'var(--color-charcoal)' }}
          >
            {comp.nameAr}
          </text>
        );
      })}
    </svg>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="rounded-lg bg-white p-3 shadow-soft">
      <div className="mb-1 flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="font-ui text-[11px] font-bold text-muted">{label}</span>
      </div>
      <p className="font-display text-2xl font-black text-black">{value}</p>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const player = useGameStore((s) => s.player);
  const competencyScores = useGameStore((s) => s.competencyScores);
  const assessmentHistory = useGameStore((s) => s.assessmentHistory);
  const questProgress = useGameStore((s) => s.questProgress);
  const badgeMap = useGameStore((s) => s.badges);
  const elig = usePromotionEligibility();
  const ranked = useLeaderboard();
  const prog = levelProgress(player.xp);

  const rank = ranked.find((r) => r.isPlayer)?.rank ?? ranked.length;
  const doneQuests = Object.values(questProgress).filter((q) => q.done).length;
  const badgeCount = allBadges.filter((b) => badgeMap[b.id]).length;
  const avgAccuracy = assessmentHistory.length
    ? Math.round(assessmentHistory.reduce((s, a) => s + a.scorePct, 0) / assessmentHistory.length)
    : 0;

  // "How to progress" recommendations, derived from state.
  const tips = useMemo(() => {
    const out: string[] = [];
    if (assessmentHistory.length === 0) out.push('ابدأ بأول تقييم في «ساحة التقييم» لرفع مهاراتك وكسب الخبرة.');
    const unmet = elig.competencyChecks.filter((c) => !c.met).sort((a, b) => a.score - b.score);
    if (unmet[0]) {
      const comp = getCompetency(unmet[0].competencyId);
      out.push(
        `ارفع مهارة «${comp?.nameAr}» في الساحة — الحالي ${unmet[0].score}% والمطلوب ${unmet[0].minScore}% للترقية القادمة.`
      );
    }
    if (elig.next && !elig.xpMet) {
      out.push(`تحتاج ${Math.max(0, elig.next.xpThreshold - player.xp)} نقطة خبرة إضافية للترقية — أكمل مهامًا أو تقييمات.`);
    }
    const remainingQuests = quests.length - doneQuests;
    if (remainingQuests > 0) out.push(`أكمل المهام المتبقية (${remainingQuests}) لكسب خبرة وأوسمة إضافية.`);
    if (player.energy <= 25) out.push('طاقتك منخفضة — انتظر قليلًا لتتعافى قبل خوض نزال جديد.');
    if (elig.allMet) out.push('أنت مؤهّل للترقية الآن! توجّه إلى «برج الترقيات» واطلبها. 🎉');
    if (!elig.next) out.push('بلغت أعلى رتبة في المسار — حافظ على صدارتك وارفع كل مهاراتك إلى الإتقان.');
    return out.slice(0, 4);
  }, [assessmentHistory, elig, player.xp, player.energy, doneQuests]);

  return (
    <div className="space-y-5">
      {/* top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<TrendingUp size={15} />} label="المستوى" value={<NumberText value={prog.level} />} color="var(--color-green)" />
        <Stat icon={<ArrowUpRight size={15} />} label="الخبرة" value={<NumberText value={player.xp} group />} color="var(--color-blue)" />
        <Stat icon={<Award size={15} />} label="الترتيب" value={<>#<NumberText value={rank} /></>} color="var(--color-burgundy)" />
        <Stat icon={<Zap size={15} />} label="الطاقة" value={<NumberText value={player.energy} />} color="var(--color-amber)" />
      </div>

      {/* radar + competency bars */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-3 shadow-soft">
          <h3 className="mb-1 text-center font-display text-base font-black text-black">خريطة المهارات</h3>
          <Radar scores={competencyScores} />
        </div>
        <div className="rounded-lg bg-white p-4 shadow-soft">
          <h3 className="mb-3 font-display text-base font-black text-black">تفصيل المهارات</h3>
          <div className="space-y-2.5">
            {competencies.map((comp) => {
              const v = competencyScores[comp.id] ?? 0;
              return (
                <div key={comp.id}>
                  <div className="mb-0.5 flex items-center justify-between font-ui text-xs">
                    <span className="text-charcoal">{comp.nameAr}</span>
                    <span className="num font-bold" style={{ color: scoreColor(v) }}>
                      <NumberText value={v} />%
                    </span>
                  </div>
                  <ProgressBar pct={v} color={scoreColor(v)} height={6} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* activity stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Swords size={15} />} label="تقييمات" value={<NumberText value={assessmentHistory.length} />} color="var(--color-green)" />
        <Stat icon={<TrendingUp size={15} />} label="متوسط الدقة" value={<><NumberText value={avgAccuracy} />%</>} color="var(--color-blue)" />
        <Stat icon={<ClipboardList size={15} />} label="مهام مكتملة" value={<><NumberText value={doneQuests} />/<NumberText value={quests.length} /></>} color="var(--color-amber)" />
        <Stat icon={<Award size={15} />} label="أوسمة" value={<><NumberText value={badgeCount} />/<NumberText value={allBadges.length} /></>} color="var(--color-burgundy)" />
      </div>

      {/* next promotion */}
      {elig.next && (
        <div className="rounded-lg bg-white p-4 shadow-soft">
          <h3 className="mb-2 font-display text-base font-black text-black">
            نحو الترقية: <span className="highlight">{elig.next.titleAr}</span>
          </h3>
          <div className="mb-1 flex items-center justify-between font-ui text-xs">
            <span className="font-bold text-charcoal">الخبرة</span>
            <span className="num text-muted">
              <NumberText value={Math.min(player.xp, elig.next.xpThreshold)} group /> / <NumberText value={elig.next.xpThreshold} group />
            </span>
          </div>
          <ProgressBar pct={Math.min(100, (player.xp / elig.next.xpThreshold) * 100)} />
        </div>
      )}

      {/* recommendations */}
      <div className="rounded-lg p-4" style={{ background: 'var(--color-aqua-pale)' }}>
        <h3 className="mb-2 flex items-center gap-2 font-display text-base font-black text-black">
          <Lightbulb size={18} className="text-blue" /> كيف تتقدّم من هنا
        </h3>
        <ul className="space-y-2">
          {tips.map((t, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-2 font-ui text-[13px] leading-relaxed text-charcoal"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--color-blue)' }} />
              {t}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
