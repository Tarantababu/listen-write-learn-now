
import { Language, LanguageLevel } from '@/types';

export interface RoadmapItem {
  id: string;
  roadmapId: string; // Added roadmapId property
  name: string;
  level: LanguageLevel;
  description?: string;
  language: Language;
  progress: number; // 0-100
  currentNodeId?: string;
  createdAt: Date;
}

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  title: string;
  description?: string;
  position: number;
  isBonus: boolean;
  language?: Language;
  status: 'completed' | 'current' | 'available' | 'locked';
  progressCount: number; // 0-3
  isCompleted: boolean;
  defaultExerciseId?: string;
}

export interface ExerciseContent {
  id: string;
  title: string;
  text: string;
  audioUrl?: string;
  language: Language;
}

export interface NodeCompletionResult {
  isCompleted: boolean;
  completionCount: number;
  accuracy: number;
}
