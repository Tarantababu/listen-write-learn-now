
import { VocabularyItem } from '@/types';
import { ExportFormat, ExportOptions, ExportResult, VocabularyExporter } from '@/types/export';

export abstract class BaseVocabularyExporter implements VocabularyExporter {
  abstract format: ExportFormat;
  
  abstract export(vocabulary: VocabularyItem[], options: ExportOptions): Promise<ExportResult>;
  
  protected sanitizeText(text: string): string {
    return text.replace(/[\r\n\t]/g, ' ').trim();
  }
  
  protected generateFilename(deckName: string, extension: string): string {
    const sanitizedName = deckName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${sanitizedName}_${timestamp}${extension}`;
  }
  
  protected createSuccessResult(blob: Blob, filename: string): ExportResult {
    return {
      blob,
      filename,
      success: true
    };
  }
  
  protected createErrorResult(error: string): ExportResult {
    return {
      blob: new Blob(),
      filename: '',
      success: false,
      error
    };
  }
}
