
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';

export interface WordProgressionData {
  word: string;
  complexityScore: number;
  masteryLevel: number;
  progressionStage: 'new' | 'learning' | 'consolidating' | 'mastered' | 'overlearned';
  exposureCount: number;
  correctAttempts: number;
  totalAttempts: number;
  acquisitionVelocity: number;
  retentionStrength: number;
  wordFamily?: string;
  semanticCategory?: string;
  prerequisiteWords?: string[];
}

export interface ProgressiveWordSelectionResult {
  targetWords: string[];
  nextComplexityLevel: number;
  progressionReason: string;
  introducedWords: string[];
  reinforcedWords: string[];
  sessionData: any;
}

export class ProgressiveVocabularyEngine {
  
  static async analyzeUserProgression(
    userId: string,
    language: string
  ): Promise<{
    currentLevel: number;
    masteredWords: number;
    learningWords: number;
    readyForProgression: boolean;
    recommendedComplexity: number;
  }> {
    try {
      const { data: progressionData } = await supabase
        .from('user_word_progression')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language);

      if (!progressionData || progressionData.length === 0) {
        return {
          currentLevel: 1,
          masteredWords: 0,
          learningWords: 0,
          readyForProgression: true,
          recommendedComplexity: 25
        };
      }

      const masteredWords = progressionData.filter(w => w.progression_stage === 'mastered').length;
      const learningWords = progressionData.filter(w => 
        w.progression_stage === 'learning' || w.progression_stage === 'consolidating'
      ).length;
      
      const averageMastery = progressionData.reduce((sum, w) => sum + w.mastery_level, 0) / progressionData.length;
      const averageComplexity = progressionData.reduce((sum, w) => sum + (w.contextual_strength?.complexity || 30), 0) / progressionData.length;
      
      // Determine if user is ready for progression
      const readyForProgression = masteredWords >= 5 && learningWords <= 8;
      
      // Calculate recommended complexity based on current performance
      let recommendedComplexity = Math.min(averageComplexity + (readyForProgression ? 10 : 0), 90);
      
      return {
        currentLevel: Math.floor(averageMastery),
        masteredWords,
        learningWords,
        readyForProgression,
        recommendedComplexity
      };
    } catch (error) {
      console.error('Error analyzing user progression:', error);
      return {
        currentLevel: 1,
        masteredWords: 0,
        learningWords: 0,
        readyForProgression: true,
        recommendedComplexity: 25
      };
    }
  }

  static async selectProgressiveWords(
    userId: string,
    language: string,
    difficulty: DifficultyLevel,
    wordCount: number = 1
  ): Promise<ProgressiveWordSelectionResult> {
    try {
      const analysis = await this.analyzeUserProgression(userId, language);
      
      // Get current user progression data
      const { data: userWords } = await supabase
        .from('user_word_progression')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language);

      // Get words due for review
      const wordsForReview = userWords?.filter(w => 
        w.next_review_due && new Date(w.next_review_due) <= new Date() &&
        w.progression_stage !== 'overlearned'
      ) || [];

      // Get struggling words (low retention)
      const strugglingWords = userWords?.filter(w => 
        w.total_attempts > 3 && 
        (w.correct_attempts / w.total_attempts) < 0.6 &&
        w.progression_stage === 'learning'
      ) || [];

      let selectedWords: string[] = [];
      let introducedWords: string[] = [];
      let reinforcedWords: string[] = [];
      
      // Prioritize struggling words
      if (strugglingWords.length > 0 && selectedWords.length < wordCount) {
        const strugglingToAdd = Math.min(strugglingWords.length, Math.ceil(wordCount * 0.3));
        const strugglingSelected = strugglingWords.slice(0, strugglingToAdd).map(w => w.word);
        selectedWords.push(...strugglingSelected);
        reinforcedWords.push(...strugglingSelected);
      }

      // Add review words
      if (wordsForReview.length > 0 && selectedWords.length < wordCount) {
        const reviewToAdd = Math.min(wordsForReview.length, Math.ceil(wordCount * 0.4));
        const reviewSelected = wordsForReview.slice(0, reviewToAdd).map(w => w.word);
        selectedWords.push(...reviewSelected);
        reinforcedWords.push(...reviewSelected);
      }

      // Fill remaining slots with new words based on progression
      const remainingSlots = wordCount - selectedWords.length;
      if (remainingSlots > 0 && analysis.readyForProgression) {
        const newWords = await this.generateNewWords(
          userId, 
          language, 
          analysis.recommendedComplexity, 
          remainingSlots,
          userWords?.map(w => w.word) || []
        );
        selectedWords.push(...newWords);
        introducedWords.push(...newWords);
      }

      // If still need words, get from existing learning pool
      if (selectedWords.length < wordCount) {
        const learningWords = userWords?.filter(w => 
          w.progression_stage === 'learning' && 
          !selectedWords.includes(w.word)
        ) || [];
        
        const additionalNeeded = wordCount - selectedWords.length;
        const additionalWords = learningWords.slice(0, additionalNeeded).map(w => w.word);
        selectedWords.push(...additionalWords);
        reinforcedWords.push(...additionalWords);
      }

      const progressionReason = this.generateProgressionReason(
        analysis,
        introducedWords.length,
        reinforcedWords.length,
        strugglingWords.length
      );

      return {
        targetWords: selectedWords.slice(0, wordCount),
        nextComplexityLevel: analysis.recommendedComplexity,
        progressionReason,
        introducedWords,
        reinforcedWords,
        sessionData: {
          userAnalysis: analysis,
          reviewWordsAvailable: wordsForReview.length,
          strugglingWordsCount: strugglingWords.length
        }
      };
    } catch (error) {
      console.error('Error in progressive word selection:', error);
      return {
        targetWords: [],
        nextComplexityLevel: 30,
        progressionReason: 'Error in word selection',
        introducedWords: [],
        reinforcedWords: [],
        sessionData: {}
      };
    }
  }

  private static async generateNewWords(
    userId: string,
    language: string,
    complexityLevel: number,
    count: number,
    excludeWords: string[]
  ): Promise<string[]> {
    try {
      // Get word mappings at appropriate complexity level
      const { data: availableWords } = await supabase
        .from('word_progression_mappings')
        .select('word, complexity_score, word_family, prerequisite_words')
        .eq('language', language)
        .gte('complexity_score', Math.max(complexityLevel - 15, 5))
        .lte('complexity_score', complexityLevel + 10)
        .not('word', 'in', `(${excludeWords.map(w => `"${w}"`).join(',')})`);

      if (!availableWords || availableWords.length === 0) {
        // Fallback to basic words for this language
        const fallbackWords = this.getFallbackWords(language, complexityLevel);
        return fallbackWords.filter(w => !excludeWords.includes(w)).slice(0, count);
      }

      // Filter by prerequisites if user has them
      const eligibleWords = await this.filterByPrerequisites(userId, language, availableWords);
      
      // Sort by complexity and select appropriate words
      const sortedWords = eligibleWords.sort((a, b) => a.complexity_score - b.complexity_score);
      
      return sortedWords.slice(0, count).map(w => w.word);
    } catch (error) {
      console.error('Error generating new words:', error);
      return this.getFallbackWords(language, complexityLevel).slice(0, count);
    }
  }

  private static async filterByPrerequisites(
    userId: string,
    language: string,
    words: any[]
  ): Promise<any[]> {
    try {
      const { data: masteredWords } = await supabase
        .from('user_word_progression')
        .select('word')
        .eq('user_id', userId)
        .eq('language', language)
        .in('progression_stage', ['mastered', 'overlearned']);

      const masteredWordSet = new Set(masteredWords?.map(w => w.word) || []);

      return words.filter(word => {
        if (!word.prerequisite_words || word.prerequisite_words.length === 0) {
          return true;
        }
        
        // Check if at least 70% of prerequisites are mastered
        const masteredPrereqs = word.prerequisite_words.filter(prereq => 
          masteredWordSet.has(prereq)
        );
        
        return masteredPrereqs.length >= Math.ceil(word.prerequisite_words.length * 0.7);
      });
    } catch (error) {
      console.error('Error filtering by prerequisites:', error);
      return words;
    }
  }

  private static getFallbackWords(language: string, complexityLevel: number): string[] {
    const fallbackWordsByLanguage: Record<string, Record<string, string[]>> = {
      german: {
        beginner: ['der', 'die', 'das', 'ich', 'du', 'er', 'sie', 'wir', 'haben', 'sein'],
        intermediate: ['aber', 'oder', 'wenn', 'dass', 'weil', 'durch', 'über', 'unter', 'zwischen'],
        advanced: ['trotzdem', 'außerdem', 'deshalb', 'obwohl', 'dadurch', 'infolgedessen']
      },
      spanish: {
        beginner: ['el', 'la', 'yo', 'tú', 'él', 'ella', 'ser', 'estar', 'tener', 'hacer'],
        intermediate: ['pero', 'aunque', 'porque', 'cuando', 'donde', 'mientras', 'durante'],
        advanced: ['sin embargo', 'no obstante', 'por tanto', 'en cambio', 'además']
      },
      french: {
        beginner: ['le', 'la', 'je', 'tu', 'il', 'elle', 'être', 'avoir', 'faire', 'aller'],
        intermediate: ['mais', 'car', 'donc', 'quand', 'pendant', 'parce que', 'bien que'],
        advanced: ['cependant', 'néanmoins', 'toutefois', 'en revanche', 'par conséquent']
      }
    };

    const languageWords = fallbackWordsByLanguage[language] || fallbackWordsByLanguage.german;
    
    if (complexityLevel < 40) return languageWords.beginner || [];
    if (complexityLevel < 70) return languageWords.intermediate || [];
    return languageWords.advanced || [];
  }

  private static generateProgressionReason(
    analysis: any,
    introducedCount: number,
    reinforcedCount: number,
    strugglingCount: number
  ): string {
    const reasons = [];
    
    if (strugglingCount > 0) {
      reasons.push(`${strugglingCount} struggling word${strugglingCount > 1 ? 's' : ''} for reinforcement`);
    }
    
    if (reinforcedCount > 0) {
      reasons.push(`${reinforcedCount} word${reinforcedCount > 1 ? 's' : ''} for review`);
    }
    
    if (introducedCount > 0) {
      reasons.push(`${introducedCount} new word${introducedCount > 1 ? 's' : ''} at ${Math.round(analysis.recommendedComplexity)}% complexity`);
    }
    
    if (analysis.readyForProgression) {
      reasons.push('ready for progression');
    }
    
    return reasons.join(', ') || 'adaptive vocabulary selection';
  }

  static async updateWordProgression(
    userId: string,
    word: string,
    language: string,
    isCorrect: boolean,
    responseTime?: number
  ): Promise<void> {
    try {
      const now = new Date();
      
      // Get or create word progression record
      const { data: existing } = await supabase
        .from('user_word_progression')
        .select('*')
        .eq('user_id', userId)
        .eq('word', word)
        .eq('language', language)
        .single();

      if (existing) {
        // Update existing record
        const newCorrectAttempts = existing.correct_attempts + (isCorrect ? 1 : 0);
        const newTotalAttempts = existing.total_attempts + 1;
        const accuracy = newTotalAttempts > 0 ? newCorrectAttempts / newTotalAttempts : 0;
        
        // Calculate new mastery level
        let newMasteryLevel = existing.mastery_level;
        if (isCorrect && accuracy > 0.8 && newTotalAttempts >= 3) {
          newMasteryLevel = Math.min(existing.mastery_level + 0.5, 10);
        } else if (!isCorrect) {
          newMasteryLevel = Math.max(existing.mastery_level - 0.3, 1);
        }

        // Update progression stage
        let progressionStage = existing.progression_stage;
        if (newMasteryLevel >= 8 && accuracy >= 0.9) {
          progressionStage = 'mastered';
        } else if (newMasteryLevel >= 6) {
          progressionStage = 'consolidating';
        } else if (newMasteryLevel >= 3) {
          progressionStage = 'learning';
        }

        // Calculate next review date
        const intervalDays = Math.min(Math.pow(2, Math.floor(newMasteryLevel)), 30);
        const nextReviewDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

        await supabase
          .from('user_word_progression')
          .update({
            mastery_level: newMasteryLevel,
            exposure_count: existing.exposure_count + 1,
            correct_attempts: newCorrectAttempts,
            total_attempts: newTotalAttempts,
            last_reviewed_at: now.toISOString(),
            next_review_due: nextReviewDue.toISOString(),
            progression_stage: progressionStage,
            retention_strength: accuracy,
            acquisition_velocity: newMasteryLevel / Math.max(newTotalAttempts / 10, 1)
          })
          .eq('id', existing.id);
      } else {
        // Create new record
        await supabase
          .from('user_word_progression')
          .insert({
            user_id: userId,
            word,
            language,
            mastery_level: isCorrect ? 2 : 1,
            exposure_count: 1,
            correct_attempts: isCorrect ? 1 : 0,
            total_attempts: 1,
            first_encountered_at: now.toISOString(),
            last_reviewed_at: now.toISOString(),
            next_review_due: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            progression_stage: 'new',
            retention_strength: isCorrect ? 1 : 0,
            acquisition_velocity: isCorrect ? 1 : 0.5
          });
      }
    } catch (error) {
      console.error('Error updating word progression:', error);
    }
  }
}
