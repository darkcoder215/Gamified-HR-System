import GameApp from './GameApp';

// Login removed by request: the app opens directly into the single-player
// world with no credentials. (To restore auth + role dashboards, revert this
// file to the AuthProvider/AuthScreen gate and ensure the Supabase env vars
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set on the deployment.)
export default function App() {
  return <GameApp />;
}
