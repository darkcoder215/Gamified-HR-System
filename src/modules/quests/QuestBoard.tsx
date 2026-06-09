import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ChevronLeft, Trophy } from 'lucide-react';
import { quests } from '@/data/quests';
import { getCompetency } from '@/data/competencies';
import { useGameStore } from '@/state/store';
import Card from '@/ui/Card';
import Pill from '@/ui/Pill';
import ProgressBar from '@/ui/ProgressBar';
import NumberText from '@/ui/NumberText';

const DIFF_LABEL: Record<string, string> = { easy: 'سهل', medium: 'متوسط', hard: 'متقدّم' };

export default function QuestBoard() {
  const questProgress = useGameStore((s) => s.questProgress);
  const toggleQuestStep = useGameStore((s) => s.toggleQuestStep);
  const completeQuest = useGameStore((s) => s.completeQuest);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Award XP once a quest's steps are all completed.
  useEffect(() => {
    for (const quest of quests) {
      const entry = questProgress[quest.id];
      if (entry?.done && !entry.completedSteps.includes('__rewarded__')) {
        completeQuest(quest.id, quest.xpReward, quest.badgeId);
      }
    }
  }, [questProgress, completeQuest]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof quests>();
    for (const q of quests) {
      if (!map.has(q.pathAr)) map.set(q.pathAr, []);
      map.get(q.pathAr)!.push(q);
    }
    return Array.from(map.entries());
  }, []);

  const selected = quests.find((q) => q.id === selectedId);

  if (selected) {
    const entry = questProgress[selected.id] ?? { completedSteps: [], done: false };
    const completedCount = entry.completedSteps.filter((s) => s !== '__rewarded__').length;
    const pct = Math.round((completedCount / selected.steps.length) * 100);
    const comp = getCompetency(selected.competencyId);
    return (
      <div>
        <button onClick={() => setSelectedId(null)} className="mb-4 flex items-center gap-1 font-ui text-sm font-bold text-blue">
          <ChevronLeft size={16} /> كل المهام
        </button>
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <Pill bg="var(--color-aqua-pale)" color="var(--color-charcoal)">{comp?.nameAr}</Pill>
            <Pill bg="var(--color-yellow-pale)" color="var(--color-charcoal)">{DIFF_LABEL[selected.difficulty]}</Pill>
          </div>
          <h3 className="mt-3 font-display text-2xl font-black text-black">{selected.titleAr}</h3>
          <p className="mt-1 font-body text-sm text-charcoal">{selected.descAr}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1"><ProgressBar pct={pct} /></div>
            <span className="font-ui text-xs font-bold text-muted">
              <NumberText value={completedCount} /> / <NumberText value={selected.steps.length} />
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {selected.steps.map((step, i) => {
            const done = entry.completedSteps.includes(step.id);
            return (
              <motion.button
                key={step.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                disabled={entry.done}
                onClick={() => toggleQuestStep(selected.id, step.id, selected.steps.length)}
                className="flex w-full items-center gap-3 rounded-lg border-2 bg-white px-4 py-3 text-start font-ui text-sm transition"
                style={{ borderColor: done ? 'var(--color-green)' : 'var(--color-warm-gray)' }}
              >
                {done ? <CheckCircle2 size={20} className="text-green" /> : <Circle size={20} className="text-muted" />}
                <span className={done ? 'text-black line-through opacity-70' : 'text-charcoal'}>{step.titleAr}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-lg bg-green-light p-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-black" />
            <span className="font-ui text-sm font-bold text-black">المكافأة</span>
          </div>
          <span className="font-display text-lg font-black text-black">+<NumberText value={selected.xpReward} /> خبرة</span>
        </div>
        {entry.done && (
          <p className="mt-3 text-center font-ui text-sm font-bold text-green">✓ أكملت هذه المهمة!</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([path, list]) => (
        <div key={path}>
          <h3 className="mb-3 font-display text-lg font-bold text-black">
            <span className="highlight">{path}</span>
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {list.map((quest) => {
              const entry = questProgress[quest.id];
              const completedCount = entry?.completedSteps.filter((s) => s !== '__rewarded__').length ?? 0;
              const pct = Math.round((completedCount / quest.steps.length) * 100);
              return (
                <Card key={quest.id} interactive onClick={() => setSelectedId(quest.id)} className="!p-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-ui text-base font-bold text-black">{quest.titleAr}</h4>
                    {entry?.done && <CheckCircle2 size={18} className="text-green" />}
                  </div>
                  <p className="mt-1 font-ui text-xs text-muted">{quest.descAr}</p>
                  <div className="mt-3"><ProgressBar pct={pct} height={6} /></div>
                  <div className="mt-2 flex items-center justify-between font-ui text-[11px] text-muted">
                    <span><NumberText value={completedCount} />/<NumberText value={quest.steps.length} /> خطوات</span>
                    <span className="font-bold text-blue">+<NumberText value={quest.xpReward} /> خبرة</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
