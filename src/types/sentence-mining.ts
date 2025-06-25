
export interface SentenceMiningExercise {
  id: string;
  sentence: string;
  targetWord: string;
  clozeSentence: string;
  difficulty: DifficultyLevel;
  context: string;
  createdAt: Date;
  attempts: number;
  correctAttempts: number;
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
}

export interface SentenceMiningProgress {
  language: string;
  totalSessions: number;
  totalExercises: number;
  totalCorrect: number;
  averageAccuracy: number;
  streak: number;
  lastSessionDate?: Date;
  difficultyProgress: Record<DifficultyLevel, {
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserResponse {
  text: string;
  isCorrect: boolean;
  timestamp: Date;
  hints?: string[];
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
}
