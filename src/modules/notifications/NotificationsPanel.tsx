import { useEffect, useState } from 'react';
import { BellOff, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import type { NotificationRow } from '@/lib/dbTypes';

export default function NotificationsPanel() {
  const { session } = useAuth();
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setRows((data as NotificationRow[]) ?? []);
        setLoading(false);
      });
  }, [session]);

  const markAll = async () => {
    await supabase.from('notifications').update({ read: true }).eq('read', false);
    setRows((r) => r.map((n) => ({ ...n, read: true })));
  };

  if (loading) return <p className="py-8 text-center font-ui text-sm text-muted">جارٍ التحميل…</p>;
  if (!rows.length)
    return (
      <div className="py-10 text-center text-muted">
        <BellOff size={32} className="mx-auto mb-2" />
        <p className="font-ui text-sm">لا توجد إشعارات بعد.</p>
      </div>
    );

  return (
    <div>
      <button onClick={markAll} className="mb-3 flex items-center gap-1.5 rounded-pill bg-warm-gray px-3 py-1.5 font-ui text-xs font-bold text-charcoal">
        <CheckCheck size={14} /> تحديد الكل كمقروء
      </button>
      <div className="space-y-2">
        {rows.map((n) => (
          <div
            key={n.id}
            className="rounded-lg p-3 shadow-soft"
            style={{ background: n.read ? 'var(--color-white)' : 'var(--color-green-light)' }}
          >
            <div className="flex items-center justify-between">
              <p className="font-ui text-sm font-bold text-black">{n.title_ar}</p>
              {!n.read && <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-green)' }} />}
            </div>
            {n.body_ar && <p className="mt-0.5 font-ui text-xs text-muted">{n.body_ar}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
