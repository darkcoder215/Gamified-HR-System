import { useEffect } from 'react';
import { useGameStore } from '@/state/store';
import { useLeaderboard } from '@/state/selectors';
import { competencies } from '@/data/competencies';
import { quests } from '@/data/quests';
import { zones, lockedStationIds } from '@/data/zones';
import { getPet } from '@/data/pets';
import { EventBus } from '@/game/EventBus';

// Feeds per-station progress to the Phaser markers and relays world events
// (first movement) back into the store. Renders nothing.
export default function ProgressBridge() {
  const competencyScores = useGameStore((s) => s.competencyScores);
  const questProgress = useGameStore((s) => s.questProgress);
  const currentRung = useGameStore((s) => s.promotionStatus.currentRung);
  const characterTint = useGameStore((s) => s.player.characterTint);
  const equippedPet = useGameStore((s) => s.equippedPet);
  const markMoved = useGameStore((s) => s.markMoved);
  const talkNpc = useGameStore((s) => s.talkNpc);
  const level = useGameStore((s) => s.player.level);
  const seenZones = useGameStore((s) => s.seenZones);
  const markZoneSeen = useGameStore((s) => s.markZoneSeen);
  const ranked = useLeaderboard();

  const assessed = Object.keys(competencyScores).length;
  const doneQuests = Object.values(questProgress).filter((q) => q.done).length;
  const rank = ranked.find((r) => r.isPlayer)?.rank ?? ranked.length;
  const team = ranked.length;

  useEffect(() => {
    EventBus.on('player:moved', markMoved);
    const onTalk = (p: { npcId: string }) => talkNpc(p.npcId);
    EventBus.on('npc:talk', onTalk);
    return () => {
      EventBus.off('player:moved', markMoved);
      EventBus.off('npc:talk', onTalk);
    };
  }, [markMoved, talkNpc]);

  useEffect(() => {
    const payload: Record<string, string> = {
      arena: `${assessed}/${competencies.length}`,
      quests: `${doneQuests}/${quests.length}`,
      career: `Lv ${currentRung}`,
      leaderboard: `#${rank}`,
      org: `${team} 👥`,
    };
    const locked = lockedStationIds(level);
    const petEmoji = getPet(equippedPet)?.emoji ?? null;
    const emit = () => {
      EventBus.emit('progress:update', payload);
      EventBus.emit('player:tint', characterTint);
      EventBus.emit('locks:update', locked);
      EventBus.emit('player:pet', petEmoji);
    };
    emit();
    EventBus.on('progress:request', emit);
    return () => EventBus.off('progress:request', emit);
  }, [assessed, doneQuests, currentRung, rank, team, characterTint, level, equippedPet]);

  // Celebrate newly-unlocked districts (skip the starting district).
  useEffect(() => {
    for (const z of zones) {
      if (z.unlockLevel > 1 && level >= z.unlockLevel && !seenZones[z.id]) {
        markZoneSeen(z.id);
        EventBus.emit('zone:unlock', z);
      }
    }
  }, [level, seenZones, markZoneSeen]);

  return null;
}
