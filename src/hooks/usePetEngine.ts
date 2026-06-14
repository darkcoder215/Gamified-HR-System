import { useEffect } from 'react';
import { useGameStore } from '@/state/store';
import { useLeaderboard } from '@/state/selectors';
import { badges as allBadges } from '@/data/badges';
import { earnedPetIds } from '@/data/pets';

// Watches real progress metrics and grants companion pets when their rule is met.
export function usePetEngine() {
  const level = useGameStore((s) => s.player.level);
  const xp = useGameStore((s) => s.player.xp);
  const streak = useGameStore((s) => s.streak);
  const badgeMap = useGameStore((s) => s.badges);
  const currentRung = useGameStore((s) => s.promotionStatus.currentRung);
  const earnPet = useGameStore((s) => s.earnPet);
  const ranked = useLeaderboard();
  const rank = ranked.find((r) => r.isPlayer)?.rank ?? 999;
  const badges = allBadges.filter((b) => badgeMap[b.id]).length;

  useEffect(() => {
    const ids = earnedPetIds({ level, xp, streak, badges, currentRung, rank });
    ids.forEach((id) => earnPet(id));
  }, [level, xp, streak, badges, currentRung, rank, earnPet]);
}
