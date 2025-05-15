
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

// Language level types
export type LanguageLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Curriculum Path types (formerly Roadmap)
export interface CurriculumPath {
  id: string;
  name: string;
  level: LanguageLevel;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  languages?: Language[];
}

// For backward compatibility
export interface Roadmap extends CurriculumPath {}

export interface CurriculumNode {
  id: string;
  curriculumPathId: string;
  defaultExerciseId?: string;
  title: string;
  description?: string;
  position: number;
  isBonus: boolean;
  language?: Language;
  createdAt: Date;
  updatedAt: Date;
}

// For backward compatibility
export interface RoadmapNode extends CurriculumNode {
  roadmapId: string;
}

export interface CurriculumPathLanguage {
  id: string;
  curriculumPathId: string;
  language: Language;
  createdAt: Date;
}

// For backward compatibility
export interface RoadmapLanguage extends CurriculumPathLanguage {
  roadmapId: string;
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

// For backward compatibility
export interface UserRoadmap extends UserCurriculumPath {
  roadmapId: string;
}

export interface CurriculumPathItem extends CurriculumPath {
  language?: Language;
  currentNodeId?: string;
  curriculumPathId?: string;
  progress?: number;
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

// For backward compatibility
export interface RoadmapProgress extends CurriculumProgress {
  roadmapId: string;
}

// Node progress tracking
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

// For backward compatibility
export interface RoadmapNodeProgress extends CurriculumNodeProgress {
  roadmapId: string;
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

// For backward compatibility
export interface RoadmapContextType extends CurriculumContextType {
  roadmaps: Roadmap[];
  userRoadmaps: UserRoadmap[];
  currentRoadmap: UserRoadmap | null;
  nodes: RoadmapNode[];
}
