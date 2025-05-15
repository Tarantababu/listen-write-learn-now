
export interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  explanation: string;
  language: string;
  user_id: string;
  exercise_id: string;
  created_at: string;
  example_sentence: string; // Database uses snake_case
  audio_url: string; // Database uses snake_case
  
  // For client-side use (camelCase aliases)
  exampleSentence?: string;
  audioUrl?: string;
}

export interface VocabularyStats {
  totalItems: number;
  itemsByLanguage: Record<string, number>;
  recentItems: VocabularyItem[];
}
