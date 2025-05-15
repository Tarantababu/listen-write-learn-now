import { Language, LanguageLevel } from '@/types';

export interface RoadmapItem {
  id: string;
  name: string;
  level: LanguageLevel;
  description?: string;
  languages: Language[];
  createdAt: Date;
  updatedAt: Date;
  roadmapId?: string;
  currentNodeId?: string;
  language?: Language;
  userId?: string;
  createdBy?: string;
}

export interface UserRoadmap {
  id: string;
  userId: string;
  roadmapId: string;
  language: Language;
  name: string;
  level: LanguageLevel;
  description?: string;
  languages: Language[]; // Changed from optional to required to match RoadmapItem
  currentNodeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  title: string;
  description: string;
  position: number;
  isBonus: boolean;
  defaultExerciseId?: string;
  language?: Language;
  createdAt: Date;
  updatedAt: Date;
  status?: 'locked' | 'available' | 'completed' | 'current';
  progressCount?: number;
}

export interface ExerciseContent {
  id: string;
  title: string;
  text: string;
  audioUrl?: string;
  language: Language;
  tags?: string[];
}

export interface NodeCompletionResult {
  isCompleted: boolean;
  completionCount: number;
  nextNodeId?: string;
}

export interface ServiceResponse<T> {
  data: T;
  error: Error | null;
}

export interface RoadmapNodeProgress {
  id: string;
  userId: string;
  roadmapId: string;
  nodeId: string;
  language: Language;
  completionCount: number;
  isCompleted: boolean;
  lastPracticedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
