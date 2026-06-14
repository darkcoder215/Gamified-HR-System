import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Crown, Medal } from 'lucide-react';
import { useLeaderboard } from '@/state/selectors';
import { useGameStore } from '@/state/store';
import { badges as allBadges } from '@/data/badges';
import { frameStyle } from '@/data/frames';
import PetSprite from '@/ui/PetSprite';
import { hasSupabase, supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import type { LeaderboardRow } from '@/lib/dbTypes';
import NumberText from '@/ui/NumberText';

type Tab = 'ranking' | 'badges';

interface Row {
  id: string; nameAr: string; titleAr: string; level: number; xp: number;
  avatar: string; avatarImage: string | null; frame: string | null; pet: string | null; isPlayer: boolean; rank: number;
}

export default function LeaderboardHall() {
  const [tab, setTab] = useState<Tab>('ranking');
  const mock = useLeaderboard();
  const unlockedMap = useGameStore((s) => s.badges);
  const avatarImage = useGameStore((s) => s.player.avatarImage);
  const playerFrame = useGameStore((s) => s.player.frame);
  const equippedPet = useGameStore((s) => s.equippedPet);
  const auth = useAuth();
  const uid = auth?.session?.user.id;
  const [real, setReal] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    if (!hasSupabase) return;
    supabase.rpc('get_leaderboard').then(({ data }) => {
      if (data && (data as LeaderboardRow[]).length) setReal(data as LeaderboardRow[]);
    });
  }, []);

  const rows: Row[] = real
    ? real.map((r, i) => ({
        id: r.id, nameAr: r.full_name ?? '—', titleAr: r.title_ar ?? '', level: r.level, xp: r.xp,
        avatar: r.avatar_color ?? '#00c17a', avatarImage: r.avatar_image_url, frame: r.frame, pet: r.equipped_pet,
        isPlayer: r.id === uid, rank: i + 1,
      }))
    : mock.map((r) => ({
        id: r.id, nameAr: r.nameAr, titleAr: r.titleAr, level: r.level, xp: r.xp,
        avatar: r.avatar, avatarImage: r.isPlayer ? avatarImage : null, frame: r.isPlayer ? playerFrame : null,
        pet: r.isPlayer ? equippedPet : null, isPlayer: r.isPlayer, rank: r.rank,
      }));

  return (
    <div>
      <div className="mb-5 flex gap-2 rounded-pill bg-warm-gray p-1">
        {([['ranking', 'الترتيب', Trophy], ['badges', 'الأوسمة', Award]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="relative flex flex-1 items-center justify-center gap-2 rounded-pill px-4 py-2 font-ui text-sm font-bold transition"
            style={{ color: tab === id ? 'var(--color-white)' : 'var(--color-muted)' }}
          >
            {tab === id && <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-pill bg-black" style={{ zIndex: 0 }} />}
            <span className="relative z-10 flex items-center gap-1.5"><Icon size={16} /> {label}</span>
          </button>
        ))}
      </div>

      {tab === 'ranking' && (
        <div className="overflow-hidden rounded-lg">
          {rows.map((r, i) => {
            const RankIcon = r.rank === 1 ? Crown : r.rank <= 3 ? Medal : null;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  background: r.isPlayer ? 'var(--color-green-light)' : i % 2 === 0 ? 'var(--color-white)' : 'var(--color-off-white)',
                  border: r.isPlayer ? '2px solid var(--color-green)' : undefined,
                  borderRadius: r.isPlayer ? 12 : undefined,
                }}
              >
                <div className="flex w-8 items-center justify-center font-display text-lg font-black text-charcoal">
                  {RankIcon ? <RankIcon size={20} style={{ color: r.rank === 1 ? '#ffbc0a' : '#494c6b' }} /> : <NumberText value={r.rank} />}
                </div>
                <div className="relative">
                  <div
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full font-display text-base font-black text-white"
                    style={{ background: r.avatar, ...frameStyle(r.frame) }}
                  >
                    {r.avatarImage ? <img src={r.avatarImage} alt="" className="h-full w-full object-cover" style={{ imageRendering: 'pixelated' }} /> : r.nameAr.trim().charAt(0)}
                  </div>
                  {r.pet && <div className="absolute -top-2 -end-2"><PetSprite id={r.pet} size={20} /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-ui text-sm font-bold text-black">
                    {r.nameAr} {r.isPlayer && <span className="rounded-pill bg-green px-2 py-0.5 text-[10px] text-white">أنت</span>}
                  </p>
                  <p className="font-ui text-xs text-muted">{r.titleAr}</p>
                </div>
                <div className="text-end">
                  <p className="font-display text-base font-black text-black"><NumberText value={r.xp} group /></p>
                  <p className="font-ui text-[10px] text-muted">المستوى <NumberText value={r.level} /></p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {tab === 'badges' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {allBadges.map((b, i) => {
            const unlocked = !!unlockedMap[b.id];
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col items-center rounded-lg bg-white p-4 text-center shadow-soft"
                style={{ opacity: unlocked ? 1 : 0.55 }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full text-2xl" style={{ background: unlocked ? b.color : 'var(--color-warm-gray)', filter: unlocked ? 'none' : 'grayscale(1)' }}>
                  {b.icon}
                </div>
                <p className="mt-2 font-ui text-sm font-bold text-black">{b.nameAr}</p>
                <p className="font-ui text-[11px] text-muted">{b.descAr}</p>
                {unlocked && <span className="mt-1 font-ui text-[10px] font-bold text-green">✓ مفتوح</span>}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
