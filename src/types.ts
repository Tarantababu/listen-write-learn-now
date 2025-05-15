
// Language types
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

export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// User types
export interface UserProfile {
  id: string;
  email?: string;
  avatarUrl?: string;
  selectedLanguage: Language;
  learningLanguages: Language[];
  readingAnalysesCount?: number;
}

// Exercise types
export interface Exercise {
  id: string;
  title: string;
  text: string;
  language: Language;
  tags?: string[];
  audioUrl?: string;
  userId: string;
  directoryId?: string;
  isCompleted?: boolean;
  completionCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Auth types
export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Directory types
export interface Directory {
  id: string;
  name: string;
  userId: string;
  parentId?: string;
  createdAt: Date;
}

// Vocabulary types
export interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  language: Language;
  example_sentence: string;
  explanation?: string;
  audio_url?: string;
  exercise_id?: string;
  user_id: string;
  created_at: Date;
}

// Reading Analysis types
export interface AnalysisItem {
  id: string;
  word: string;
  definition: string;
  grammar?: string;
  explanation?: string;
  examples?: string[];
}

export interface ReadingAnalysis {
  id: string;
  exerciseId: string;
  userId: string;
  content: {
    words: AnalysisItem[];
    grammar: AnalysisItem[];
    summary?: string;
  };
  createdAt: Date;
}

// Subscription types
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';

export type SubscriptionStatus = 
  | 'active' 
  | 'trialing' 
  | 'past_due' 
  | 'canceled' 
  | 'incomplete' 
  | 'incomplete_expired'
  | 'unpaid'
  | 'trial_expired' 
  | 'inactive';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  subscriptionEnd?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}
