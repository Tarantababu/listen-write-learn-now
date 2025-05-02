
export type Language = 'english' | 'german';

export interface Exercise {
  id: string;
  title: string;
  text: string;
  language: Language;
  tags: string[];
  audioUrl?: string;
  createdAt: Date;
  completionCount: number;
  isCompleted: boolean;
  directoryId?: string;
}

export interface Directory {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: Date;
}

export interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  exampleSentence: string;
  audioUrl?: string;
  exerciseId: string;
  language: Language;
}

export interface UserSettings {
  learningLanguages: Language[];
  selectedLanguage: Language;
}
