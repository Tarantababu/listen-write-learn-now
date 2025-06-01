
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
