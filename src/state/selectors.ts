import type { CareerRung, Peer } from '@/types';
import { careerLadder } from '@/data/careerLadder';
import { peers } from '@/data/leaderboard';
import { useGameStore } from './store';

export interface PromotionEligibility {
  current: CareerRung;
  next?: CareerRung;
  xpMet: boolean;
  competencyChecks: { competencyId: string; minScore: number; score: number; met: boolean }[];
  allMet: boolean;
}

export function usePromotionEligibility(): PromotionEligibility {
  const { player, competencyScores, promotionStatus } = useGameStore();
  const current = careerLadder.find((r) => r.level === promotionStatus.currentRung) ?? careerLadder[0];
  const next = careerLadder.find((r) => r.level === promotionStatus.currentRung + 1);

  if (!next) {
    return { current, next: undefined, xpMet: true, competencyChecks: [], allMet: false };
  }

  const xpMet = player.xp >= next.xpThreshold;
  const competencyChecks = next.requiredCompetencies.map((rc) => {
    const score = competencyScores[rc.competencyId] ?? 0;
    return { competencyId: rc.competencyId, minScore: rc.minScore, score, met: score >= rc.minScore };
  });
  const allMet = xpMet && competencyChecks.every((c) => c.met);
  return { current, next, xpMet, competencyChecks, allMet };
}

export interface RankedEntry extends Peer {
  isPlayer: boolean;
  rank: number;
}

export function useLeaderboard(): RankedEntry[] {
  const { player } = useGameStore();
  const playerEntry: Peer = {
    id: '__player__',
    nameAr: player.nameAr,
    titleAr: player.titleAr,
    level: player.level,
    xp: player.xp,
    avatar: player.avatar,
  };
  const all = [...peers, playerEntry].sort((a, b) => b.xp - a.xp);
  return all.map((p, i) => ({ ...p, isPlayer: p.id === '__player__', rank: i + 1 }));
}
