import { supabase } from '@/integrations/supabase/client';
import { Language } from '@/types';

export interface WordMasteryStats {
  totalMastered: number;
  sentenceMiningMastered: number;
  regularExerciseMastered: number;
  bidirectionalMastered: number;
  language: Language;
}

export interface WordMasteryBreakdown {
  source: 'sentence_mining' | 'regular_exercises' | 'bidirectional';
  count: number;
  percentage: number;
}

export class WordMasteryService {
  /**
   * Get comprehensive word mastery statistics for a user and language
   */
  static async getMasteryStats(userId: string, language: Language): Promise<WordMasteryStats> {
    try {
      // Use the unified calculation function
      const { data: totalMastered, error: totalError } = await supabase
        .rpc('calculate_total_mastered_words', {
          user_id_param: userId,
          language_param: language
        });

      if (totalError) {
        console.error('Error calculating total mastered words:', totalError);
        throw totalError;
      }

      // Get detailed breakdown by source
      const [sentenceMiningResult, bidirectionalResult] = await Promise.all([
        // Sentence mining mastered words (mastery level >= 4)
        supabase
          .from('known_words')
          .select('word', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('language', language)
          .gte('mastery_level', 4),
        
        // Bidirectional mastered words
        supabase
          .from('bidirectional_mastered_words')
          .select('word', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('language', language)
      ]);

      const sentenceMiningMastered = sentenceMiningResult.count || 0;
      const bidirectionalMastered = bidirectionalResult.count || 0;

      // Calculate regular exercise mastered words by subtraction
      const regularExerciseMastered = Math.max(0, 
        (totalMastered || 0) - sentenceMiningMastered - bidirectionalMastered
      );

      return {
        totalMastered: totalMastered || 0,
        sentenceMiningMastered,
        regularExerciseMastered,
        bidirectionalMastered,
        language
      };
    } catch (error) {
      console.error('Error getting mastery stats:', error);
      return {
        totalMastered: 0,
        sentenceMiningMastered: 0,
        regularExerciseMastered: 0,
        bidirectionalMastered: 0,
        language
      };
    }
  }

  /**
   * Get mastery breakdown with percentages
   */
  static async getMasteryBreakdown(userId: string, language: Language): Promise<WordMasteryBreakdown[]> {
    const stats = await this.getMasteryStats(userId, language);
    
    if (stats.totalMastered === 0) {
      return [];
    }

    return [
      {
        source: 'sentence_mining' as const,
        count: stats.sentenceMiningMastered,
        percentage: Math.round((stats.sentenceMiningMastered / stats.totalMastered) * 100)
      },
      {
        source: 'regular_exercises' as const,
        count: stats.regularExerciseMastered,
        percentage: Math.round((stats.regularExerciseMastered / stats.totalMastered) * 100)
      },
      {
        source: 'bidirectional' as const,
        count: stats.bidirectionalMastered,
        percentage: Math.round((stats.bidirectionalMastered / stats.totalMastered) * 100)
      }
    ].filter(item => item.count > 0);
  }

  /**
   * Check if a specific word has been mastered
   */
  static async isWordMastered(userId: string, word: string, language: Language): Promise<boolean> {
    try {
      // Check in known_words with mastery level >= 4
      const { data: knownWord } = await supabase
        .from('known_words')
        .select('mastery_level')
        .eq('user_id', userId)
        .eq('word', word.toLowerCase())
        .eq('language', language)
        .gte('mastery_level', 4)
        .maybeSingle();

      if (knownWord) return true;

      // Check in bidirectional mastered words
      const { data: bidirectionalWord } = await supabase
        .from('bidirectional_mastered_words')
        .select('id')
        .eq('user_id', userId)
        .eq('word', word.toLowerCase())
        .eq('language', language)
        .maybeSingle();

      return !!bidirectionalWord;
    } catch (error) {
      console.error('Error checking word mastery:', error);
      return false;
    }
  }

  /**
   * Update word mastery from sentence mining exercise
   */
  static async updateWordMasteryFromSentenceMining(
    userId: string,
    word: string,
    language: Language,
    isCorrect: boolean
  ): Promise<void> {
    try {
      // Use the existing update_word_mastery function
      await supabase.rpc('update_word_mastery', {
        user_id_param: userId,
        word_param: word.toLowerCase(),
        language_param: language,
        is_correct_param: isCorrect
      });
    } catch (error) {
      console.error('Error updating word mastery:', error);
      throw error;
    }
  }

  /**
   * Get recent mastery achievements
   */
  static async getRecentMasteryAchievements(
    userId: string, 
    language: Language, 
    limit: number = 10
  ): Promise<Array<{ word: string; masteredAt: Date; source: string }>> {
    try {
      const [knownWords, bidirectionalWords] = await Promise.all([
        // Recent words that reached mastery level 4 in sentence mining
        supabase
          .from('known_words')
          .select('word, updated_at')
          .eq('user_id', userId)
          .eq('language', language)
          .eq('mastery_level', 4)
          .order('updated_at', { ascending: false })
          .limit(limit),
        
        // Recent bidirectional mastered words
        supabase
          .from('bidirectional_mastered_words')
          .select('word, mastered_at')
          .eq('user_id', userId)
          .eq('language', language)
          .order('mastered_at', { ascending: false })
          .limit(limit)
      ]);

      const achievements = [
        ...(knownWords.data || []).map(item => ({
          word: item.word,
          masteredAt: new Date(item.updated_at),
          source: 'sentence_mining'
        })),
        ...(bidirectionalWords.data || []).map(item => ({
          word: item.word,
          masteredAt: new Date(item.mastered_at),
          source: 'bidirectional'
        }))
      ];

      // Sort by date and return top achievements
      return achievements
        .sort((a, b) => b.masteredAt.getTime() - a.masteredAt.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent mastery achievements:', error);
      return [];
    }
  }

  /**
   * Refresh mastery stats after sentence mining session
   */
  static async refreshStatsAfterSession(sessionId: string): Promise<void> {
    try {
      await supabase.rpc('update_session_words_mastered', {
        session_id_param: sessionId
      });
    } catch (error) {
      console.error('Error refreshing stats after session:', error);
      throw error;
    }
  }
}
