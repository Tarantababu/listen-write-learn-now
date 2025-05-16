import { Language, LanguageLevel } from '@/types';

export interface RoadmapItem {
  id: string;
  name: string;
  description?: string;
  level: LanguageLevel;
  language: Language;
  updatedAt: Date;
  createdAt: Date;
  nodeCount?: number;
  completedCount?: number;
}

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  title: string;
  description: string;
  position: number;
  isBonus?: boolean;
  language?: Language;
  status?: 'locked' | 'available' | 'completed' | 'current';
  completionCount?: number;
  isCompleted?: boolean;
  lastPracticedAt?: Date;
  defaultExerciseId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface NodeCompletionResult {
  completionCount: number;
  isCompleted: boolean;
  lastPracticedAt: Date;
}

export interface ExerciseContent {
  id?: string;
  title: string;
  text: string;
  language: Language;
  audio_url?: string;
  tags?: string[];
}

export interface RoadmapProgress {
  id: string;
  userId: string;
  roadmapId: string;
  nodeId: string;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeProgress {
  nodeId: string;
  completionCount: number;
  isCompleted: boolean;
  lastPracticedAt?: Date;
}
