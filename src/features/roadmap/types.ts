
import { Language } from '@/types';

// Core roadmap types
export interface RoadmapItem {
  id: string;
  name: string;
  level: string;
  description?: string;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
  
  // User-specific properties when this is a user roadmap
  currentNodeId?: string;
  progress?: number;
}

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  title: string;
  description?: string;
  position: number;
  exerciseId?: string;
  isBonus: boolean;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
  
  // UI state properties
  status?: 'locked' | 'available' | 'completed' | 'current';
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
}
