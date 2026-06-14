import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/dbTypes';
import { useGameStore, type RemoteSnapshot } from '@/state/store';

// Loads the player's server state into the store, then mirrors store changes
// back to Supabase (debounced). Source of truth = Supabase; localStorage = cache.
async function loadSnapshot(userId: string, profile: Profile): Promise<RemoteSnapshot> {
  const [ps, cs, qp, bu, of, ep] = await Promise.all([
    supabase.from('player_state').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('competency_scores').select('competency_id,best_score').eq('user_id', userId),
    supabase.from('quest_progress').select('quest_id,completed_steps,done').eq('user_id', userId),
    supabase.from('badges_unlocked').select('badge_id,unlocked_at').eq('user_id', userId),
    supabase.from('owned_frames').select('frame_id').eq('user_id', userId),
    supabase.from('earned_pets').select('pet_id,earned_at,equipped').eq('user_id', userId),
  ]);

  const row = ps.data as Record<string, unknown> | null;
  const snap: RemoteSnapshot = {
    nameAr: profile.full_name ?? undefined,
    avatar: profile.avatar_color ?? undefined,
    avatarImage: profile.avatar_image_url,
    competencyScores: Object.fromEntries(((cs.data ?? []) as { competency_id: string; best_score: number }[]).map((r) => [r.competency_id, r.best_score])),
    questProgress: Object.fromEntries(((qp.data ?? []) as { quest_id: string; completed_steps: string[]; done: boolean }[]).map((r) => [r.quest_id, { completedSteps: r.completed_steps ?? [], done: r.done }])),
    badges: Object.fromEntries(((bu.data ?? []) as { badge_id: string; unlocked_at: string }[]).map((r) => [r.badge_id, { unlockedAt: r.unlocked_at }])),
    ownedFrames: Object.fromEntries(((of.data ?? []) as { frame_id: string }[]).map((r) => [r.frame_id, true as const])),
    pets: Object.fromEntries(((ep.data ?? []) as { pet_id: string; earned_at: string }[]).map((r) => [r.pet_id, { earnedAt: r.earned_at }])),
    equippedPet: ((ep.data ?? []) as { pet_id: string; equipped: boolean }[]).find((r) => r.equipped)?.pet_id ?? null,
  };

  if (row) {
    const daily = row.daily && (row.daily as { date?: string }).date ? (row.daily as RemoteSnapshot['daily']) : undefined;
    snap.player = {
      xp: row.xp as number,
      level: row.level as number,
      energy: row.energy as number,
      energyUpdatedAt: row.energy_updated_at ? Date.parse(row.energy_updated_at as string) : Date.now(),
      titleAr: (row.title_ar as string) ?? undefined,
      characterTint: (row.character_tint as string) ?? null,
      frame: (row.frame as string) ?? null,
    } as RemoteSnapshot['player'];
    snap.coins = row.coins as number;
    snap.streak = row.streak as number;
    snap.lastActiveDay = (row.last_active_day as string) ?? null;
    snap.currentRung = row.current_rung as number;
    if (daily) snap.daily = daily;
    if (row.onboarding && Object.keys(row.onboarding as object).length) snap.onboarding = row.onboarding as RemoteSnapshot['onboarding'];
  }
  return snap;
}

export function useRemoteSync(userId: string | null, profile: Profile | null) {
  const lastPush = useRef(0);
  const timer = useRef<number | null>(null);
  const syncedResults = useRef<Set<string>>(new Set());

  // Hydrate on login
  useEffect(() => {
    if (!userId || !profile) return;
    let cancelled = false;
    loadSnapshot(userId, profile).then((snap) => {
      if (!cancelled) useGameStore.getState().hydrateFromRemote(snap);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, profile]);

  // Write-through (debounced) after hydration
  useEffect(() => {
    if (!userId) return;
    const push = async () => {
      const s = useGameStore.getState();
      if (!s.hydrated) return;
      await supabase.from('player_state').upsert({
        user_id: userId,
        xp: s.player.xp,
        level: s.player.level,
        energy: s.player.energy,
        energy_updated_at: new Date(s.player.energyUpdatedAt).toISOString(),
        title_ar: s.player.titleAr,
        coins: s.coins,
        streak: s.streak,
        last_active_day: s.lastActiveDay,
        character_tint: s.player.characterTint,
        frame: s.player.frame,
        current_rung: s.promotionStatus.currentRung,
        promotion_pending: s.promotionStatus.pendingRequest,
        daily: s.daily,
        onboarding: s.onboarding,
        updated_at: new Date().toISOString(),
      });
      await supabase.from('profiles').update({
        full_name: s.player.nameAr,
        avatar_color: s.player.avatar,
        avatar_image_url: s.player.avatarImage,
        frame: s.player.frame,
      }).eq('id', userId);

      const cs = Object.entries(s.competencyScores).map(([competency_id, best_score]) => ({ user_id: userId, competency_id, best_score }));
      if (cs.length) await supabase.from('competency_scores').upsert(cs, { onConflict: 'user_id,competency_id' });
      const qp = Object.entries(s.questProgress).map(([quest_id, v]) => ({ user_id: userId, quest_id, completed_steps: v.completedSteps, done: v.done, rewarded: v.done }));
      if (qp.length) await supabase.from('quest_progress').upsert(qp, { onConflict: 'user_id,quest_id' });
      const bu = Object.entries(s.badges).map(([badge_id, v]) => ({ user_id: userId, badge_id, unlocked_at: v.unlockedAt }));
      if (bu.length) await supabase.from('badges_unlocked').upsert(bu, { onConflict: 'user_id,badge_id' });
      const of = Object.keys(s.ownedFrames).map((frame_id) => ({ user_id: userId, frame_id }));
      if (of.length) await supabase.from('owned_frames').upsert(of, { onConflict: 'user_id,frame_id' });
      const ep = Object.entries(s.pets).map(([pet_id, v]) => ({ user_id: userId, pet_id, earned_at: v.earnedAt, equipped: s.equippedPet === pet_id }));
      if (ep.length) await supabase.from('earned_pets').upsert(ep, { onConflict: 'user_id,pet_id' });

      // append-only assessment history
      const fresh = s.assessmentHistory.filter((a) => !syncedResults.current.has(a.id));
      if (fresh.length) {
        await supabase.from('assessment_results').insert(
          fresh.map((a) => ({ user_id: userId, competency_id: a.competencyId, date: a.date, correct: a.correct, total: a.total, score_pct: a.scorePct, xp_earned: a.xpEarned }))
        );
        fresh.forEach((a) => syncedResults.current.add(a.id));
      }
      lastPush.current = Date.now();
    };

    const unsub = useGameStore.subscribe(() => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(push, 1500);
    });
    return () => {
      unsub();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [userId]);
}
