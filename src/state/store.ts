import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AssessmentResult, Badge, StationId } from '@/types';
import { badges as allBadges } from '@/data/badges';
import { careerLadder } from '@/data/careerLadder';
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
}

interface PersistedState {
  started: boolean;
  player: PlayerState;
  competencyScores: Record<string, number>; // best percentage per competency
  assessmentHistory: AssessmentResult[];
  questProgress: Record<string, { completedSteps: string[]; done: boolean }>;
  badges: Record<string, { unlockedAt: string }>;
  promotionStatus: { currentRung: number; pendingRequest: boolean };
  onboarding: { moved: boolean; visited: Partial<Record<StationId, boolean>>; checklistDismissed: boolean };
}

interface GameState extends PersistedState {
  // transient UI state (not persisted)
  activeStation: StationId | null;
  characterOpen: boolean;

  // actions
  startGame: (name: string) => void;
  setName: (name: string) => void;
  setAvatarImage: (dataUrl: string | null) => void;
  setCharacterTint: (hex: string | null) => void;
  openCharacter: () => void;
  closeCharacter: () => void;
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
  resetSave: () => void;
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
};

const initialPersisted: PersistedState = {
  started: false,
  player: initialPlayer,
  competencyScores: {},
  assessmentHistory: [],
  questProgress: {},
  badges: {},
  promotionStatus: { currentRung: 1, pendingRequest: false },
  onboarding: { moved: false, visited: {}, checklistDismissed: false },
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

        setAvatarImage: (dataUrl) =>
          set({ player: { ...get().player, avatarImage: dataUrl } }),
        setCharacterTint: (hex) => set({ player: { ...get().player, characterTint: hex } }),
        openCharacter: () => set({ characterOpen: true }),
        closeCharacter: () => set({ characterOpen: false }),

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
          commit({
            assessmentHistory: [result, ...prev.assessmentHistory].slice(0, 50),
            competencyScores: { ...prev.competencyScores, [result.competencyId]: best },
            player: { ...prev.player, xp: prev.player.xp + result.xpEarned },
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
          commit({
            questProgress: {
              ...prev.questProgress,
              [questId]: { ...entry, completedSteps: [...entry.completedSteps, '__rewarded__'] },
            },
            player: { ...prev.player, xp: prev.player.xp + xpReward },
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
          set({ ...initialPersisted, player: { ...initialPlayer, energyUpdatedAt: Date.now() }, activeStation: null, characterOpen: false });
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
        onboarding: state.onboarding,
      }),
      onRehydrateStorage: () => (state) => {
        // regenerate energy based on elapsed offline time
        state?.regenEnergy();
      },
    }
  )
);
