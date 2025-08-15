
import { DifficultyLevel } from '@/types/sentence-mining';

export interface WordSelectionOptions {
  language: string;
  difficulty: DifficultyLevel;
  count: number;
  excludeWords?: string[];
  maxRepetitions?: number;
}

export interface WordSelectionResult {
  words: string[];
  metadata: {
    selectionQuality: number;
    diversityScore: number;
    source: string;
    totalAvailable: number;
    difficultyLevel?: DifficultyLevel;
  };
}

export interface WordFrequencyData {
  top1k: string[];
  top3k: string[];
  top5k: string[];
  top10k: string[];
}

export interface SessionData {
  totalExercises: number;
  correctAnswers: number;
  lastAccessed: number;
  wordUsage?: Record<string, { count: number; correct: number; lastUsed: number }>;
}
