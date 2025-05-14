
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

export interface Exercise {
  id: string;
  title: string;
  text: string;
  language: Language;
  tags: string[];
  audioUrl?: string;
  directoryId: string | null;
  createdAt: Date;
  completionCount: number;
  isCompleted: boolean;
  archived?: boolean;
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
