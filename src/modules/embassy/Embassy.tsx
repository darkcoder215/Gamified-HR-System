import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Stethoscope, Home, HelpCircle, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import type { RequestRow } from '@/lib/dbTypes';

const TYPES = [
  { id: 'holiday', label: 'Leave', icon: <Plane size={18} />, dates: true, color: '#00c17a' },
  { id: 'sick_leave', label: 'Sick Leave', icon: <Stethoscope size={18} />, dates: true, color: '#f24935' },
  { id: 'remote', label: 'Remote Work', icon: <Home size={18} />, dates: true, color: '#0072f9' },
  { id: 'question', label: 'Ask HR', icon: <HelpCircle size={18} />, dates: false, color: '#ffbc0a' },
] as const;

const STATUS_AR: Record<string, string> = { pending: 'Under Review', approved: 'Approved', rejected: 'Rejected', answered: 'Answered' };
const STATUS_COLOR: Record<string, string> = { pending: '#ffbc0a', approved: '#00c17a', rejected: '#f24935', answered: '#0072f9' };

export default function Embassy() {
  const { session } = useAuth();
  const [type, setType] = useState<(typeof TYPES)[number]['id']>('holiday');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [rows, setRows] = useState<RequestRow[]>([]);

  const load = () => {
    if (!session) return;
    supabase.from('requests').select('*').eq('requester_id', session.user.id).order('created_at', { ascending: false })
      .then(({ data }) => setRows((data as RequestRow[]) ?? []));
  };
  useEffect(load, [session]);

  const meta = TYPES.find((t) => t.id === type)!;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSending(true);
    await supabase.from('requests').insert({
      requester_id: session.user.id,
      type,
      start_date: meta.dates ? start || null : null,
      end_date: meta.dates ? end || null : null,
      days: meta.dates && start && end ? Math.max(1, (Date.parse(end) - Date.parse(start)) / 86400000 + 1) : null,
      reason_ar: reason || null,
    });
    setReason(''); setStart(''); setEnd('');
    setSending(false);
    load();
  };

  return (
    <div>
      <p className="mb-4 font-body text-sm text-charcoal">
        Welcome to the <span className="highlight">Embassy</span> — submit a leave request or ask HR, and your requests will reach the right people with a notification of the outcome.
      </p>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className="flex flex-col items-center gap-1 rounded-lg border-2 bg-white p-2.5 transition"
            style={{ borderColor: type === t.id ? t.color : 'var(--color-warm-gray)' }}
          >
            <span style={{ color: t.color }}>{t.icon}</span>
            <span className="font-ui text-[11px] font-bold text-charcoal">{t.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="rounded-lg bg-white p-4 shadow-soft">
        {meta.dates && (
          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="font-ui text-xs text-muted">From<input type="date" required value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded-lg border border-warm-gray px-2 py-1.5 font-ui text-sm" /></label>
            <label className="font-ui text-xs text-muted">To<input type="date" required value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded-lg border border-warm-gray px-2 py-1.5 font-ui text-sm" /></label>
          </div>
        )}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={meta.dates ? 'Reason (optional)' : 'Write your question here'}
          required={!meta.dates}
          rows={2}
          className="w-full rounded-lg border border-warm-gray px-3 py-2 font-ui text-sm outline-none"
        />
        <motion.button whileTap={{ scale: 0.97 }} disabled={sending} className="mt-3 flex w-full items-center justify-center gap-2 rounded-pill bg-black py-2.5 font-ui text-sm font-bold text-white disabled:opacity-60">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Submit Request
        </motion.button>
      </form>

      {rows.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 font-display text-base font-black text-black">My Requests</h3>
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-soft">
                <div>
                  <p className="font-ui text-sm font-bold text-black">{TYPES.find((t) => t.id === r.type)?.label}</p>
                  {r.reason_ar && <p className="font-ui text-xs text-muted">{r.reason_ar}</p>}
                  {r.response_ar && <p className="mt-0.5 font-ui text-xs" style={{ color: 'var(--color-blue)' }}>Reply: {r.response_ar}</p>}
                </div>
                <span className="rounded-pill px-3 py-1 font-ui text-[11px] font-bold text-white" style={{ background: STATUS_COLOR[r.status] }}>
                  {STATUS_AR[r.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
