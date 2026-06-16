import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  X,
  Zap,
  RotateCcw,
  Crown,
  MessagesSquare,
  Boxes,
  BarChart3,
  Users,
  Lightbulb,
  Puzzle,
  Clock,
  Circle,
  type LucideIcon as LucideIconType,
} from 'lucide-react';
import { competencies, getCompetency } from '@/data/competencies';
import { getQuestionsByCompetency } from '@/data/questions';
import type { AssessmentResult, Question } from '@/types';
import { useGameStore } from '@/state/store';
import { energyCostForWrong } from '@/state/gamification';
import Button from '@/ui/Button';
import Card from '@/ui/Card';
import ScoreBadge from '@/ui/ScoreBadge';
import NumberText from '@/ui/NumberText';
import { smallBurst } from '@/animation/confetti';
import { sfx } from '@/audio/sound';

type Phase = 'select' | 'battle' | 'result';

const COMP_ICONS: Record<string, LucideIconType> = {
  Crown,
  MessagesSquare,
  Boxes,
  BarChart3,
  Users,
  Lightbulb,
  Puzzle,
  Clock,
};

function LucideIcon({ name, ...props }: { name: string; size?: number; color?: string }) {
  const C = COMP_ICONS[name] ?? Circle;
  return <C {...props} />;
}

export default function AssessmentArena() {
  const energy = useGameStore((s) => s.player.energy);
  const loseEnergy = useGameStore((s) => s.loseEnergy);
  const recordAssessment = useGameStore((s) => s.recordAssessment);

  const [phase, setPhase] = useState<Phase>('select');
  const [competencyId, setCompetencyId] = useState<string | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [gainFx, setGainFx] = useState<number | null>(null);
  const [wrongFx, setWrongFx] = useState(false);

  const battleQuestions: Question[] = useMemo(
    () => (competencyId ? getQuestionsByCompetency(competencyId) : []),
    [competencyId]
  );
  const q = battleQuestions[qIndex];

  const start = (id: string) => {
    setCompetencyId(id);
    setQIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setXpEarned(0);
    setPhase('battle');
  };

  const choose = (i: number) => {
    if (selected !== null || !q) return;
    setSelected(i);
    const isCorrect = i === q.correctIndex;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setXpEarned((x) => x + q.xp);
      setGainFx(q.xp);
      smallBurst();
      sfx('correct');
      window.setTimeout(() => setGainFx(null), 900);
    } else {
      loseEnergy(energyCostForWrong(q.difficulty));
      setWrongFx(true);
      sfx('wrong');
      window.setTimeout(() => setWrongFx(false), 450);
    }
  };

  const next = () => {
    const last = qIndex >= battleQuestions.length - 1;
    const outOfEnergy = energy <= 0;
    if (last || outOfEnergy) {
      finish();
    } else {
      setQIndex((n) => n + 1);
      setSelected(null);
    }
  };

  const finish = () => {
    const total = battleQuestions.length;
    const scorePct = Math.round((correctCount / total) * 100);
    const result: AssessmentResult = {
      id: `a-${Date.now()}`,
      competencyId: competencyId!,
      date: new Date().toISOString(),
      correct: correctCount,
      total,
      scorePct,
      xpEarned,
    };
    recordAssessment(result);
    setPhase('result');
  };

  // ── SELECT ──
  if (phase === 'select') {
    return (
      <div>
        <p className="mb-4 font-body text-base text-charcoal">
          Choose a skill to take on a knowledge battle. Every correct answer earns you XP, and a wrong answer drains your energy.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {competencies.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card interactive onClick={() => start(c.id)} className="!p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-md text-white"
                    style={{ background: c.color }}
                  >
                    <LucideIcon name={c.icon} size={22} />
                  </div>
                  <div>
                    <h3 className="font-ui text-base font-bold text-black">{c.nameAr}</h3>
                    <p className="font-ui text-xs text-muted">{c.descAr}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const total = battleQuestions.length;
    const scorePct = Math.round((correctCount / total) * 100);
    const comp = getCompetency(competencyId!);
    return (
      <div className="flex flex-col items-center text-center">
        <ScoreBadge score={scorePct} />
        <h3 className="mt-4 font-display text-2xl font-black text-black">{comp?.nameAr} Battle Finished</h3>
        <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-3">
          <div className="rounded-lg bg-white p-3 shadow-soft">
            <p className="font-ui text-xs text-muted">Correct Answers</p>
            <p className="font-display text-2xl font-black text-green">
              <NumberText value={correctCount} /> / <NumberText value={total} />
            </p>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-soft">
            <p className="font-ui text-xs text-muted">XP Earned</p>
            <p className="font-display text-2xl font-black text-blue">+<NumberText value={xpEarned} /></p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="accent" onClick={() => setPhase('select')}>
            <RotateCcw size={16} className="ms-1 inline" /> Another Battle
          </Button>
        </div>
      </div>
    );
  }

  // ── BATTLE ──
  return (
    <div className={wrongFx ? 'animate-shake' : ''}>
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-pill bg-warm-gray px-3 py-1 font-ui text-xs font-bold text-charcoal">
          Question <NumberText value={qIndex + 1} /> / <NumberText value={battleQuestions.length} />
        </span>
        <span className="flex items-center gap-1 font-ui text-xs font-bold" style={{ color: energy > 25 ? 'var(--color-green)' : 'var(--color-red)' }}>
          <Zap size={14} /> Energy <NumberText value={energy} />
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          <h3 className="mb-5 font-display text-xl font-bold leading-relaxed text-black">{q.promptAr}</h3>
          <div className="grid grid-cols-1 gap-3">
            {q.choicesAr.map((choice, i) => {
              const isCorrect = i === q.correctIndex;
              const isChosen = selected === i;
              let style = 'bg-white border-warm-gray text-charcoal';
              let icon = null;
              let borderColor: string | undefined;
              if (selected !== null) {
                if (isCorrect) {
                  style = 'text-black';
                  borderColor = 'var(--color-success)';
                  icon = <Check size={18} style={{ color: 'var(--color-success)' }} />;
                } else if (isChosen) {
                  style = 'text-black';
                  borderColor = 'var(--color-error)';
                  icon = <X size={18} style={{ color: 'var(--color-error)' }} />;
                } else {
                  style = 'border-warm-gray text-muted opacity-60';
                }
              }
              return (
                <motion.button
                  key={i}
                  disabled={selected !== null}
                  onClick={() => choose(i)}
                  whileHover={selected === null ? { scale: 1.01, x: -3 } : undefined}
                  whileTap={selected === null ? { scale: 0.98 } : undefined}
                  className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-start font-ui text-sm font-medium transition ${style}`}
                  style={{
                    borderColor,
                    background: selected !== null && isCorrect ? 'var(--color-mint)' : undefined,
                  }}
                >
                  <span>{choice}</span>
                  {icon}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {selected !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 rounded-lg p-3 font-body text-sm"
                style={{ background: 'var(--color-aqua-pale)', color: 'var(--color-charcoal)' }}
              >
                {q.explanationAr}
              </motion.div>
            )}
          </AnimatePresence>

          {selected !== null && (
            <div className="mt-5 flex justify-end">
              <Button variant="primary" onClick={next}>
                {qIndex >= battleQuestions.length - 1 || energy <= 0 ? 'Finish Battle' : 'Next Question'}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* floating XP gain */}
      <AnimatePresence>
        {gainFx !== null && (
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 font-display text-3xl font-black text-green animate-floatUp"
          >
            +<NumberText value={gainFx} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
