
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
  exerciseType: ExerciseType;
  translation?: string;
  multipleChoiceOptions?: string[];
  correctAnswer: string;
  explanation?: string;
  clickableWords?: ClickableWord[];
}

export interface ClickableWord {
  word: string;
  definition: string;
  isKnown: boolean;
  position: number;
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
  exerciseTypes: ExerciseType[];
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
  exerciseTypeProgress: Record<ExerciseType, {
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseType = 'cloze' | 'translation' | 'multiple_choice' | 'vocabulary_marking';

export interface UserResponse {
  text: string;
  isCorrect: boolean;
  timestamp: Date;
  hints?: string[];
  selectedWords?: string[];
  exerciseType: ExerciseType;
}

export interface SentenceMiningState {
  currentSession: SentenceMiningSession | null;
  currentExercise: SentenceMiningExercise | null;
  userResponse: string;
  selectedWords: string[];
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  error: string | null;
  progress: SentenceMiningProgress | null;
  showHint: boolean;
  showTranslation: boolean;
}
