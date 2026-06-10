import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AssessmentResult, Badge, StationId } from '@/types';
import { badges as allBadges } from '@/data/badges';
import { careerLadder } from '@/data/careerLadder';
import { type DailyState, freshDaily, allDailiesDone, DAILY_REWARD } from '@/data/dailies';
import {
  MAX_ENERGY,
  levelForXp,
  regenEnergyValue,
} from './gamification';
import { EventBus } from '@/game/EventBus';

interface PlayerState {
  nameAr: string;
  xp: number;
  level: number;
  energy: number;
  energyUpdatedAt: number;
  titleAr: string;
  avatar: string; // color token for the avatar disc (fallback)
  avatarImage: string | null; // AI-generated pixel avatar (data URL)
  characterTint: string | null; // optional recolor of the in-world sprite
  frame: string | null; // equipped cosmetic avatar frame id
}

interface PersistedState {
  started: boolean;
  player: PlayerState;
  competencyScores: Record<string, number>; // best percentage per competency
  assessmentHistory: AssessmentResult[];
  questProgress: Record<string, { completedSteps: string[]; done: boolean }>;
  badges: Record<string, { unlockedAt: string }>;
  promotionStatus: { currentRung: number; pendingRequest: boolean };
  coins: number;
  ownedFrames: Record<string, true>;
  colleagueAvatars: Record<string, string>; // npc/person id → AI avatar data URL
  daily: DailyState;
  streak: number;
  lastActiveDay: string | null;
  seenZones: Record<string, true>; // zones whose unlock has been celebrated
  onboarding: {
    moved: boolean;
    visited: Partial<Record<StationId, boolean>>;
    checklistDismissed: boolean;
    introSeen: boolean;
  };
}

interface GameState extends PersistedState {
  // transient UI state (not persisted)
  activeStation: StationId | null;
  characterOpen: boolean;
  guideOpen: boolean;
  analyticsOpen: boolean;
  introReplay: boolean;
  activeNpc: string | null;
  muted: boolean;
  shopOpen: boolean;
  dailyOpen: boolean;
  zonesOpen: boolean;

