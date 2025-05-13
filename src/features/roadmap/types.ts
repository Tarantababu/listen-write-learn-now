
import { Language, LanguageLevel } from "@/types";

export interface RoadmapItem {
  id: string;
  name: string;
  level: LanguageLevel;
  language: Language;
  languages?: Language[];
  roadmapId?: string;
  userId?: string;
  currentNodeId?: string;
  description?: string; // Add description property to fix errors
}

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  position: number;
  isBonus: boolean;
  language: string;
  status?: 'completed' | 'current' | 'locked' | 'available';
  progressCount?: number;
  roadmapId?: string;
  createdAt?: Date; // Add these properties to match the other RoadmapNode type
  updatedAt?: Date;
}

export interface ExerciseContent {
  title: string;
  text: string;
  language: Language;
  audioUrl?: string;
  readingAnalysisId?: string | null;
  id?: string; // Add id property to fix errors
}

export interface NodeCompletionResult {
  isCompleted: boolean;
  completionCount: number;
  nextNodeId?: string;
}
