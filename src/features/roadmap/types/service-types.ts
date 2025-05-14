
import { Language, LanguageLevel } from '@/types';
import { RoadmapItem, RoadmapNode, ExerciseContent } from '../types';

// Base response type for all service methods
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  status: 'success' | 'error';
}

// Common service method types
export type ServiceResult<T> = Promise<ServiceResponse<T>>;

// RoadmapService types
export interface RoadmapServiceInterface {
  getRoadmapsByLanguage(language: Language): ServiceResult<RoadmapItem[]>;
  getUserRoadmaps(language: Language): ServiceResult<RoadmapItem[]>;
  getRoadmapNodes(userRoadmapId: string): ServiceResult<RoadmapNode[]>;
  initializeRoadmap(level: LanguageLevel, language: Language): ServiceResult<string>;
  getNodeExerciseContent(nodeId: string): Promise<ExerciseContent | null>;
}

// ProgressService types
export interface ProgressServiceInterface {
  getRoadmapProgress(roadmapId: string): ServiceResult<RoadmapProgressDetails>;
  recordNodeCompletion(nodeId: string, accuracy: number): ServiceResult<NodeCompletionResult>;
  markNodeAsCompleted(nodeId: string): ServiceResult<void>;
  resetProgress(roadmapId: string): ServiceResult<void>;
  getNodeProgress(nodeId: string): ServiceResult<NodeProgressDetails>;
}

// Export the type using the correct syntax for isolated modules
export interface NodeCompletionResult {
  isCompleted: boolean;
  completionCount: number;
  nextNodeId?: string;
}

// ExerciseService types
export interface ExerciseServiceInterface {
  getNodeExercise(nodeId: string): ServiceResult<ExerciseContent | null>;
  submitExerciseResult(exerciseId: string, result: ExerciseSubmission): ServiceResult<ExerciseResult>;
  generateExercise(language: Language, level: LanguageLevel, topic?: string): ServiceResult<ExerciseContent>;
}

// UserService types
export interface UserServiceInterface {
  getUserPreferences(): ServiceResult<UserPreferences>;
  updateUserPreferences(preferences: Partial<UserPreferences>): ServiceResult<UserPreferences>;
  getUserLearningStats(language?: Language): ServiceResult<UserLearningStats>;
}

// Additional types used by services
export interface RoadmapProgressDetails {
  totalNodes: number;
  completedNodes: number;
  availableNodes: number;
  currentNodeId?: string;
  progressPercentage: number;
  nodeProgress: Record<string, NodeProgressDetails>;
}

export interface NodeProgressDetails {
  nodeId: string;
  completionCount: number;
  isCompleted: boolean;
  lastPracticedAt?: Date;
}

export interface ExerciseSubmission {
  userText: string;
  duration: number;
}

export interface ExerciseResult {
  accuracy: number;
  isCompleted: boolean;
  completionCount: number;
  nextNodeId?: string;
}

export interface UserPreferences {
  selectedLanguage: Language;
  learningLanguages: Language[];
  level: LanguageLevel;
  dailyGoal?: number;
  notificationsEnabled?: boolean;
}

export interface UserLearningStats {
  totalExercisesCompleted: number;
  totalNodesCompleted: number;
  totalRoadmapsCompleted: number;
  averageAccuracy: number;
  streakDays: number;
  lastActiveDate?: Date;
  languageStats: Record<Language, LanguageStats>;
}

export interface LanguageStats {
  exercisesCompleted: number;
  nodesCompleted: number;
  roadmapsCompleted: number;
  averageAccuracy: number;
  level: LanguageLevel;
}
