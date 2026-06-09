export type StationId = 'arena' | 'quests' | 'career' | 'leaderboard';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Competency {
  id: string;
  nameAr: string;
  descAr: string;
  /** lucide icon name, rendered in React */
  icon: string;
  color: string; // brand token hex used for accents
}

export interface Question {
  id: string;
  competencyId: string;
  promptAr: string;
  choicesAr: string[];
  correctIndex: number;
  explanationAr: string;
  xp: number;
  difficulty: Difficulty;
}

export interface QuestStep {
  id: string;
  titleAr: string;
}

export interface Quest {
  id: string;
  titleAr: string;
  descAr: string;
  pathAr: string; // learning path / grouping
  competencyId: string;
  steps: QuestStep[];
  xpReward: number;
  badgeId?: string;
  difficulty: Difficulty;
}

export type BadgeRule =
  | { type: 'xp'; value: number }
  | { type: 'level'; value: number }
  | { type: 'quest'; questId: string }
  | { type: 'questCount'; value: number }
  | { type: 'assessmentCount'; value: number }
  | { type: 'perfectAssessment' }
  | { type: 'promotion' };

export interface Badge {
  id: string;
  nameAr: string;
  descAr: string;
  /** emoji or short symbol shown in the badge medallion */
  icon: string;
  color: string;
  rule: BadgeRule;
}

export interface RequiredCompetency {
  competencyId: string;
  minScore: number; // percentage 0-100
}

export interface CareerRung {
  level: number;
  titleAr: string;
  descAr: string;
  xpThreshold: number;
  requiredCompetencies: RequiredCompetency[];
  requiresManagerApproval: boolean;
}

export interface Peer {
  id: string;
  nameAr: string;
  titleAr: string;
  level: number;
  xp: number;
  /** background color for the avatar disc */
  avatar: string;
}

export interface AssessmentResult {
  id: string;
  competencyId: string;
  date: string; // ISO
  correct: number;
  total: number;
  scorePct: number;
  xpEarned: number;
}
