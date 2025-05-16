
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';
export type LanguageLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Update BadgeVariant to include "success"
export type BadgeVariant = "default" | "destructive" | "outline" | "secondary" | "success";

// Add Exercise type definition
export interface Exercise {
  id: string;
  title: string;
  text: string;
  language: Language;
  tags: string[];
  createdAt: string;
  userId: string;
  directoryId: string | null;
  isCompleted?: boolean;
  completionCount: number;
  audioUrl?: string;
  default_exercise_id?: string;
}

// Add Directory type definition
export interface Directory {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  createdAt: string;
}

// Add VocabularyItem type definition
export interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  exampleSentence: string;
  language: Language;
  userId: string;
  createdAt: string;
  audioUrl?: string;
  exercise_id?: string;
}

// Add Json type definition
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Add Roadmap and related types
export interface Roadmap {
  id: string;
  name: string;
  description: string;
  level: string;
  createdAt: string;
  languageId: string;
}

// Update RoadmapNode to match features/roadmap/types
export interface RoadmapNode {
  id: string;
  name: string;
  description: string;
  roadmapId: string;
  parentId: string | null;
  position: number;
  exerciseCount: number;
  isCompleted?: boolean;
  title: string; // Make title required to match the other implementation
  isBonus?: boolean;
  language?: Language;
  updatedAt?: string;
  createdAt: string; // Added to match the feature/roadmap/types definition
}

export interface RoadmapLanguage {
  id: string;
  name: string;
  code: string;
}
