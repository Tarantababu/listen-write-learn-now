
import { Language, LanguageLevel } from '@/types';

// Core roadmap types
export interface RoadmapItem {
  id: string;
  name: string;
  level: LanguageLevel;
  description?: string;
  language: Language;
  languages?: Language[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  
  // User-specific properties when this is a user roadmap
  currentNodeId?: string;
  roadmapId?: string;
  progress?: number;
}

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  title: string;
  description?: string;
  position: number;
  exerciseId?: string;
  defaultExerciseId?: string;
  isBonus: boolean;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
  
  // UI state properties
  status?: 'locked' | 'available' | 'completed' | 'current';
  progressCount?: number;
}

// API response for node exercise content
export interface ExerciseContent {
  id: string;
  title: string;
  text: string;
  audioUrl?: string;
  language: Language;
  tags?: string[];
}

// Result of node completion
export interface NodeCompletionResult {
  isCompleted: boolean;
  nextNodeId?: string;
  completionCount?: number;
}
