
import { Language, LanguageLevel } from '@/types';

// Core roadmap types
export interface RoadmapItem {
  id: string;
  name: string;
  level: LanguageLevel;
  description?: string;
  languages?: Language[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  
  // User-specific properties when this is a user roadmap
  currentNodeId?: string;
  progress?: number;
  language?: Language; 
  roadmapId?: string; // Add this for user roadmaps that reference parent roadmap
}

export interface RoadmapNode {
  id: string;
  roadmapId: string;
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
  progressCount?: number; // Add this for tracking node progress count
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
  lastPracticedAt: Date; // Added lastPracticedAt property
  nextNodeId?: string;
  unlockedNodeIds?: string[];
}
