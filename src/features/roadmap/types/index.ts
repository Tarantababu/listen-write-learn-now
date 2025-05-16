
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
  roadmapId?: string; // Added for user roadmaps that reference parent roadmap
  currentNodeId?: string; // For tracking current node in user roadmaps
  completedNodes?: string[]; // For tracking completed nodes
  totalNodes?: number; // For tracking total nodes
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
  progressCount?: number; // Add this for tracking node progress count
}

export interface NodeCompletionResult {
  completionCount: number;
  isCompleted: boolean;
  lastPracticedAt: Date; // Added to match what's returned by API
}

export interface ExerciseContent {
  id?: string;
  title: string;
  text: string;
  language: Language;
  audioUrl?: string; // Changed from audio_url to audioUrl for consistency
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
