import { useEffect, useState } from 'react';
import { Users, Plus, Check, X, Inbox } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { competencies } from '@/data/competencies';
import type { Profile, RequestRow } from '@/lib/dbTypes';
import DashShell from './DashShell';

interface Member extends Profile { level?: number; xp?: number; last_active_day?: string | null }

const REQ_LABEL: Record<string, string> = { sick_leave: 'إجازة مرضية', holiday: 'إجازة', remote: 'عمل عن بُعد', question: 'سؤال', other: 'أخرى' };

export default function ManagerDashboard({ onPlay }: { onPlay: () => void }) {
  const { session, profile, signOut } = useAuth();
  const me = session!.user.id;
  const [team, setTeam] = useState<Member[]>([]);
  const [reqs, setReqs] = useState<RequestRow[]>([]);
  const [assignFor, setAssignFor] = useState<Member | null>(null);

  const load = async () => {
    const { data: t } = await supabase.from('profiles').select('*').eq('manager_id', me);
    const members = (t as Member[]) ?? [];
    const ids = members.map((m) => m.id);
    if (ids.length) {
      const { data: ps } = await supabase.from('player_state').select('user_id,level,xp,last_active_day').in('user_id', ids);
      const map = new Map((ps ?? []).map((p: { user_id: string; level: number; xp: number; last_active_day: string | null }) => [p.user_id, p]));
      members.forEach((m) => { const r = map.get(m.id); if (r) { m.level = r.level; m.xp = r.xp; m.last_active_day = r.last_active_day; } });
    }
    setTeam(members);
    const { data: r } = await supabase.from('requests').select('*').eq('status', 'pending');
    setReqs(((r as RequestRow[]) ?? []).filter((x) => x.requester_id !== me));
  };
  useEffect(() => { load(); }, []);

  const decide = async (r: RequestRow, status: 'approved' | 'rejected' | 'answered') => {
    await supabase.from('requests').update({ status, approver_id: me, decided_at: new Date().toISOString() }).eq('id', r.id);
    setReqs((cur) => cur.filter((x) => x.id !== r.id));
  };

  return (
    <DashShell title="لوحة المدير" role="manager" name={profile?.full_name ?? ''} onPlay={onPlay} signOut={signOut}>
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-black text-black"><Users size={20} className="text-green" /> فريقي <span className="num text-muted">({team.length})</span></h2>
        {team.length === 0 ? (
          <p className="rounded-lg bg-white p-4 font-ui text-sm text-muted shadow-soft">لا يوجد أعضاء في فريقك بعد. تُسند الفِرق من قِبَل الموارد البشرية.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-soft">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full font-display text-base font-black text-white" style={{ background: m.avatar_color ?? '#00c17a' }}>
                  {m.avatar_image_url ? <img src={m.avatar_image_url} alt="" className="h-full w-full object-cover" /> : (m.full_name ?? '؟').charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-ui text-sm font-bold text-black">{m.full_name}</p>
                  <p className="font-ui text-[11px] text-muted">{m.job_title || m.department || 'موظف'} · المستوى <span className="num">{m.level ?? 1}</span> · <span className="num">{m.xp ?? 0}</span> خبرة</p>
                </div>
                <button onClick={() => setAssignFor(m)} className="flex items-center gap-1 rounded-pill bg-black px-3 py-1.5 font-ui text-xs font-bold text-white"><Plus size={13} /> أسند</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-black text-black"><Inbox size={20} className="text-amber" /> طلبات بانتظار موافقتك <span className="num text-muted">({reqs.length})</span></h2>
        {reqs.length === 0 ? (
          <p className="rounded-lg bg-white p-4 font-ui text-sm text-muted shadow-soft">لا توجد طلبات معلّقة.</p>
        ) : (
          <div className="space-y-2">
            {reqs.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-soft">
                <div>
                  <p className="font-ui text-sm font-bold text-black">{REQ_LABEL[r.type]}{r.start_date && <span className="num text-muted" dir="ltr"> · {r.start_date} → {r.end_date}</span>}</p>
                  {r.reason_ar && <p className="font-ui text-xs text-muted">{r.reason_ar}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decide(r, r.type === 'question' ? 'answered' : 'approved')} className="flex h-8 w-8 items-center justify-center rounded-full bg-green text-white"><Check size={15} /></button>
                  <button onClick={() => decide(r, 'rejected')} className="flex h-8 w-8 items-center justify-center rounded-full bg-red text-white"><X size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {assignFor && <AssignModal member={assignFor} assignerId={me} onClose={() => setAssignFor(null)} />}
    </DashShell>
  );
}

function AssignModal({ member, assignerId, onClose }: { member: Member; assignerId: string; onClose: () => void }) {
  const [type, setType] = useState<'assessment' | 'task' | 'goal'>('assessment');
  const [competencyId, setCompetencyId] = useState(competencies[0].id);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [due, setDue] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const comp = competencies.find((c) => c.id === competencyId)!;
    if (type === 'goal') {
      await supabase.from('goals').insert({
        owner_id: member.id, created_by: assignerId,
        title_ar: title || 'هدف', desc_ar: desc || null,
        target: target ? Number(target) : null, unit: unit || null, due_date: due || null,
      });
    } else {
      await supabase.from('assignments').insert({
        assigner_id: assignerId,
        assignee_id: member.id,
        type,
        ref_id: type === 'assessment' ? competencyId : null,
        title_ar: type === 'assessment' ? `تقييم: ${comp.nameAr}` : title || 'مهمة',
        desc_ar: type === 'assessment' ? `أكمل تقييم ${comp.nameAr} في ساحة التقييم` : desc || null,
        due_date: due || null,
      });
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-off-white p-5 shadow-float" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 font-display text-lg font-black text-black">إسناد إلى {member.full_name}</h3>
        <div className="mb-3 flex rounded-pill bg-warm-gray p-1">
          {([['assessment', 'تقييم'], ['task', 'مهمة'], ['goal', 'هدف']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setType(t)} className="flex-1 rounded-pill px-3 py-1.5 font-ui text-sm font-bold" style={{ background: type === t ? 'var(--color-black)' : 'transparent', color: type === t ? '#fff' : 'var(--color-muted)' }}>
              {label}
            </button>
          ))}
        </div>
        {type === 'assessment' ? (
          <select value={competencyId} onChange={(e) => setCompetencyId(e.target.value)} className="w-full rounded-lg border border-warm-gray px-3 py-2 font-ui text-sm">
            {competencies.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
          </select>
        ) : (
          <div className="space-y-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === 'goal' ? 'عنوان الهدف' : 'عنوان المهمة'} className="w-full rounded-lg border border-warm-gray px-3 py-2 font-ui text-sm" />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="الوصف (اختياري)" rows={2} className="w-full rounded-lg border border-warm-gray px-3 py-2 font-ui text-sm" />
            {type === 'goal' && (
              <div className="grid grid-cols-2 gap-2">
                <input value={target} onChange={(e) => setTarget(e.target.value)} type="number" dir="ltr" placeholder="القيمة المستهدفة" className="num rounded-lg border border-warm-gray px-3 py-2 font-ui text-sm" />
                <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="الوحدة (مثال: مهمة)" className="rounded-lg border border-warm-gray px-3 py-2 font-ui text-sm" />
              </div>
            )}
          </div>
        )}
        <label className="mt-3 block font-ui text-xs text-muted">تاريخ الاستحقاق (اختياري)
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mt-1 w-full rounded-lg border border-warm-gray px-3 py-2 font-ui text-sm" />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-pill bg-warm-gray px-4 py-2 font-ui text-sm font-bold text-charcoal">إلغاء</button>
          <button onClick={save} disabled={saving} className="rounded-pill bg-green px-5 py-2 font-ui text-sm font-bold text-white disabled:opacity-60">إسناد</button>
        </div>
      </div>
    </div>
  );
}
