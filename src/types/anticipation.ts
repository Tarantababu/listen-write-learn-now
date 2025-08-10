
export interface AnticipationLesson {
  id: string;
  user_id: string;
  title: string;
  language: string;
  difficulty_level: string;
  conversation_theme: string;
  content: LessonContent;
  audio_urls: Record<string, string>;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

export interface AnticipationProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  current_section: number;
  sections_completed: number;
  total_sections: number;
  anticipation_accuracy: number;
  completion_percentage: number;
  completed_at?: string;
  last_practiced_at: string;
  created_at: string;
  updated_at: string;
}

export interface LessonContent {
  sections: LessonSection[];
}

export interface LessonSection {
  type: 'introduction' | 'cultural_insight' | 'vocabulary' | 'dialogue' | 'expansion' | 'transformation' | 'production' | 'recap';
  title: string;
  content: any[];
}

export interface VocabularyItem {
  english: string;
  target: string;
  exampleEN: string;
  exampleTL: string;
  anticipationPrompt: string;
}

export interface DialogueItem {
  targetText: string;
  englishMeaning: string;
  anticipationPrompt: string;
}

export interface TransformationItem {
  prompt: string;
  english: string;
  targetAnswer: string;
  anticipationPrompt: string;
}

export interface ProductionItem {
  prompt: string;
  fragments: string[];
  targetSentence: string;
  anticipationPrompt: string;
}

export interface TextContent {
  speaker: 'EN' | 'TL';
  text: string;
  audioType: 'normal' | 'repeat_after' | 'pause_for_anticipation';
}

export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface CreateLessonRequest {
  targetLanguage: string;
  conversationTheme: string;
  difficultyLevel: DifficultyLevel;
}
