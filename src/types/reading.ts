
export interface ReadingExercise {
  id: string;
  user_id: string;
  title: string;
  language: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  target_length: number;
  grammar_focus?: string;
  topic: string;
  content: {
    text: string;
    metadata?: {
      generation_method?: string;
      word_count?: number;
      target_length?: number;
      processing_type?: string;
      [key: string]: any;
    };
  };
  audio_url?: string;
  full_text_audio_url?: string;
  audio_generation_status?: 'pending' | 'generating' | 'completed' | 'failed';
  metadata?: {
    generation_method?: string;
    enhanced_audio_enabled?: boolean;
    created_at?: string;
    audio_generation_started?: string;
    audio_generation_completed?: string;
    audio_generation_failed?: string;
    error?: string;
    success_rate?: number;
    retry_started?: string;
    audio_on_demand?: boolean;
    processing_type?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  archived: boolean;
}

export interface ReadingExerciseProgress {
  id: string;
  user_id: string;
  reading_exercise_id: string;
  sentences_completed: number;
  total_sentences: number;
  completion_percentage: number;
  last_sentence_index: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReadingExerciseRequest {
  title: string;
  language: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  target_length: number;
  grammar_focus?: string;
  topic: string;
  customText?: string;
  isCustomText?: boolean;
}
