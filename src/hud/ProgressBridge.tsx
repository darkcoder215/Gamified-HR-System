import { useEffect } from 'react';
import { useGameStore } from '@/state/store';
import { useLeaderboard } from '@/state/selectors';
import { competencies } from '@/data/competencies';
import { quests } from '@/data/quests';
import { EventBus } from '@/game/EventBus';

// Feeds per-station progress to the Phaser markers and relays world events
// (first movement) back into the store. Renders nothing.
export default function ProgressBridge() {
  const competencyScores = useGameStore((s) => s.competencyScores);
  const questProgress = useGameStore((s) => s.questProgress);
  const currentRung = useGameStore((s) => s.promotionStatus.currentRung);
  const characterTint = useGameStore((s) => s.player.characterTint);
  const markMoved = useGameStore((s) => s.markMoved);
  const ranked = useLeaderboard();

  const assessed = Object.keys(competencyScores).length;
  const doneQuests = Object.values(questProgress).filter((q) => q.done).length;
  const rank = ranked.find((r) => r.isPlayer)?.rank ?? ranked.length;
  const team = ranked.length;

  useEffect(() => {
    EventBus.on('player:moved', markMoved);
    return () => EventBus.off('player:moved', markMoved);
  }, [markMoved]);

  useEffect(() => {
    const payload: Record<string, string> = {
      arena: `${assessed}/${competencies.length}`,
      quests: `${doneQuests}/${quests.length}`,
      career: `Lv ${currentRung}`,
      leaderboard: `#${rank}`,
      org: `${team} 👥`,
    };
    const emit = () => {
      EventBus.emit('progress:update', payload);
      EventBus.emit('player:tint', characterTint);
    };
    emit();
    EventBus.on('progress:request', emit);
    return () => EventBus.off('progress:request', emit);
  }, [assessed, doneQuests, currentRung, rank, team, characterTint]);

  return null;
}
