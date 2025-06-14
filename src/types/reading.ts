
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
    sentences: ReadingSentence[];
    analysis?: {
      wordCount: number;
      readingTime: number;
      grammarPoints: string[];
      fallbackInfo?: {
        method: string;
        reason: string;
        isUsable: boolean;
        originalTargetLength?: number;
        actualLength?: number;
        recoveryMethod?: string;
        note?: string;
      };
      recoveryInfo?: {
        originalTargetLength: number;
        actualLength: number;
        recoveryMethod: string;
        note: string;
      };
    };
  };
  audio_url?: string;
  full_text_audio_url?: string;
  audio_generation_status?: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  archived: boolean;
}

export interface ReadingSentence {
  id: string;
  text: string;
  audio_url?: string;
  analysis?: {
    words: Array<{
      word: string;
      definition?: string;
      partOfSpeech?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
    }>;
    grammar?: string[];
    translation?: string;
  };
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
}
