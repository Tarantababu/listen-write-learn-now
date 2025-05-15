
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
  userId?: string; // Added to match UserRoadmap type
  createdBy?: string; // Added to support the roadmapService
}

export interface UserRoadmap {
  id: string;
  userId: string;
  roadmapId: string;
  language: Language;
  name: string; // Required field
  level: LanguageLevel; // Required field
  description?: string;
  languages?: Language[]; // Optional field
  currentNodeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  title: string;
  description: string; // Made required to match usage
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
