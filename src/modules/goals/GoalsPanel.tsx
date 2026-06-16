import { useEffect, useState } from 'react';
import { Target, Gauge, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import ProgressBar from '@/ui/ProgressBar';
import NumberText from '@/ui/NumberText';

interface Goal { id: string; title_ar: string; desc_ar: string | null; target: number | null; current: number | null; unit: string | null; status: string; due_date: string | null }
interface Kpi { id: string; name_ar: string; target_value: number | null; current_value: number | null; unit: string | null }

export default function GoalsPanel() {
  const { session } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!session) return;
    const [g, k] = await Promise.all([
      supabase.from('goals').select('*').eq('owner_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('kpis').select('*').eq('owner_id', session.user.id),
    ]);
    setGoals((g.data as Goal[]) ?? []);
    setKpis((k.data as Kpi[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [session]);

  const saveGoal = async (id: string, current: number) => {
    await supabase.from('goals').update({ current }).eq('id', id);
    setGoals((cur) => cur.map((g) => (g.id === id ? { ...g, current } : g)));
  };
  const saveKpi = async (id: string, current_value: number) => {
    await supabase.from('kpis').update({ current_value }).eq('id', id);
    setKpis((cur) => cur.map((k) => (k.id === id ? { ...k, current_value } : k)));
  };

  if (loading) return <p className="py-8 text-center font-ui text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-black text-black"><Target size={18} className="text-green" /> My Goals</h3>
        {goals.length === 0 ? (
          <p className="rounded-lg bg-white p-4 font-ui text-sm text-muted shadow-soft">No goals yet. Your manager sets your goals, or you can track them here once they're added.</p>
        ) : (
          <div className="space-y-3">
            {goals.map((g) => {
              const pct = g.target ? Math.min(100, ((g.current ?? 0) / g.target) * 100) : 0;
              return (
                <div key={g.id} className="rounded-lg bg-white p-4 shadow-soft">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-ui text-sm font-bold text-black">{g.title_ar}</p>
                    <span className="num font-ui text-xs text-muted"><NumberText value={g.current ?? 0} /> / <NumberText value={g.target ?? 0} /> {g.unit}</span>
                  </div>
                  {g.desc_ar && <p className="mb-2 font-ui text-xs text-muted">{g.desc_ar}</p>}
                  <ProgressBar pct={pct} />
                  <UpdateRow value={g.current ?? 0} onSave={(v) => saveGoal(g.id, v)} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-black text-black"><Gauge size={18} className="text-blue" /> Performance Indicators</h3>
        {kpis.length === 0 ? (
          <p className="rounded-lg bg-white p-4 font-ui text-sm text-muted shadow-soft">No performance indicators yet.</p>
        ) : (
          <div className="space-y-3">
            {kpis.map((k) => {
              const pct = k.target_value ? Math.min(100, ((k.current_value ?? 0) / k.target_value) * 100) : 0;
              return (
                <div key={k.id} className="rounded-lg bg-white p-4 shadow-soft">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-ui text-sm font-bold text-black">{k.name_ar}</p>
                    <span className="num font-ui text-xs text-muted"><NumberText value={k.current_value ?? 0} /> / <NumberText value={k.target_value ?? 0} /> {k.unit}</span>
                  </div>
                  <ProgressBar pct={pct} color="var(--color-blue)" />
                  <UpdateRow value={k.current_value ?? 0} onSave={(v) => saveKpi(k.id, v)} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function UpdateRow({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="number"
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="num w-24 rounded-lg border border-warm-gray px-2 py-1 font-ui text-sm"
        dir="ltr"
      />
      <button onClick={() => onSave(Number(v) || 0)} className="flex items-center gap-1 rounded-pill bg-black px-3 py-1.5 font-ui text-xs font-bold text-white">
        <Save size={12} /> Update
      </button>
    </div>
  );
}
