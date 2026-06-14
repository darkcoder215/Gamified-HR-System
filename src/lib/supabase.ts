import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// When env is absent the app falls back to the local single-player demo (no auth).
export const hasSupabase = Boolean(url && key);

export const supabase = hasSupabase
  ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : (null as unknown as ReturnType<typeof createClient>);
