
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
}

export interface UserRoadmap {
  id: string;
  userId: string;
  roadmapId: string;
  language: Language;
  name?: string; // Added to match expected fields
  level?: LanguageLevel; // Added to match expected fields
  description?: string;
  languages?: Language[]; // Added to match expected fields
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
