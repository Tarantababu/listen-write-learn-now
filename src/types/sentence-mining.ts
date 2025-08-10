
export interface SentenceMiningExercise {
  id: string;
  sentence: string;
  targetWord: string; // Simplified to single target word for cloze
  clozeSentence: string;
  difficulty: DifficultyLevel;
  context: string;
  createdAt: Date;
  attempts: number;
  correctAttempts?: number;
  translation?: string;
  correctAnswer?: string;
  hints?: string[];
  targetWordTranslation?: string; // English meaning of the target word
  // Database fields
  session_id?: string;
  sessionId?: string;
  difficultyScore?: number;
  isSkipped?: boolean;
  isCorrect?: boolean | null;
  userAnswer?: string;
  exerciseType?: 'cloze';
  language?: string;
}

export interface SentenceMiningSession {
  id: string;
  language: string;
  difficulty: DifficultyLevel;
  exercises: SentenceMiningExercise[];
  currentExerciseIndex: number;
  startTime: Date;
  endTime?: Date;
  totalCorrect: number;
  totalAttempts: number;
  // Database fields that match the actual schema
  user_id: string;
  difficulty_level: DifficultyLevel;
  total_exercises: number;
  correct_exercises: number;
  new_words_encountered: number;
  words_mastered: number;
  started_at: string;
  completed_at?: string;
  created_at: string;
  session_data?: any;
}

export interface VocabularyStats {
  passiveVocabulary: number; // Words seen/recognized
  activeVocabulary: number;  // Words correctly used/mastered
  totalWordsEncountered: number;
  language: string;
}

// Define a specific type for difficulty progress with required keys
export interface DifficultyProgressStats {
  attempted: number;
  correct: number;
  accuracy: number;
}

export interface DifficultyProgress {
  beginner: DifficultyProgressStats;
  intermediate: DifficultyProgressStats;
  advanced: DifficultyProgressStats;
}

// Simplified progress interface that matches what's actually used
export interface SentenceMiningProgress {
  language: string;
  totalSessions: number;
  totalExercises: number;
  totalCorrect: number;
  averageAccuracy: number;
  streak: number;
  lastSessionDate?: Date;
  vocabularyStats: VocabularyStats;
  // Additional fields that are actually used in the code
  correct: number;
  total: number;
  incorrect?: number;
  // Optional fields
  wordsLearned?: number;
  difficultyProgress?: DifficultyProgress;
  exerciseTypeProgress?: Record<string, { attempted: number; correct: number; accuracy: number }>;
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserResponse {
  text: string;
  isCorrect: boolean;
  timestamp: Date;
  hints?: string[];
  isSkipped?: boolean;
}

export interface SentenceMiningState {
  currentSession: SentenceMiningSession | null;
  currentExercise: SentenceMiningExercise | null;
  userResponse: string;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  error: string | null;
  progress: SentenceMiningProgress | null;
  showHint: boolean;
  showTranslation: boolean;
  isGeneratingNext: boolean;
}

// Keep ExerciseType for backward compatibility but only support cloze
export type ExerciseType = 'cloze';
