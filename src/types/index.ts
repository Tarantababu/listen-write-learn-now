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
  default_exercise_id?: string;  // Add this line to include the default exercise ID
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

// Add the new Roadmap types
export type LanguageLevel = 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4' | 'Level 5' | 'Level 6' | 'Level 7';

export interface Roadmap {
  id: string;
  name: string;
  level: LanguageLevel;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  languages?: Language[]; // Added languages array
}

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  defaultExerciseId?: string;
  title: string;
  description?: string;
  position: number;
  isBonus: boolean;
  language?: Language; // Added language field
  createdAt: Date;
  updatedAt: Date;
}

export interface RoadmapLanguage {
  id: string;
  roadmapId: string;
  language: Language;
  createdAt: Date;
}

export interface UserRoadmap {
  id: string;
  userId: string;
  roadmapId: string;
  language: Language;
  currentNodeId?: string;
  createdAt: Date;
  updatedAt: Date;
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

// Add new RoadmapNodeProgress type
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

// Add BlogPost type for the blog functionality
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  status: 'draft' | 'published';
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
}

// Add Json type for compatibility with Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface ExerciseContextType {
  exercises: Exercise[];
  defaultExercises: any[]; // Changed from DefaultExercise[] to any[]
  exercisesLoading: boolean;
  defaultExercisesLoading: boolean;
  addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt' | 'completionCount' | 'isCompleted'>) => Promise<Exercise>;
  updateExercise: (id: string, updates: Partial<Exercise>) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  recordCompletion: (exerciseId: string, accuracy: number, isCompleted: boolean) => Promise<void>;
  copyDefaultExercise: (id: string) => Promise<void>;
  refreshExercises: () => Promise<void>;
}

// Add the new Preaching types at the end
export interface Noun {
  id: string;
  word: string;
  article: 'der' | 'die' | 'das';
  meaning: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface PatternDrill {
  id: string;
  pattern: string;
  blanks: string[];
  difficulty: 'simple' | 'normal' | 'complex';
  expectedAnswers: string[];
}

export interface PreachingSession {
  id: string;
  userId: string;
  nouns: Noun[];
  currentStep: 'memorizing' | 'testing' | 'drilling' | 'feedback';
  difficulty: 'simple' | 'normal' | 'complex';
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  createdAt: Date;
}

export interface GenderTest {
  noun: Noun;
  userAnswer?: 'der' | 'die' | 'das';
  isCorrect?: boolean;
  explanation?: string;
}

export interface DrillAttempt {
  pattern: string;
  expectedAnswer: string;
  userSpeech: string;
  isCorrect: boolean;
  feedback?: string;
  corrections?: string[];
}

export type PreachingDifficulty = 'simple' | 'normal' | 'complex';
export type PreachingStep = 'memorizing' | 'testing' | 'drilling' | 'feedback';
