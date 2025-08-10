
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';
import { IntelligentWordSelection } from './intelligentWordSelection';
import { WordDiversityEngine } from './wordDiversityEngine';
import { SentencePatternDiversityEngine } from './sentencePatternDiversityEngine';
import { EnhancedCooldownSystem } from './enhancedCooldownSystem';

export interface EnhancedExerciseRequest {
  userId: string;
  language: string;
  difficulty: DifficultyLevel;
  sessionId: string;
  previousSentences: string[];
  enhancedMode: boolean;
}

export interface WordSelectionMetrics {
  totalCandidates: number;
  availableAfterCooldown: number;
  selectionMethod: string;
  diversityScore: number;
  cooldownFiltered: number;
}

export class EnhancedSentenceMiningService {
  static async generateEnhancedExercise(request: EnhancedExerciseRequest) {
    try {
      console.log(`[EnhancedSentenceMiningService] Generating exercise for ${request.language} (${request.difficulty})`);
      
      const startTime = Date.now();
      
      // Step 1: Get intelligent word selection with enhanced diversity
      const wordSelection = await IntelligentWordSelection.selectOptimalWords(
        request.userId,
        request.language,
        request.difficulty,
        request.sessionId,
        1, // Select 1 word
        {
          maxRecentUsage: 1, // Stricter: max 1 recent usage
          minCooldownHours: 12, // Longer cooldown: 12 hours
          preferredDifficulty: 50,
          diversityWeight: 0.6, // Higher diversity weight
          noveltyWeight: 0.4
        }
      );

      // Step 2: Get word diversity metrics and additional candidates
      const diversityMetrics = await WordDiversityEngine.analyzeSessionDiversity(
        request.userId,
        request.language,
        request.sessionId,
        48 // Longer lookback for better diversity analysis
      );

      // Step 3: Get pattern avoidance recommendations
      const avoidPatterns = await SentencePatternDiversityEngine.getAvoidancePatterns(
        request.userId,
        request.language,
        request.difficulty,
        request.sessionId,
        24 // 24-hour lookback for pattern diversity
      );

      // Step 4: Get additional novelty words for variety
      const noveltyWords = await this.getNoveltyWords(
        request.userId,
        request.language,
        request.difficulty,
        wordSelection.selectedWords,
        5
      );

      // Step 5: Apply enhanced cooldown filtering
      const { available: availableWords, cooldownInfo } = await EnhancedCooldownSystem.getAvailableWords(
        request.userId,
        request.language,
        [...wordSelection.selectedWords, ...noveltyWords],
        request.sessionId
      );

      // Step 6: Ensure we have diverse word selection
      let finalSelectedWords = wordSelection.selectedWords;
      let selectionMethod = 'intelligent_selection';
      
      if (availableWords.length === 0) {
        console.log(`[EnhancedSentenceMiningService] All words on cooldown, using emergency selection`);
        
        // Emergency: find any unused words from the last 24 hours
        const emergencyWords = await this.getEmergencyWordSelection(
          request.userId,
          request.language,
          request.difficulty,
          24
        );
        
        finalSelectedWords = emergencyWords.slice(0, 1);
        selectionMethod = 'emergency_unused_words';
      } else if (availableWords.length < wordSelection.selectedWords.length) {
        // Partial availability: use what's available
        finalSelectedWords = availableWords.slice(0, wordSelection.selectedWords.length);
        selectionMethod = 'cooldown_filtered_selection';
      } else {
        // Use originally selected words that passed cooldown check
        finalSelectedWords = wordSelection.selectedWords.filter(word => 
          availableWords.includes(word)
        ).slice(0, 1);
        
        if (finalSelectedWords.length === 0) {
          finalSelectedWords = availableWords.slice(0, 1);
          selectionMethod = 'available_word_fallback';
        }
      }

      // Step 7: Generate exercise with enhanced parameters
      const exerciseResponse = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          difficulty_level: request.difficulty,
          language: request.language,
          session_id: request.sessionId,
          user_id: request.userId,
          preferred_words: finalSelectedWords,
          novelty_words: noveltyWords.filter(w => availableWords.includes(w)).slice(0, 3),
          avoid_patterns: avoidPatterns,
          diversity_score_target: Math.max(80, diversityMetrics.overallScore), // Higher target
          selection_quality: Math.round(wordSelection.diversityScore),
          enhanced_mode: request.enhancedMode,
          previous_sentences: request.previousSentences.slice(-5), // Last 5 sentences
          known_words: [], // Will be filled by edge function if needed
          n_plus_one: false
        }
      });

      if (exerciseResponse.error) {
        throw new Error(`Exercise generation failed: ${exerciseResponse.error.message}`);
      }

      const exercise = exerciseResponse.data;

      // Step 8: Track word usage for future diversity
      if (exercise.targetWord) {
        await EnhancedCooldownSystem.trackWordUsage(
          request.userId,
          exercise.targetWord,
          request.language,
          request.sessionId,
          exercise.sentence || '',
          this.extractSentencePattern(exercise.sentence || ''),
          request.difficulty
        );
      }

      // Step 9: Return enhanced exercise with metrics
      const generationTime = Date.now() - startTime;
      
      console.log(`[EnhancedSentenceMiningService] Exercise generated in ${generationTime}ms`);
      console.log(`[EnhancedSentenceMiningService] Word: "${exercise.targetWord}", Method: ${selectionMethod}`);

      return {
        ...exercise,
        enhancedMetrics: {
          wordSelectionMetrics: {
            totalCandidates: wordSelection.selectedWords.length + noveltyWords.length,
            availableAfterCooldown: availableWords.length,
            selectionMethod,
            diversityScore: wordSelection.diversityScore,
            cooldownFiltered: (wordSelection.selectedWords.length + noveltyWords.length) - availableWords.length
          } as WordSelectionMetrics,
          diversityMetrics,
          avoidedPatterns: avoidPatterns.length,
          generationTime,
          cooldownInfo: Array.from(cooldownInfo.entries()).map(([word, info]) => ({
            word,
            cooldownUntil: info.cooldownUntil,
            reason: info.reason
          }))
        }
      };

    } catch (error) {
      console.error('[EnhancedSentenceMiningService] Error generating exercise:', error);
      throw error;
    }
  }

  private static async getNoveltyWords(
    userId: string,
    language: string,
    difficulty: DifficultyLevel,
    excludeWords: string[],
    limit: number = 5
  ): Promise<string[]> {
    try {
      // Get words that haven't been used recently
      const { data: unusedWords } = await supabase
        .from('known_words')
        .select('word')
        .eq('user_id', userId)
        .eq('language', language)
        .not('word', 'in', `(${excludeWords.map(w => `"${w}"`).join(',')})`)
        .order('last_reviewed_at', { ascending: true, nullsFirst: true })
        .limit(limit * 2); // Get more to filter from

      if (!unusedWords) return [];

      // Filter for appropriate difficulty and novelty
      const noveltyWords = unusedWords
        .map(w => w.word)
        .filter(word => word.length >= 3) // Meaningful words only
        .slice(0, limit);

      console.log(`[EnhancedSentenceMiningService] Found ${noveltyWords.length} novelty words`);
      return noveltyWords;

    } catch (error) {
      console.error('[EnhancedSentenceMiningService] Error getting novelty words:', error);
      return [];
    }
  }

  private static async getEmergencyWordSelection(
    userId: string,
    language: string,
    difficulty: DifficultyLevel,
    lookbackHours: number
  ): Promise<string[]> {
    try {
      const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

      // Get recently used words to exclude
      const { data: recentExercises } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words')
        .gte('created_at', cutoffTime.toISOString());

      const recentWords = new Set<string>();
      recentExercises?.forEach(exercise => {
        exercise.target_words?.forEach((word: string) => {
          recentWords.add(word.toLowerCase());
        });
      });

      // Get words not used recently
      const { data: allWords } = await supabase
        .from('known_words')
        .select('word')
        .eq('user_id', userId)
        .eq('language', language)
        .limit(50);

      if (!allWords) return ['der']; // Ultimate fallback

      const emergencyWords = allWords
        .map(w => w.word)
        .filter(word => !recentWords.has(word.toLowerCase()))
        .slice(0, 5);

      console.log(`[EnhancedSentenceMiningService] Emergency selection: ${emergencyWords.length} unused words found`);
      
      return emergencyWords.length > 0 ? emergencyWords : ['der'];

    } catch (error) {
      console.error('[EnhancedSentenceMiningService] Error in emergency selection:', error);
      return ['der'];
    }
  }

  private static extractSentencePattern(sentence: string): string {
    if (!sentence) return 'unknown';
    
    const length = sentence.split(' ').length;
    let pattern = '';
    
    if (length <= 6) pattern += 'short_';
    else if (length <= 12) pattern += 'medium_';
    else pattern += 'long_';
    
    if (sentence.includes('?')) pattern += 'question_';
    if (sentence.includes(',')) pattern += 'complex_';
    if (sentence.includes('weil') || sentence.includes('dass') || sentence.includes('wenn')) pattern += 'subordinate_';
    
    return pattern || 'simple';
  }

  static async getEnhancedSessionStats(
    userId: string,
    language: string,
    sessionId: string
  ) {
    try {
      // Get comprehensive stats for the enhanced service
      const [
        wordStats,
        diversityMetrics,
        cooldownStats,
        patternMetrics
      ] = await Promise.all([
        IntelligentWordSelection.getWordSelectionStats(userId, language, sessionId),
        WordDiversityEngine.analyzeSessionDiversity(userId, language, sessionId),
        EnhancedCooldownSystem.getCooldownStats(userId, language, sessionId),
        SentencePatternDiversityEngine.analyzePatternDiversity(userId, language, sessionId)
      ]);

      return {
        wordStats,
        diversityMetrics,
        cooldownStats,
        patternMetrics,
        overallHealthScore: Math.round(
          (diversityMetrics.overallScore + 
           (100 - Math.min(cooldownStats.activeCooldowns * 10, 50)) +
           patternMetrics.patternDistribution) / 3
        )
      };

    } catch (error) {
      console.error('[EnhancedSentenceMiningService] Error getting session stats:', error);
      return null;
    }
  }
}