  // actions
  startGame: (name: string) => void;
  setName: (name: string) => void;
  setAvatarImage: (dataUrl: string | null) => void;
  setCharacterTint: (hex: string | null) => void;
  openCharacter: () => void;
  closeCharacter: () => void;
  openGuide: () => void;
  closeGuide: () => void;
  openAnalytics: () => void;
  closeAnalytics: () => void;
  addXp: (amount: number) => void;
  loseEnergy: (amount: number) => void;
  regenEnergy: () => void;
  recordAssessment: (result: AssessmentResult) => void;
  toggleQuestStep: (questId: string, stepId: string, totalSteps: number) => void;
  completeQuest: (questId: string, xpReward: number, badgeId?: string) => void;
  requestPromotion: () => void;
  approvePromotion: () => void;
  openStation: (id: StationId) => void;
  closeStation: () => void;
  markMoved: () => void;
  dismissChecklist: () => void;
  finishIntro: () => void;
  replayIntro: () => void;
  talkNpc: (id: string) => void;
  endDialogue: () => void;
  toggleMuted: () => void;
  openShop: () => void;
  closeShop: () => void;
  buyFrame: (id: string, price: number) => void;
  equipFrame: (id: string | null) => void;
  buyEnergyRefill: (price: number) => void;
  setColleagueAvatar: (id: string, dataUrl: string) => void;
  openDaily: () => void;
  closeDaily: () => void;
  claimDaily: () => void;
  openZones: () => void;
  closeZones: () => void;
  markZoneSeen: (id: string) => void;
  resetSave: () => void;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

// Roll the daily counters to today and advance the login streak on a new day.
function rollDaily(s: { daily: DailyState; streak: number; lastActiveDay: string | null }) {
  const t = todayStr();
  if (s.daily.date === t) return { daily: s.daily, streak: s.streak, lastActiveDay: t };
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = s.lastActiveDay === yesterday ? s.streak + 1 : 1;
  return { daily: freshDaily(t), streak, lastActiveDay: t };
}

const initialPlayer: PlayerState = {
  nameAr: 'لاعب جديد',
  xp: 0,
  level: 1,
  energy: MAX_ENERGY,
  energyUpdatedAt: Date.now(),
  titleAr: careerLadder[0].titleAr,
  avatar: '#00c17a',
  avatarImage: null,
  characterTint: null,
  frame: null,
};

const initialPersisted: PersistedState = {
  started: false,
  player: initialPlayer,
  competencyScores: {},
  assessmentHistory: [],
  questProgress: {},
  badges: {},
  promotionStatus: { currentRung: 1, pendingRequest: false },
  coins: 0,
  ownedFrames: {},
  colleagueAvatars: {},
  daily: freshDaily(''), // empty date → first activity rolls to today and starts the streak
  streak: 0,
  lastActiveDay: null,
  seenZones: {},
  onboarding: { moved: false, visited: {}, checklistDismissed: false, introSeen: false },
};

// Evaluate which badges should now be unlocked given a state snapshot.
function newlyEarnedBadges(state: PersistedState): Badge[] {
  const doneQuests = Object.values(state.questProgress).filter((q) => q.done).length;
  const hasPerfect = state.assessmentHistory.some((a) => a.scorePct === 100);
  return allBadges.filter((b) => {
    if (state.badges[b.id]) return false; // already unlocked
    switch (b.rule.type) {
      case 'xp':
        return state.player.xp >= b.rule.value;
      case 'level':
        return state.player.level >= b.rule.value;
      case 'quest':
        return !!state.questProgress[b.rule.questId]?.done;
      case 'questCount':
        return doneQuests >= b.rule.value;
      case 'assessmentCount':
        return state.assessmentHistory.length >= b.rule.value;
      case 'perfectAssessment':
        return hasPerfect;
      case 'promotion':
        return state.promotionStatus.currentRung > 1;
      default:
        return false;
    }
  });
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      // Apply derived level + badge unlocks, emit celebrations, then persist.
      const commit = (partial: Partial<PersistedState>) => {
        const prev = get();
        const draft: PersistedState = {
          started: partial.started ?? prev.started,
          player: { ...prev.player, ...(partial.player ?? {}) },
          competencyScores: partial.competencyScores ?? prev.competencyScores,
          assessmentHistory: partial.assessmentHistory ?? prev.assessmentHistory,
          questProgress: partial.questProgress ?? prev.questProgress,
          badges: { ...prev.badges, ...(partial.badges ?? {}) },
          promotionStatus: partial.promotionStatus ?? prev.promotionStatus,
          coins: partial.coins ?? prev.coins,
          ownedFrames: partial.ownedFrames ?? prev.ownedFrames,
          colleagueAvatars: partial.colleagueAvatars ?? prev.colleagueAvatars,
          daily: partial.daily ?? prev.daily,
          streak: partial.streak ?? prev.streak,
          lastActiveDay: partial.lastActiveDay ?? prev.lastActiveDay,
          seenZones: { ...prev.seenZones, ...(partial.seenZones ?? {}) },
          onboarding: partial.onboarding ?? prev.onboarding,
        };

        // derive level from xp
        const prevLevel = prev.player.level;
        const newLevel = levelForXp(draft.player.xp);
        const leveledUp = newLevel > prevLevel;
        draft.player.level = newLevel;
        if (leveledUp) {
          draft.player.energy = MAX_ENERGY; // full refill on level-up
          draft.player.energyUpdatedAt = Date.now();
        }

        // unlock badges that now qualify
        const earned = newlyEarnedBadges(draft);
        const now = new Date().toISOString();
        for (const b of earned) {
          draft.badges[b.id] = { unlockedAt: now };
        }

        set(draft);

        // side-effects after state is committed
        if (leveledUp) EventBus.emit('player:levelup', { level: newLevel });
        for (const b of earned) EventBus.emit('badge:unlock', b);
      };

      return {
        ...initialPersisted,
        activeStation: null,
        characterOpen: false,
        guideOpen: false,
        analyticsOpen: false,
        introReplay: false,
        activeNpc: null,
        muted: false,
        shopOpen: false,
        dailyOpen: false,
        zonesOpen: false,

        openShop: () => set({ shopOpen: true }),
        closeShop: () => set({ shopOpen: false }),
        openZones: () => set({ zonesOpen: true }),
        closeZones: () => set({ zonesOpen: false }),
        markZoneSeen: (id) => set({ seenZones: { ...get().seenZones, [id]: true } }),
        openDaily: () => {
          const r = rollDaily(get());
          commit({ daily: r.daily, streak: r.streak, lastActiveDay: r.lastActiveDay });
          set({ dailyOpen: true });
        },
        closeDaily: () => set({ dailyOpen: false }),
        claimDaily: () => {
          const s = get();
          if (s.daily.claimed || !allDailiesDone(s.daily)) return;
          commit({
            daily: { ...s.daily, claimed: true },
            coins: s.coins + DAILY_REWARD.coins,
            player: { ...s.player, xp: s.player.xp + DAILY_REWARD.xp },
          });
        },
        buyFrame: (id, price) => {
          const s = get();
          if (s.ownedFrames[id] || s.coins < price) return;
          commit({
            coins: s.coins - price,
            ownedFrames: { ...s.ownedFrames, [id]: true },
            player: { ...s.player, frame: id },
          });
        },
        equipFrame: (id) => set({ player: { ...get().player, frame: id } }),
        buyEnergyRefill: (price) => {
          const s = get();
          if (s.coins < price || s.player.energy >= MAX_ENERGY) return;
          commit({
            coins: s.coins - price,
            player: { ...s.player, energy: MAX_ENERGY, energyUpdatedAt: Date.now() },
          });
        },
        setColleagueAvatar: (id, dataUrl) =>
          set({ colleagueAvatars: { ...get().colleagueAvatars, [id]: dataUrl } }),

        finishIntro: () =>
          set({ introReplay: false, onboarding: { ...get().onboarding, introSeen: true } }),
        replayIntro: () => set({ introReplay: true }),
        talkNpc: (id) => {
          const r = rollDaily(get());
          commit({ daily: { ...r.daily, talk: true }, streak: r.streak, lastActiveDay: r.lastActiveDay });
          set({ activeNpc: id });
        },
        endDialogue: () => set({ activeNpc: null }),
        toggleMuted: () => set({ muted: !get().muted }),

        setAvatarImage: (dataUrl) =>
          set({ player: { ...get().player, avatarImage: dataUrl } }),
        setCharacterTint: (hex) => set({ player: { ...get().player, characterTint: hex } }),
        openCharacter: () => set({ characterOpen: true }),
        closeCharacter: () => set({ characterOpen: false }),
        openGuide: () => set({ guideOpen: true }),
        closeGuide: () => set({ guideOpen: false }),
        openAnalytics: () => set({ analyticsOpen: true }),
        closeAnalytics: () => set({ analyticsOpen: false }),

        startGame: (name) =>
          commit({ started: true, player: { ...get().player, nameAr: name.trim() || 'لاعب جديد' } }),

        setName: (name) =>
          commit({ player: { ...get().player, nameAr: name.trim() || 'لاعب جديد' } }),

        addXp: (amount) => commit({ player: { ...get().player, xp: get().player.xp + amount } }),

        loseEnergy: (amount) => {
          const p = get().player;
          set({
            player: {
              ...p,
              energy: Math.max(0, p.energy - amount),
              energyUpdatedAt: Date.now(),
            },
          });
        },

        regenEnergy: () => {
          const p = get().player;
          const regenerated = regenEnergyValue(p.energy, p.energyUpdatedAt);
          if (regenerated !== p.energy) {
            set({ player: { ...p, energy: regenerated, energyUpdatedAt: Date.now() } });
          }
        },

        recordAssessment: (result) => {
          const prev = get();
          const best = Math.max(prev.competencyScores[result.competencyId] ?? 0, result.scorePct);
          const r = rollDaily(prev);
          commit({
            assessmentHistory: [result, ...prev.assessmentHistory].slice(0, 50),
            competencyScores: { ...prev.competencyScores, [result.competencyId]: best },
            coins: prev.coins + result.correct * 5,
            player: { ...prev.player, xp: prev.player.xp + result.xpEarned },
            daily: { ...r.daily, assess: r.daily.assess + 1, xp: r.daily.xp + result.xpEarned },
            streak: r.streak,
            lastActiveDay: r.lastActiveDay,
          });
        },

        toggleQuestStep: (questId, stepId, totalSteps) => {
          const prev = get();
          const entry = prev.questProgress[questId] ?? { completedSteps: [], done: false };
          if (entry.done) return; // locked once completed
          const has = entry.completedSteps.includes(stepId);
          const completedSteps = has
            ? entry.completedSteps.filter((s) => s !== stepId)
            : [...entry.completedSteps, stepId];
          commit({
            questProgress: {
              ...prev.questProgress,
              [questId]: { completedSteps, done: completedSteps.length >= totalSteps },
            },
          });
        },

        completeQuest: (questId, xpReward, _badgeId) => {
          const prev = get();
          const entry = prev.questProgress[questId];
          if (!entry || !entry.done) return;
          // award XP only once
          if (entry.completedSteps.includes('__rewarded__')) return;
          const r = rollDaily(prev);
          commit({
            questProgress: {
              ...prev.questProgress,
              [questId]: { ...entry, completedSteps: [...entry.completedSteps, '__rewarded__'] },
            },
            coins: prev.coins + Math.round(xpReward / 4),
            player: { ...prev.player, xp: prev.player.xp + xpReward },
            daily: { ...r.daily, quests: r.daily.quests + 1, xp: r.daily.xp + xpReward },
            streak: r.streak,
            lastActiveDay: r.lastActiveDay,
          });
        },

        requestPromotion: () =>
          set({ promotionStatus: { ...get().promotionStatus, pendingRequest: true } }),

        approvePromotion: () => {
          const prev = get();
          const nextRungLevel = prev.promotionStatus.currentRung + 1;
          const rung = careerLadder.find((r) => r.level === nextRungLevel);
          if (!rung) return;
          commit({
            promotionStatus: { currentRung: nextRungLevel, pendingRequest: false },
            coins: prev.coins + 60,
            player: { ...prev.player, titleAr: rung.titleAr },
          });
        },

        openStation: (id) => {
          const prev = get();
          set({
            activeStation: id,
            onboarding: { ...prev.onboarding, visited: { ...prev.onboarding.visited, [id]: true } },
          });
        },
        closeStation: () => set({ activeStation: null }),
        markMoved: () => {
          if (get().onboarding.moved) return;
          set({ onboarding: { ...get().onboarding, moved: true } });
        },
        dismissChecklist: () =>
          set({ onboarding: { ...get().onboarding, checklistDismissed: true } }),

        resetSave: () => {
          set({ ...initialPersisted, player: { ...initialPlayer, energyUpdatedAt: Date.now() }, activeStation: null, characterOpen: false, guideOpen: false, analyticsOpen: false, introReplay: false, activeNpc: null, shopOpen: false, dailyOpen: false, zonesOpen: false });
        },
      };
    },
    {
      name: 'thmanyah-hr-save',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        started: state.started,
        player: state.player,
        competencyScores: state.competencyScores,
        assessmentHistory: state.assessmentHistory,
        questProgress: state.questProgress,
        badges: state.badges,
        promotionStatus: state.promotionStatus,
        coins: state.coins,
        ownedFrames: state.ownedFrames,
        colleagueAvatars: state.colleagueAvatars,
        daily: state.daily,
        streak: state.streak,
        lastActiveDay: state.lastActiveDay,
        seenZones: state.seenZones,
        onboarding: state.onboarding,
        muted: state.muted,
      }),
      onRehydrateStorage: () => (state) => {
        // regenerate energy based on elapsed offline time
        state?.regenEnergy();
      },
    }
  )
);
