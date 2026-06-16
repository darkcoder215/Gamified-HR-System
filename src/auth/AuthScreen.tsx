import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from './AuthProvider';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (mode === 'login') {
      const r = await signIn(email, password);
      if (r.error) setError(r.error);
    } else {
      const r = await signUp(email, password, name);
      if (r.error) setError(r.error);
      else if (r.needsConfirm) setConfirm(true);
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-6"
      style={{ background: 'radial-gradient(circle at 50% 25%, #1a2436, #111421 70%)' }}
    >
      {['⚔️', '📋', '🏆', '🚀', '💎', '⭐'].map((g, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute text-3xl opacity-20"
          style={{ top: `${12 + (i * 15) % 70}%`, left: `${(i * 27) % 90}%` }}
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
        >
          {g}
        </motion.span>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className="relative z-10 w-full max-w-md rounded-xl bg-off-white p-8 text-center shadow-float"
      >
        <img src="/logo/made-in-powr.svg" alt="made in POWR" className="mx-auto mb-4 h-12 w-auto" />
        <h1 className="font-display text-3xl font-black text-black">رحلة التطوّر</h1>
        <p className="mt-1 font-body text-sm text-charcoal">منصّة <b>باور</b> لتطوير الموظفين وتقييمهم وترقيتهم</p>

        {confirm ? (
          <div className="mt-6 rounded-lg bg-green-light p-5 text-center">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-green" />
            <p className="font-display text-lg font-black text-black">تحقّق من بريدك</p>
            <p className="mt-1 font-ui text-sm text-charcoal">أرسلنا رابط تأكيد إلى <span className="num" dir="ltr">{email}</span>. فعّل حسابك ثم سجّل الدخول.</p>
            <button onClick={() => { setConfirm(false); setMode('login'); }} className="mt-4 rounded-pill bg-black px-5 py-2 font-ui text-sm font-bold text-white">
              العودة لتسجيل الدخول
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 mb-5 flex rounded-pill bg-warm-gray p-1">
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); }}
                  className="relative flex-1 rounded-pill px-4 py-2 font-ui text-sm font-bold transition"
                  style={{ color: mode === m ? '#fff' : 'var(--color-muted)' }}
                >
                  {mode === m && <motion.div layoutId="auth-tab" className="absolute inset-0 rounded-pill bg-black" />}
                  <span className="relative z-10">{m === 'login' ? 'تسجيل الدخول' : 'حساب جديد'}</span>
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-3 text-start">
              {mode === 'register' && (
                <Field icon={<User size={16} />} placeholder="الاسم الكامل" value={name} onChange={setName} type="text" />
              )}
              <Field icon={<Mail size={16} />} placeholder="البريد الإلكتروني" value={email} onChange={setEmail} type="email" dir="ltr" />
              <Field icon={<Lock size={16} />} placeholder="كلمة المرور" value={password} onChange={setPassword} type="password" dir="ltr" />

              {error && <p className="rounded-lg bg-blush px-3 py-2 font-ui text-xs font-bold text-red" style={{ background: 'var(--color-blush)' }}>{error}</p>}

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="flex w-full items-center justify-center gap-2 rounded-pill bg-green py-3.5 font-ui text-base font-bold text-white shadow-card disabled:opacity-60"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : mode === 'login' ? 'دخول' : 'إنشاء الحساب'}
              </motion.button>
            </form>
            <p className="mt-4 font-ui text-[11px] text-muted">التسجيل متاح ببريد الشركة المعتمد فقط.</p>
          </>
        )}
      </motion.div>
    </div>
  );
}

function Field({
  icon, placeholder, value, onChange, type, dir,
}: { icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; type: string; dir?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-pill border-2 border-warm-gray bg-white px-4 py-2.5 focus-within:border-green">
      <span className="text-muted">{icon}</span>
      <input
        type={type}
        dir={dir}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent font-ui text-sm text-black outline-none"
      />
    </div>
  );
}
