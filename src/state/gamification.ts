import type { Difficulty } from '@/types';

export const MAX_ENERGY = 100;
export const ENERGY_REGEN_PER_MIN = 1;

// Cumulative XP required to *reach* a given level.
// threshold(n) = 100 * (n-1) * n / 2  → level 1 = 0, level 2 = 100, level 3 = 300, level 4 = 600 ...
export function xpThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  return (100 * (level - 1) * level) / 2;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xp >= xpThresholdForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export interface LevelProgress {
  level: number;
  currentLevelXp: number; // xp into the current level
  neededForNext: number; // xp span of the current level
  pct: number; // 0-100
  xpToNext: number; // remaining xp to next level
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  const base = xpThresholdForLevel(level);
  const next = xpThresholdForLevel(level + 1);
  const span = next - base;
  const into = xp - base;
  return {
    level,
    currentLevelXp: into,
    neededForNext: span,
    pct: span > 0 ? Math.min(100, Math.round((into / span) * 100)) : 100,
    xpToNext: Math.max(0, next - xp),
  };
}

const DIFFICULTY_FACTOR: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
};

export function energyCostForWrong(difficulty: Difficulty): number {
  return Math.round(10 * DIFFICULTY_FACTOR[difficulty]);
}

// Energy regenerated since a timestamp (minute-based), capped at MAX_ENERGY.
export function regenEnergyValue(current: number, updatedAt: number, now = Date.now()): number {
  const minutes = Math.floor((now - updatedAt) / 60000);
  if (minutes <= 0) return current;
  return Math.min(MAX_ENERGY, current + minutes * ENERGY_REGEN_PER_MIN);
}
