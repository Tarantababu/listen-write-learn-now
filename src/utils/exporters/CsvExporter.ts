
import { VocabularyItem } from '@/types';
import { ExportFormat, ExportOptions, ExportResult } from '@/types/export';
import { BaseVocabularyExporter } from './BaseVocabularyExporter';
import { EXPORT_FORMATS } from '@/types/export';

export class CsvExporter extends BaseVocabularyExporter {
  format: ExportFormat = EXPORT_FORMATS.find(f => f.id === 'csv')!;

  async export(vocabulary: VocabularyItem[], options: ExportOptions): Promise<ExportResult> {
    try {
      const csvContent = this.createCsvContent(vocabulary, options);
      const blob = new Blob([csvContent], { type: this.format.mimeType });
      const filename = this.generateFilename(options.deckName, this.format.fileExtension);
      
      return this.createSuccessResult(blob, filename);
    } catch (error) {
      console.error('CSV export error:', error);
      return this.createErrorResult('Failed to create CSV file');
    }
  }
  
  private createCsvContent(vocabulary: VocabularyItem[], options: ExportOptions): string {
    const headers = ['Front', 'Back', 'Example', 'Language', 'Tags', 'Audio URL'];
    const rows: string[][] = [headers];
    
    vocabulary.forEach(item => {
      const row = [
        this.escapeCsvField(item.word),
        this.escapeCsvField(item.definition),
        this.escapeCsvField(item.exampleSentence),
        this.escapeCsvField(item.language),
        this.escapeCsvField([item.language, ...item.word.split(/\s+/)].join(';')),
        this.escapeCsvField(item.audioUrl || '')
      ];
      rows.push(row);
    });
    
    return rows.map(row => row.join(',')).join('\n');
  }
  
  private escapeCsvField(field: string): string {
    // Escape quotes and wrap in quotes if necessary
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
