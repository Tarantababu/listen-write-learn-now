
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
}

export interface ExerciseContent {
  title: string;
  text: string;
  language: Language;
  audioUrl?: string;
  readingAnalysisId?: string | null;
}

export interface NodeCompletionResult {
  isCompleted: boolean;
  completionCount: number;
  nextNodeId?: string;
}
