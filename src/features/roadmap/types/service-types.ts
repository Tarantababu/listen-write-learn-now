
import { Language, LanguageLevel } from '@/types';
import { CurriculumPathItem, CurriculumNode, ExerciseContent, NodeCompletionResult } from '../types';

// Base response type for all service methods
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  status: 'success' | 'error';
}

// Common service method types
export type ServiceResult<T> = Promise<ServiceResponse<T>>;

// CurriculumPathService types
export interface CurriculumPathServiceInterface {
  getCurriculumPathsByLanguage(language: Language): ServiceResult<CurriculumPathItem[]>;
  getUserCurriculumPaths(language: Language): ServiceResult<CurriculumPathItem[]>;
  getCurriculumNodes(userCurriculumPathId: string): ServiceResult<CurriculumNode[]>;
  initializeCurriculumPath(level: LanguageLevel, language: Language): ServiceResult<string>;
}

// ProgressService types
export interface ProgressServiceInterface {
  getCurriculumPathProgress(curriculumPathId: string): ServiceResult<CurriculumPathProgressDetails>;
  recordNodeCompletion(nodeId: string, accuracy: number): ServiceResult<NodeCompletionResult>;
  markNodeAsCompleted(nodeId: string): ServiceResult<void>;
  resetProgress(curriculumPathId: string): ServiceResult<void>;
  getNodeProgress(nodeId: string): ServiceResult<NodeProgressDetails>;
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
export interface CurriculumPathProgressDetails {
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
  totalCurriculumPathsCompleted: number;
  averageAccuracy: number;
  streakDays: number;
  lastActiveDate?: Date;
  languageStats: Record<Language, LanguageStats>;
}

export interface LanguageStats {
  exercisesCompleted: number;
  nodesCompleted: number;
  curriculumPathsCompleted: number;
  averageAccuracy: number;
  level: LanguageLevel;
}
