import { useEffect } from 'react';
import { useGameStore } from '@/state/store';
import { useLeaderboard } from '@/state/selectors';
import { competencies } from '@/data/competencies';
import { quests } from '@/data/quests';
import { EventBus } from '@/game/EventBus';

// Computes per-station progress strings and feeds them to the Phaser markers.
// Renders nothing.
export default function ProgressBridge() {
  const competencyScores = useGameStore((s) => s.competencyScores);
  const questProgress = useGameStore((s) => s.questProgress);
  const currentRung = useGameStore((s) => s.promotionStatus.currentRung);
  const characterTint = useGameStore((s) => s.player.characterTint);
  const ranked = useLeaderboard();

  const assessed = Object.keys(competencyScores).length;
  const doneQuests = Object.values(questProgress).filter((q) => q.done).length;
  const rank = ranked.find((r) => r.isPlayer)?.rank ?? ranked.length;

  useEffect(() => {
    const payload: Record<string, string> = {
      arena: `${assessed}/${competencies.length}`,
      quests: `${doneQuests}/${quests.length}`,
      career: `Lv ${currentRung}`,
      leaderboard: `#${rank}`,
    };
    EventBus.emit('progress:update', payload);
    EventBus.emit('player:tint', characterTint);
    const onRequest = () => {
      EventBus.emit('progress:update', payload);
      EventBus.emit('player:tint', characterTint);
    };
    EventBus.on('progress:request', onRequest);
    return () => EventBus.off('progress:request', onRequest);
  }, [assessed, doneQuests, currentRung, rank, characterTint]);

  return null;
}
