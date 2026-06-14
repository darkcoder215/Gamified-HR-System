import { useState } from 'react';
import { hasSupabase } from './lib/supabase';
import GameApp from './GameApp';
import AuthProvider, { useAuth } from './auth/AuthProvider';
import AuthScreen from './auth/AuthScreen';
import { useRemoteSync } from './auth/useRemoteSync';
import ManagerDashboard from './views/ManagerDashboard';
import HRDashboard from './views/HRDashboard';

function Splash({ text }: { text: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-off-white">
      <p className="animate-pulse font-display text-2xl font-black text-green">{text}</p>
    </div>
  );
}

function RoleHome() {
  const { session, profile, signOut } = useAuth();
  useRemoteSync(session?.user.id ?? null, profile);
  const [playing, setPlaying] = useState(profile?.role === 'employee');

  if (profile && profile.role !== 'employee' && !playing) {
    const onPlay = () => setPlaying(true);
    return profile.role === 'manager' ? <ManagerDashboard onPlay={onPlay} /> : <HRDashboard onPlay={onPlay} />;
  }
  return (
    <GameApp
      backend
      userId={session?.user.id}
      signOut={signOut}
      onExit={profile && profile.role !== 'employee' ? () => setPlaying(false) : undefined}
    />
  );
}

function AuthedApp() {
  const { session, profile, loading } = useAuth();
  if (loading) return <Splash text="جارٍ التحميل…" />;
  if (!session) return <AuthScreen />;
  if (!profile) return <Splash text="جارٍ تجهيز حسابك…" />;
  return <RoleHome />;
}

export default function App() {
  // No backend configured → legacy single-player demo (StartScreen + local save).
  if (!hasSupabase) return <GameApp />;
  return (
    <AuthProvider>
      <AuthedApp />
    </AuthProvider>
  );
}
