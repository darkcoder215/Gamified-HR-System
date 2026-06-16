import type { ReactNode } from 'react';
import { Gamepad2, LogOut } from 'lucide-react';
import type { Role } from '@/lib/dbTypes';

const ROLE_AR: Record<Role, string> = { employee: 'موظف', manager: 'مدير', hr_admin: 'الموارد البشرية' };

export default function DashShell({
  title, role, name, onPlay, signOut, children,
}: { title: string; role: Role; name: string; onPlay: () => void; signOut: () => void; children: ReactNode }) {
  return (
    <div className="h-full w-full overflow-y-auto bg-off-white" dir="rtl">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-black px-4 py-3 shadow-card sm:px-6">
        <div className="flex items-center gap-3">
          <img src="/logo/powr-mark.svg" alt="POWR" className="h-9 w-9" />
          <div>
            <p className="font-display text-lg font-black text-white">{title}</p>
            <p className="font-ui text-[11px] text-white/60">{name} · {ROLE_AR[role]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPlay} className="flex items-center gap-1.5 rounded-pill bg-green px-4 py-2 font-ui text-sm font-bold text-white">
            <Gamepad2 size={16} /> العب لعبتي
          </button>
          <button onClick={signOut} className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/10 text-white" title="خروج">
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
