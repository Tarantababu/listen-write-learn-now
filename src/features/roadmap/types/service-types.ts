
// If this file doesn't exist or is missing the NodeProgressDetails interface, 
// we need to create/update it
export interface NodeProgressDetails {
  nodeId: string;
  completionCount: number;
  isCompleted: boolean;
  lastPracticedAt?: Date;
  accuracyHistory?: number[];
}

export interface RoadmapProgressData {
  roadmapId: string;
  completedNodes: string[];
  nodeProgress: Record<string, NodeProgressDetails>;
  completionPercentage: number;
}

export interface ProgressResponse {
  success: boolean;
  data?: RoadmapProgressData;
  error?: string;
}

// Service result and interfaces
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  status: 'success' | 'error';
}

// Exercise service interfaces
export interface ExerciseServiceInterface {
  getNodeExercise(nodeId: string): Promise<ServiceResult<ExerciseContent | null>>;
  submitExerciseResult(exerciseId: string, result: ExerciseSubmission): Promise<ServiceResult<ExerciseResult>>;
  generateExercise(language: Language, level: LanguageLevel, topic?: string): Promise<ServiceResult<ExerciseContent>>;
}

export interface ExerciseSubmission {
  userText: string;
  timeTaken?: number;
  audioRecorded?: boolean;
}

export interface ExerciseResult {
  accuracy: number;
  isCompleted: boolean;
  completionCount: number;
}

// Roadmap service interfaces
export interface RoadmapServiceInterface {
  getRoadmapsForLanguage(language: Language): Promise<RoadmapItem[]>;
  getUserRoadmaps(language: Language): Promise<RoadmapItem[]>;
  initializeRoadmap(level: LanguageLevel, language: Language): Promise<string>;
  getRoadmapNodes(userRoadmapId: string): Promise<RoadmapNode[]>;
  getNodeExerciseContent(nodeId: string): Promise<any>;
  recordNodeCompletion(nodeId: string, accuracy: number): Promise<NodeCompletionResult>;
  markNodeCompleted(nodeId: string): Promise<void>;
}

// User service interfaces
export interface UserServiceInterface {
  getUserPreferences(): Promise<ServiceResult<UserPreferences>>;
  updateUserPreferences(preferences: Partial<UserPreferences>): Promise<ServiceResult<UserPreferences>>;
  getUserLearningStats(language?: Language): Promise<ServiceResult<UserLearningStats>>;
  getLanguageStats(language: Language): Promise<ServiceResult<LanguageStats>>;
}

export interface UserPreferences {
  selectedLanguage: Language;
  learningLanguages: Language[];
  theme?: 'light' | 'dark' | 'system';
  avatarUrl?: string;
  level?: LanguageLevel;
  dailyGoal?: number;
  notificationsEnabled?: boolean;
}

export interface UserLearningStats {
  exercisesCompleted: number;
  accuracy: number;
  streak: number;
  lastActivity?: Date;
  byLanguage: Record<Language, LanguageStats>;
  // Additional fields for backward compatibility
  totalExercisesCompleted?: number;
  totalNodesCompleted?: number;
  totalRoadmapsCompleted?: number;
  averageAccuracy?: number;
  streakDays?: number;
  lastActiveDate?: Date;
  languageStats?: Record<Language, LanguageStats>;
}

export interface LanguageStats {
  exercisesCompleted: number;
  accuracy: number;
  streak: number;
  lastActivity?: Date;
  level?: LanguageLevel;
  // Additional fields for backward compatibility
  nodesCompleted?: number;
  roadmapsCompleted?: number;
  averageAccuracy?: number;
}

// Update NodeCompletionResult type to include lastPracticedAt
export interface NodeCompletionResult {
  completionCount: number;
  isCompleted: boolean;
  lastPracticedAt: Date;
}

// Import necessary types from project
import { Language, LanguageLevel } from '@/types';
import { ExerciseContent, RoadmapItem, RoadmapNode } from '../types';
