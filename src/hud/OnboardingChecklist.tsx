import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, ListChecks, ChevronDown } from 'lucide-react';
import { useGameStore } from '@/state/store';
import NumberText from '@/ui/NumberText';

export default function OnboardingChecklist() {
  const onboarding = useGameStore((s) => s.onboarding);
  const assessmentHistory = useGameStore((s) => s.assessmentHistory);
  const questProgress = useGameStore((s) => s.questProgress);
  const player = useGameStore((s) => s.player);
  const dismissChecklist = useGameStore((s) => s.dismissChecklist);
  const [collapsed, setCollapsed] = useState(false);

  const items = useMemo(
    () => [
      { id: 'move', label: 'تحرّك واستكشف العالم', done: onboarding.moved },
      { id: 'arena', label: 'ادخل ساحة التقييم', done: !!onboarding.visited.arena },
      { id: 'assess', label: 'أكمل تقييمًا في الساحة', done: assessmentHistory.length >= 1 },
      {
        id: 'quest',
        label: 'أكمل مهمة تطويرية',
        done: Object.values(questProgress).some((q) => q.done),
      },
      { id: 'avatar', label: 'خصّص شخصيتك', done: !!player.avatarImage || !!player.characterTint },
    ],
    [onboarding, assessmentHistory, questProgress, player]
  );

  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  if (onboarding.checklistDismissed) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-20 hidden sm:block">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="pointer-events-auto w-72 overflow-hidden rounded-xl bg-white shadow-card"
      >
        <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'var(--color-black)' }}>
          <ListChecks size={16} className="text-green" />
          <span className="flex-1 font-ui text-sm font-bold text-white">
            {allDone ? 'أحسنت! اكتملت البداية' : 'دليل البداية'}
          </span>
          <span className="num rounded-pill bg-white/15 px-2 py-0.5 font-ui text-[11px] font-bold text-white">
            <NumberText value={doneCount} /> / <NumberText value={items.length} />
          </span>
          <button onClick={() => setCollapsed((c) => !c)} className="text-white/70 transition hover:text-white">
            <ChevronDown size={16} className={collapsed ? 'rotate-180 transition' : 'transition'} />
          </button>
          {allDone && (
            <button onClick={dismissChecklist} className="text-white/70 transition hover:text-white" title="إغلاق">
              <X size={16} />
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.ul
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-2.5 px-4 py-2">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: it.done ? 'var(--color-green)' : 'var(--color-warm-gray)' }}
                  >
                    {it.done && <Check size={13} className="text-white" />}
                  </span>
                  <span
                    className={`font-ui text-[13px] ${it.done ? 'text-muted line-through' : 'text-charcoal'}`}
                  >
                    {it.label}
                  </span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
