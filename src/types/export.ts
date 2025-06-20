
import { VocabularyItem } from '@/types';

export interface ExportFormat {
  id: string;
  name: string;
  description: string;
  fileExtension: string;
  mimeType: string;
  supportedTools: string[];
}

export interface ExportOptions {
  format: string;
  includeAudio: boolean;
  deckName: string;
  tags?: string[];
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  success: boolean;
  error?: string;
}

export interface VocabularyExporter {
  format: ExportFormat;
  export(vocabulary: VocabularyItem[], options: ExportOptions): Promise<ExportResult>;
}

export const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'apkg',
    name: 'Anki Package (.apkg)',
    description: 'Compatible with Anki, AnkiDroid, AnkiMobile, AnkiWeb, Memcode, Flashcards Deluxe',
    fileExtension: '.apkg',
    mimeType: 'application/zip',
    supportedTools: ['Anki', 'AnkiDroid', 'AnkiMobile', 'AnkiWeb', 'Memcode', 'Flashcards Deluxe']
  },
  {
    id: 'json',
    name: 'JSON Format (.json)',
    description: 'Compatible with Flanki, Mnemonic',
    fileExtension: '.json',
    mimeType: 'application/json',
    supportedTools: ['Flanki', 'Mnemonic']
  },
  {
    id: 'csv',
    name: 'CSV Format (.csv)',
    description: 'Compatible with Quizlet, RemNote, Brainscape',
    fileExtension: '.csv',
    mimeType: 'text/csv',
    supportedTools: ['Quizlet', 'RemNote', 'Brainscape']
  }
];
