
import { VocabularyItem } from '@/types';
import { exportManager } from './exporters/ExportManager';

// Maintain backward compatibility with existing code
export const downloadAnkiImport = async (vocabularyItems: VocabularyItem[], deckName: string = 'vocabulary'): Promise<void> => {
  try {
    const result = await exportManager.exportVocabulary(vocabularyItems, {
      format: 'apkg',
      includeAudio: true,
      deckName: deckName
    });
    
    if (result.success) {
      exportManager.downloadExportResult(result);
    } else {
      throw new Error(result.error || 'Export failed');
    }
  } catch (error) {
    console.error('Error generating Anki import package:', error);
    throw error;
  }
};

// Legacy functions for backward compatibility
export const generateAnkiImportFile = async (vocabularyItems: VocabularyItem[]) => {
  // This function is kept for backward compatibility but now uses the new system
  const result = await exportManager.exportVocabulary(vocabularyItems, {
    format: 'apkg',
    includeAudio: true,
    deckName: 'vocabulary'
  });
  
  if (!result.success) {
    throw new Error(result.error || 'Export failed');
  }
  
  return {
    content: 'Generated using new export system',
    mediaFiles: []
  };
};

export const createAnkiPackage = async (vocabularyItems: VocabularyItem[]): Promise<Blob> => {
  const result = await exportManager.exportVocabulary(vocabularyItems, {
    format: 'apkg',
    includeAudio: true,
    deckName: 'vocabulary'
  });
  
  if (!result.success) {
    throw new Error(result.error || 'Export failed');
  }
  
  return result.blob;
};
