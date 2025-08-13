
// Updated AutomaticWordSelection to use the improved services
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';
import { ImprovedAutomaticWordSelection, ImprovedAutoWordSelectionConfig, ImprovedWordSelectionResult } from './improvedAutomaticWordSelection';

export interface AutoWordSelectionConfig {
  language: string;
  difficulty: DifficultyLevel;
  userId: string;
  sessionId: string;
  previousWords: string[];
  wordCount: number;
}

export interface WordSelectionResult {
  selectedWord: string;
  selectionReason: string;
  wordType: 'new' | 'review' | 'common' | 'frequency_based';
  alternativeWords: string[];
}

export class AutomaticWordSelection {
  static async selectAutomaticWord(config: AutoWordSelectionConfig): Promise<WordSelectionResult> {
    console.log(`[AutoWordSelection] Delegating to improved word selection service`);
    
    // Convert to improved config format
    const improvedConfig: ImprovedAutoWordSelectionConfig = {
      ...config,
      avoidRecentWords: true
    };
    
    try {
      // Use the new improved selection system
      const improvedResult = await ImprovedAutomaticWordSelection.selectAutomaticWord(improvedConfig);
      
      // Convert back to legacy format for compatibility
      const legacyResult: WordSelectionResult = {
        selectedWord: improvedResult.selectedWord,
        selectionReason: improvedResult.selectionReason,
        wordType: improvedResult.wordType === 'frequency_based' ? 'frequency_based' : 
                  improvedResult.wordType === 'review' ? 'review' : 'common',
        alternativeWords: improvedResult.alternativeWords
      };
      
      console.log(`[AutoWordSelection] Selected: ${legacyResult.selectedWord} (${legacyResult.selectionReason})`);
      return legacyResult;
      
    } catch (error) {
      console.error('[AutoWordSelection] Error in improved selection, using fallback:', error);
      
      // Simple fallback for compatibility
      return {
        selectedWord: 'the',
        selectionReason: 'Emergency fallback due to error',
        wordType: 'common',
        alternativeWords: ['a', 'an', 'this']
      };
    }
  }

  static async trackWordUsage(
    userId: string,
    word: string,
    language: string,
    sessionId: string
  ): Promise<void> {
    // Delegate to improved tracking system
    return ImprovedAutomaticWordSelection.trackWordUsage(userId, word, language, sessionId);
  }
}
