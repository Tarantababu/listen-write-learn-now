
import { supabase } from '@/integrations/supabase/client';

interface WordTranslation {
  original: string;
  translation: string;
}

interface SimpleTranslationResult {
  normalTranslation: string;
  literalTranslation: string;
  wordTranslations: WordTranslation[];
}

export class SimpleTranslationService {
  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<SimpleTranslationResult> {
    console.log('Translating text:', { textLength: text.length, sourceLanguage, targetLanguage });
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-reading-analysis', {
        body: {
          text,
          language: sourceLanguage,
          type: 'bidirectional_translation',
          supportLanguage: targetLanguage
        }
      });

      if (error) {
        throw new Error(error.message || 'Translation failed');
      }

      if (!data) {
        throw new Error('No translation data received');
      }

      // Validate the response structure
      if (!data.normalTranslation || !data.literalTranslation || !Array.isArray(data.wordTranslations)) {
        throw new Error('Invalid translation response format');
      }

      return {
        normalTranslation: data.normalTranslation,
        literalTranslation: data.literalTranslation,
        wordTranslations: data.wordTranslations
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }
}

export const simpleTranslationService = new SimpleTranslationService();
