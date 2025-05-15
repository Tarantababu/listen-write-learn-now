export type Language = 
  | 'english' 
  | 'german' 
  | 'spanish' 
  | 'french' 
  | 'portuguese' 
  | 'italian'
  | 'turkish'
  | 'swedish'
  | 'dutch'
  | 'norwegian'
  | 'russian'
  | 'polish'
  | 'chinese'
  | 'japanese'
  | 'korean'
  | 'arabic';

export interface Exercise {
  id: string;
  title: string;
  text: string;
  language: Language;
  tags: string[];
  audioUrl?: string;
  directoryId: string | null;
  createdAt: Date;
  completionCount: number;
  isCompleted: boolean;
  archived?: boolean;
  default_exercise_id?: string;
}

export interface Directory {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: Date;
}

export interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  exampleSentence: string;
  audioUrl?: string;
  exerciseId: string;
  language: Language;
}

export interface UserSettings {
  learningLanguages: Language[];
  selectedLanguage: Language;
}

// Add the new Curriculum Path types
export type LanguageLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface CurriculumPath {
  id: string;
  language: Language;
  level: LanguageLevel;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CurriculumNode {
  id: string;
  curriculumPathId: string;
  defaultExerciseId?: string;
  title: string;
  description?: string;
  position: number;
  isBonus: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCurriculumPath {
  id: string;
  userId: string;
  curriculumPathId: string;
  language: Language;
  currentNodeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurriculumProgress {
  id: string;
  userId: string;
  curriculumPathId: string;
  nodeId: string;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Add new CurriculumNodeProgress type
export interface CurriculumNodeProgress {
  id: string;
  userId: string;
  curriculumPathId: string;
  nodeId: string;
  language: Language;
  completionCount: number;
  isCompleted: boolean;
  lastPracticedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Add Json type for compatibility with Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface CurriculumContextType {
  curriculumPaths: CurriculumPath[];
  userCurriculumPaths: UserCurriculumPath[]; 
  currentCurriculumPath: UserCurriculumPath | null;
  nodes: CurriculumNode[];
  currentNodeId: string | undefined;
  completedNodes: string[];
  availableNodes: string[];
  nodeProgress: CurriculumNodeProgress[];
  isLoading: boolean;
  nodeLoading: boolean;
  initializeUserCurriculumPath: (level: LanguageLevel, language: Language) => Promise<void>;
  loadUserCurriculumPath: (userCurriculumPathId?: string) => Promise<void>;
  loadUserCurriculumPaths: (language?: Language) => Promise<UserCurriculumPath[] | undefined>;
  completeNode: (nodeId: string) => Promise<void>;
  resetProgress: () => Promise<void>;
  getNodeExercise: (nodeId: string) => Promise<any>;
  markNodeAsCompleted: (nodeId: string) => Promise<void>;
  incrementNodeCompletion: (nodeId: string, accuracy: number) => Promise<void>;
  selectCurriculumPath: (curriculumPathId: string) => Promise<void>;
}

export interface Roadmap {
  id: string;
  name: string;
  level: LanguageLevel;
  description?: string;
  languages: Language[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Ensure UserRoadmap has required name and level properties
export interface UserRoadmap {
  id: string;
  userId: string;
  roadmapId: string;
  language: Language;
  name: string; // Required field
  level: LanguageLevel; // Required field
  description?: string;
  languages?: Language[];
  currentNodeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  title: string;
  description: string; // Required field to match feature/roadmap/types
  position: number;
  isBonus: boolean;
  defaultExerciseId?: string;
  language?: Language;
  createdAt: Date;
  updatedAt: Date;
  
  // UI state properties
  status?: 'locked' | 'available' | 'completed' | 'current';
  progressCount?: number;
}

export interface RoadmapLanguage {
  id: string;
  roadmapId: string;
  language: Language;
  createdAt: Date;
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

export interface RoadmapNodeProgress {
  id: string;
  userId: string;
  roadmapId: string;
  nodeId: string;
  language: Language;
  completionCount: number;
  isCompleted: boolean;
  lastPracticedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoadmapErrorState {
  hasError: boolean;
  message: string;
  suggestedLanguage?: string;
}

export interface RoadmapContextType {
  roadmaps: Roadmap[];
  userRoadmaps: UserRoadmap[]; 
  currentRoadmap: UserRoadmap | null;
  nodes: RoadmapNode[];
  currentNodeId?: string;
  completedNodes: string[];
  availableNodes: string[];
  nodeProgress: RoadmapNodeProgress[];
  isLoading: boolean;
  nodeLoading: boolean;
  selectedRoadmap?: UserRoadmap | null;
  currentNode?: RoadmapNode | null;
  roadmapNodes?: RoadmapNode[];
  progress?: RoadmapProgress[];
  loading?: boolean;
  
  // Add missing properties
  errorState: RoadmapErrorState;
  clearErrorState: () => void;
  languageAvailability: Record<string, boolean>;
  tryAlternateLanguage: (level: LanguageLevel, originalLanguage: Language) => Promise<boolean>;
  setRoadmapPageActive: (active: boolean) => void;
  
  // Methods
  initializeUserRoadmap: (level: LanguageLevel, language: Language) => Promise<void>;
  loadUserRoadmap: (userRoadmapId?: string) => Promise<void>;
  loadUserRoadmaps: (language?: Language) => Promise<UserRoadmap[]>;
  completeNode: (nodeId: string) => Promise<{ nextNodeId?: string }>;
  resetProgress: (roadmapId: string) => Promise<void>;
  getNodeExercise: (nodeId: string) => Promise<any>;
  markNodeAsCompleted: (nodeId: string) => Promise<void>;
  incrementNodeCompletion: (nodeId: string, accuracy: number) => Promise<void>;
  selectRoadmap: (roadmapId: string) => Promise<void>;
  refreshData: (language?: Language) => Promise<void>;
}
