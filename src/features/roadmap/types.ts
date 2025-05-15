
import { Language, LanguageLevel } from '@/types';

// Core curriculum path types
export interface CurriculumPathItem {
  id: string;
  name: string;
  level: LanguageLevel;
  description?: string;
  languages?: Language[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  
  // User-specific properties when this is a user curriculum path
  currentNodeId?: string;
  progress?: number;
  language?: Language; 
  curriculumPathId?: string; // Reference to parent curriculum path
}

export interface CurriculumNode {
  id: string;
  curriculumPathId: string;
  title: string;
  description?: string;
  position: number;
  isBonus: boolean;
  defaultExerciseId?: string;
  language?: Language;
  createdAt: Date;
  updatedAt: Date;
  
  // UI state properties
  status?: 'locked' | 'available' | 'completed' | 'current';
  progressCount?: number; // For tracking node progress count
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
  completionCount: number;
  nextNodeId?: string;
  unlockedNodeIds?: string[];
}
