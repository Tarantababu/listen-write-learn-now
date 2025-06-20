
import { VocabularyItem } from '@/types';
import { ExportOptions, ExportResult, VocabularyExporter } from '@/types/export';
import { ApkgExporter } from './ApkgExporter';
import { JsonExporter } from './JsonExporter';
import { CsvExporter } from './CsvExporter';

export class ExportManager {
  private exporters: Map<string, VocabularyExporter> = new Map();
  
  constructor() {
    this.registerExporter(new ApkgExporter());
    this.registerExporter(new JsonExporter());
    this.registerExporter(new CsvExporter());
  }
  
  private registerExporter(exporter: VocabularyExporter): void {
    this.exporters.set(exporter.format.id, exporter);
  }
  
  async exportVocabulary(
    vocabulary: VocabularyItem[], 
    options: ExportOptions
  ): Promise<ExportResult> {
    const exporter = this.exporters.get(options.format);
    
    if (!exporter) {
      return {
        blob: new Blob(),
        filename: '',
        success: false,
        error: `Unsupported export format: ${options.format}`
      };
    }
    
    return await exporter.export(vocabulary, options);
  }
  
  getAvailableFormats() {
    return Array.from(this.exporters.values()).map(exporter => exporter.format);
  }
  
  downloadExportResult(result: ExportResult): void {
    if (!result.success || !result.blob) {
      throw new Error(result.error || 'Export failed');
    }
    
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
export const exportManager = new ExportManager();
