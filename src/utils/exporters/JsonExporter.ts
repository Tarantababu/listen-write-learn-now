
import { VocabularyItem } from '@/types';
import { ExportFormat, ExportOptions, ExportResult } from '@/types/export';
import { BaseVocabularyExporter } from './BaseVocabularyExporter';
import { EXPORT_FORMATS } from '@/types/export';

interface FlankiCard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  audio?: string;
  created: number;
  language: string;
}

interface FlankiDeck {
  name: string;
  description: string;
  created: number;
  cards: FlankiCard[];
  settings: {
    reviewIntervals: number[];
    maxReviewsPerDay: number;
    showAnswer: boolean;
  };
}

export class JsonExporter extends BaseVocabularyExporter {
  format: ExportFormat = EXPORT_FORMATS.find(f => f.id === 'json')!;

  async export(vocabulary: VocabularyItem[], options: ExportOptions): Promise<ExportResult> {
    try {
      const flankiDeck: FlankiDeck = {
        name: options.deckName,
        description: `Vocabulary deck exported with ${vocabulary.length} cards`,
        created: Date.now(),
        cards: vocabulary.map((item, index) => ({
          id: `card_${index + 1}`,
          front: this.sanitizeText(item.word),
          back: `<div class="definition">${this.sanitizeText(item.definition)}</div><div class="example"><em>${this.sanitizeText(item.exampleSentence)}</em></div>`,
          tags: [item.language, ...this.extractTags(item.word)],
          audio: item.audioUrl,
          created: Date.now() - (vocabulary.length - index) * 1000,
          language: item.language
        })),
        settings: {
          reviewIntervals: [1, 3, 7, 14, 30],
          maxReviewsPerDay: 50,
          showAnswer: true
        }
      };
      
      const jsonString = JSON.stringify(flankiDeck, null, 2);
      const blob = new Blob([jsonString], { type: this.format.mimeType });
      const filename = this.generateFilename(options.deckName, this.format.fileExtension);
      
      return this.createSuccessResult(blob, filename);
    } catch (error) {
      console.error('JSON export error:', error);
      return this.createErrorResult('Failed to create JSON file');
    }
  }
  
  private extractTags(word: string): string[] {
    // Extract meaningful tags from the word
    const tags = word.toLowerCase().split(/[\s-_]+/).filter(tag => tag.length > 2);
    return tags.slice(0, 3); // Limit to 3 tags
  }
}
