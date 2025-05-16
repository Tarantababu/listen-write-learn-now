
import { Language, LanguageLevel } from '@/types';

export interface RoadmapItem {
  id: string;
  name: string;
  description?: string;
  level?: string;
  createdAt: Date;
  updatedAt: Date;
  language?: Language;
  languages?: Language[];
  roadmapId?: string; // For user roadmaps
  currentNodeId?: string; // For user roadmaps
  userId?: string; // For user roadmaps
}

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  title: string;
  description: string;
  position: number;
  status?: 'locked' | 'available' | 'completed';
  isBonus: boolean;
  defaultExerciseId?: string;
  language?: string;
  isCompleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseContent {
  id: string;
  title: string;
  text: string;
  audio_url?: string;
  language?: string;
}

export interface NodeCompletionResult {
  success: boolean;
  completionCount: number;
  isCompleted: boolean;
  lastPracticedAt: Date;
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
