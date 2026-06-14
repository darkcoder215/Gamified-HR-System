import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/dbTypes';

interface AuthCtx {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

function mapError(msg: string): string {
  if (msg.includes('EMAIL_DOMAIN_NOT_ALLOWED')) return 'هذا البريد غير مسموح به. استخدم بريد الشركة المعتمد.';
  if (msg.includes('Invalid login credentials')) return 'بريد إلكتروني أو كلمة مرور غير صحيحة.';
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'هذا البريد مسجّل بالفعل، سجّل الدخول.';
  if (msg.toLowerCase().includes('password')) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
  return 'حدث خطأ، حاول مرة أخرى.';
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    setProfile((data as Profile) ?? null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await fetchProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) await fetchProfile(s.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthCtx['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { error: mapError(error.message) } : {};
  };

  const signUp: AuthCtx['signUp'] = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    if (error) return { error: mapError(error.message) };
    // If email confirmation is on, there is no session yet.
    return { needsConfirm: !data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const reloadProfile = async () => {
    if (session) await fetchProfile(session.user.id);
  };

  return (
    <Ctx.Provider value={{ session, profile, loading, signIn, signUp, signOut, reloadProfile }}>
      {children}
    </Ctx.Provider>
  );
}
