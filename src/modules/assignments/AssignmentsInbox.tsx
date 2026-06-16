import { useEffect, useState } from 'react';
import { ClipboardCheck, Swords, ClipboardList, Target, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { useGameStore } from '@/state/store';
import { EventBus } from '@/game/EventBus';
import type { AssignmentRow } from '@/lib/dbTypes';

const TYPE_ICON: Record<string, React.ReactNode> = {
  assessment: <Swords size={16} />,
  task: <ClipboardList size={16} />,
  quest: <Target size={16} />,
  goal: <Target size={16} />,
};
const STATUS_AR: Record<string, string> = {
  assigned: 'New', in_progress: 'In Progress', submitted: 'Awaiting Review', completed: 'Completed', overdue: 'Overdue',
};

export default function AssignmentsInbox() {
  const { session } = useAuth();
  const closeInbox = useGameStore((s) => s.closeInbox);
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('assignments')
      .select('*')
      .eq('assignee_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRows((data as AssignmentRow[]) ?? []);
        setLoading(false);
      });
  }, [session]);

  const start = (a: AssignmentRow) => {
    if (a.type === 'assessment') {
      closeInbox();
      EventBus.emit('station:enter', { stationId: 'arena' });
    } else if (a.type === 'quest') {
      closeInbox();
      EventBus.emit('station:enter', { stationId: 'quests' });
    }
  };

  if (loading) return <p className="py-8 text-center font-ui text-sm text-muted">Loading…</p>;
  if (!rows.length)
    return (
      <div className="py-10 text-center text-muted">
        <ClipboardCheck size={32} className="mx-auto mb-2" />
        <p className="font-ui text-sm">No tasks assigned to you right now.</p>
      </div>
    );

  return (
    <div className="space-y-2.5">
      {rows.map((a) => (
        <div key={a.id} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-soft">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue text-white">{TYPE_ICON[a.type]}</span>
          <div className="min-w-0 flex-1">
            <p className="font-ui text-sm font-bold text-black">{a.title_ar}</p>
            {a.desc_ar && <p className="truncate font-ui text-xs text-muted">{a.desc_ar}</p>}
            <div className="mt-1 flex items-center gap-2 font-ui text-[11px] text-muted">
              <span className="rounded-pill bg-warm-gray px-2 py-0.5 font-bold">{STATUS_AR[a.status]}</span>
              {a.due_date && <span className="flex items-center gap-0.5"><Clock size={11} /> <span className="num" dir="ltr">{a.due_date}</span></span>}
            </div>
          </div>
          {(a.type === 'assessment' || a.type === 'quest') && a.status !== 'completed' && (
            <button onClick={() => start(a)} className="rounded-pill bg-green px-3 py-1.5 font-ui text-xs font-bold text-white">Start</button>
          )}
        </div>
      ))}
    </div>
  );
}
