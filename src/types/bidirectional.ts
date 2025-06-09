
export interface BidirectionalExercise {
  id: string;
  user_id: string;
  original_sentence: string;
  target_language: string;
  support_language: string;
  normal_translation?: string;
  literal_translation?: string;
  user_forward_translation?: string;
  user_back_translation?: string;
  status: 'learning' | 'reviewing' | 'mastered';
  original_audio_url?: string;
  normal_translation_audio_url?: string;
  literal_translation_audio_url?: string;
  reflection_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BidirectionalReview {
  id: string;
  user_id: string;
  exercise_id: string;
  review_type: 'forward' | 'backward';
  user_recall_attempt: string;
  is_correct: boolean;
  feedback?: string;
  due_date: string;
  completed_at?: string;
  created_at: string;
}

export interface BidirectionalMasteredWord {
  id: string;
  user_id: string;
  exercise_id: string;
  word: string;
  language: string;
  mastered_at: string;
}

export interface SpacedRepetitionConfig {
  correctMultiplier: number;
  incorrectMultiplier: number;
  maxInterval: number;
  graduationInterval: number;
}

export const DEFAULT_SRS_CONFIG: SpacedRepetitionConfig = {
  correctMultiplier: 2.5,
  incorrectMultiplier: 0.8,
  maxInterval: 365,
  graduationInterval: 4
};
