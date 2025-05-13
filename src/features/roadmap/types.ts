
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
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  createdAt?: Date;
  updatedAt?: Date;
  defaultExerciseId?: string;
}

export interface ExerciseContent {
  id?: string;
  title: string;
  text: string;
  language: Language;
  audioUrl?: string;
  readingAnalysisId?: string | null;
  tags?: string[];
}

export interface NodeCompletionResult {
  isCompleted: boolean;
  completionCount: number;
  nextNodeId?: string;
}
