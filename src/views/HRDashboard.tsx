import { useEffect, useState } from 'react';
import { Users, ShieldCheck, Check, X, Megaphone, Settings2, Send, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import type { Profile, Role, RequestRow } from '@/lib/dbTypes';
import DashShell from './DashShell';

const ROLES: { id: Role; label: string }[] = [
  { id: 'employee', label: 'Employee' },
  { id: 'manager', label: 'Manager' },
  { id: 'hr_admin', label: 'HR' },
];
const REQ_LABEL: Record<string, string> = { sick_leave: 'Sick leave', holiday: 'Leave', remote: 'Remote work', question: 'Question', other: 'Other' };

export default function HRDashboard({ onPlay }: { onPlay: () => void }) {
  const { session, profile, signOut } = useAuth();
  const me = session!.user.id;
  const [people, setPeople] = useState<Profile[]>([]);
  const [reqs, setReqs] = useState<RequestRow[]>([]);
  const [domains, setDomains] = useState('');
  const [emails, setEmails] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annMsg, setAnnMsg] = useState('');

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    setPeople((data as Profile[]) ?? []);
    const { data: r } = await supabase.from('requests').select('*').eq('status', 'pending');
    setReqs(((r as RequestRow[]) ?? []).filter((x) => x.requester_id !== me));
    const { data: s } = await supabase.from('app_settings').select('allowed_domains,allowed_emails').eq('id', 1).maybeSingle();
    if (s) { setDomains((s.allowed_domains ?? []).join(', ')); setEmails((s.allowed_emails ?? []).join(', ')); }
  };
  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    const toArr = (v: string) => v.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    await supabase.from('app_settings').update({ allowed_domains: toArr(domains), allowed_emails: toArr(emails) }).eq('id', 1);
  };
  const broadcast = async () => {
    if (!annTitle.trim()) return;
    const { data } = await supabase.rpc('broadcast_announcement', { p_title: annTitle.trim(), p_body: annBody.trim() || null });
    setAnnMsg(`Announcement sent to ${data ?? 0} employees.`);
    setAnnTitle(''); setAnnBody('');
    window.setTimeout(() => setAnnMsg(''), 4000);
  };

  const managers = people.filter((p) => p.role === 'manager' || p.role === 'hr_admin');

  const setRole = async (id: string, role: Role) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setPeople((cur) => cur.map((p) => (p.id === id ? { ...p, role } : p)));
  };
  const setManager = async (id: string, manager_id: string) => {
    const val = manager_id || null;
    await supabase.from('profiles').update({ manager_id: val }).eq('id', id);
    setPeople((cur) => cur.map((p) => (p.id === id ? { ...p, manager_id: val } : p)));
  };
  const decide = async (r: RequestRow, status: 'approved' | 'rejected' | 'answered') => {
    await supabase.from('requests').update({ status, approver_id: me, decided_at: new Date().toISOString() }).eq('id', r.id);
    setReqs((cur) => cur.filter((x) => x.id !== r.id));
  };

  const counts = { employee: 0, manager: 0, hr_admin: 0 } as Record<Role, number>;
  people.forEach((p) => { counts[p.role]++; });

  return (
    <DashShell title="HR Dashboard" role="hr_admin" name={profile?.full_name ?? ''} onPlay={onPlay} signOut={signOut}>
      <div className="mb-6 grid grid-cols-3 gap-3">
        {ROLES.map((r) => (
          <div key={r.id} className="rounded-lg bg-white p-3 text-center shadow-soft">
            <p className="font-display text-2xl font-black text-black"><span className="num">{counts[r.id]}</span></p>
            <p className="font-ui text-xs text-muted">{r.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow-soft">
          <h2 className="mb-2 flex items-center gap-2 font-display text-base font-black text-black"><Megaphone size={18} className="text-blue" /> Company Announcement</h2>
          <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Announcement title" className="mb-2 w-full rounded-lg border border-warm-gray px-3 py-2 font-ui text-sm" />
          <textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} placeholder="Announcement body (optional)" rows={2} className="w-full rounded-lg border border-warm-gray px-3 py-2 font-ui text-sm" />
          <button onClick={broadcast} className="mt-2 flex items-center gap-1.5 rounded-pill bg-blue px-4 py-2 font-ui text-sm font-bold text-white"><Send size={14} /> Send to everyone</button>
          {annMsg && <p className="mt-2 font-ui text-xs font-bold text-green">{annMsg}</p>}
        </section>
        <section className="rounded-lg bg-white p-4 shadow-soft">
          <h2 className="mb-2 flex items-center gap-2 font-display text-base font-black text-black"><Settings2 size={18} className="text-amber" /> Sign-up Settings</h2>
          <label className="font-ui text-xs text-muted">Allowed domains (comma-separated)
            <input value={domains} onChange={(e) => setDomains(e.target.value)} dir="ltr" className="num mt-1 w-full rounded-lg border border-warm-gray px-3 py-2 font-ui text-sm" />
          </label>
          <label className="mt-2 block font-ui text-xs text-muted">Additional allowed emails (comma-separated)
            <input value={emails} onChange={(e) => setEmails(e.target.value)} dir="ltr" className="num mt-1 w-full rounded-lg border border-warm-gray px-3 py-2 font-ui text-sm" />
          </label>
          <button onClick={saveSettings} className="mt-2 flex items-center gap-1.5 rounded-pill bg-black px-4 py-2 font-ui text-sm font-bold text-white"><Save size={14} /> Save</button>
        </section>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-black text-black"><Users size={20} className="text-green" /> Employees</h2>
        <div className="overflow-hidden rounded-lg bg-white shadow-soft">
          {people.map((p, i) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 p-3" style={{ background: i % 2 ? 'var(--color-off-white)' : '#fff' }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-black text-white" style={{ background: p.avatar_color ?? '#00c17a' }}>{(p.full_name ?? '?').charAt(0)}</div>
              <div className="min-w-[120px] flex-1">
                <p className="font-ui text-sm font-bold text-black">{p.full_name}</p>
                <p className="num font-ui text-[11px] text-muted" dir="ltr">{p.email}</p>
              </div>
              <select value={p.role} onChange={(e) => setRole(p.id, e.target.value as Role)} className="rounded-lg border border-warm-gray px-2 py-1.5 font-ui text-xs">
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <select value={p.manager_id ?? ''} onChange={(e) => setManager(p.id, e.target.value)} className="rounded-lg border border-warm-gray px-2 py-1.5 font-ui text-xs">
                <option value="">— Manager —</option>
                {managers.filter((m) => m.id !== p.id).map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-black text-black"><ShieldCheck size={20} className="text-amber" /> Pending requests <span className="num text-muted">({reqs.length})</span></h2>
        {reqs.length === 0 ? (
          <p className="rounded-lg bg-white p-4 font-ui text-sm text-muted shadow-soft">No pending requests.</p>
        ) : (
          <div className="space-y-2">
            {reqs.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-soft">
                <div>
                  <p className="font-ui text-sm font-bold text-black">{REQ_LABEL[r.type]}</p>
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
    </DashShell>
  );
}
