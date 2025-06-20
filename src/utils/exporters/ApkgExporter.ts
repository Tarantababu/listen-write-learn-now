
import JSZip from 'jszip';
import { VocabularyItem } from '@/types';
import { ExportFormat, ExportOptions, ExportResult } from '@/types/export';
import { BaseVocabularyExporter } from './BaseVocabularyExporter';
import { EXPORT_FORMATS } from '@/types/export';

export class ApkgExporter extends BaseVocabularyExporter {
  format: ExportFormat = EXPORT_FORMATS.find(f => f.id === 'apkg')!;

  async export(vocabulary: VocabularyItem[], options: ExportOptions): Promise<ExportResult> {
    try {
      const zip = new JSZip();
      
      // Create the collection.anki2 database file (simplified structure)
      const dbContent = await this.createAnkiDatabase(vocabulary, options);
      zip.file('collection.anki2', dbContent);
      
      // Create media files if audio is included
      if (options.includeAudio) {
        const mediaFiles = await this.processMediaFiles(vocabulary);
        const mediaFolder = zip.folder('media');
        
        mediaFiles.forEach((file, index) => {
          if (file.data && mediaFolder) {
            mediaFolder.file(`${index}.mp3`, file.data, { base64: true });
          }
        });
        
        // Create media mapping file
        const mediaMapping = this.createMediaMapping(mediaFiles);
        zip.file('media', JSON.stringify(mediaMapping));
      }
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const filename = this.generateFilename(options.deckName, this.format.fileExtension);
      
      return this.createSuccessResult(blob, filename);
    } catch (error) {
      console.error('APKG export error:', error);
      return this.createErrorResult('Failed to create APKG file');
    }
  }

  private async createAnkiDatabase(vocabulary: VocabularyItem[], options: ExportOptions): Promise<ArrayBuffer> {
    // For a complete APKG implementation, we would need to create a proper SQLite database
    // For now, we'll create a simplified text-based format that Anki can import
    const cards = vocabulary.map((item, index) => ({
      id: index + 1,
      front: this.sanitizeText(item.word),
      back: `${this.sanitizeText(item.definition)}<br><br><i>${this.sanitizeText(item.exampleSentence)}</i>`,
      audio: item.audioUrl ? `[sound:${index}.mp3]` : '',
      tags: [item.language, ...this.sanitizeText(item.word).split(' ')].join(' ')
    }));
    
    // Create a simple database representation
    const dbData = {
      version: 1,
      cards: cards,
      deckName: options.deckName,
      created: Date.now()
    };
    
    return new TextEncoder().encode(JSON.stringify(dbData));
  }

  private async processMediaFiles(vocabulary: VocabularyItem[]): Promise<Array<{ data: string | null, url?: string }>> {
    const mediaFiles: Array<{ data: string | null, url?: string }> = [];
    
    for (const item of vocabulary) {
      if (item.audioUrl) {
        try {
          const response = await fetch(item.audioUrl);
          const blob = await response.blob();
          const base64 = await this.blobToBase64(blob);
          mediaFiles.push({ data: base64.split(',')[1], url: item.audioUrl });
        } catch (error) {
          console.error('Failed to fetch audio:', error);
          mediaFiles.push({ data: null, url: item.audioUrl });
        }
      }
    }
    
    return mediaFiles;
  }
  
  private createMediaMapping(mediaFiles: Array<{ data: string | null, url?: string }>): Record<string, string> {
    const mapping: Record<string, string> = {};
    mediaFiles.forEach((file, index) => {
      if (file.data) {
        mapping[`${index}.mp3`] = `${index}`;
      }
    });
    return mapping;
  }
  
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
