
import { supabase } from '@/integrations/supabase/client';

export class SpacedRepetitionEngine {
  static async getWordsForReview(
    userId: string,
    language: string,
    limit: number = 10
  ): Promise<string[]> {
    try {
      const { data: words } = await supabase
        .from('known_words')
        .select('word')
        .eq('user_id', userId)
        .eq('language', language)
        .lte('next_review_date', new Date().toISOString().split('T')[0])
        .order('next_review_date', { ascending: true })
        .limit(limit);

      return words?.map(w => w.word) || [];
    } catch (error) {
      console.error('[SpacedRepetitionEngine] Error getting words for review:', error);
      return [];
    }
  }

  static async getStrugglingWords(
    userId: string,
    language: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      const { data: words } = await supabase
        .from('known_words')
        .select('word')
        .eq('user_id', userId)
        .eq('language', language)
        .lte('mastery_level', 2)
        .gte('review_count', 3)
        .order('mastery_level', { ascending: true })
        .limit(limit);

      return words?.map(w => w.word) || [];
    } catch (error) {
      console.error('[SpacedRepetitionEngine] Error getting struggling words:', error);
      return [];
    }
  }

  static async updateWordPerformance(
    userId: string,
    word: string,
    language: string,
    isCorrect: boolean
  ): Promise<void> {
    try {
      await supabase.rpc('update_word_mastery', {
        user_id_param: userId,
        word_param: word,
        language_param: language,
        is_correct_param: isCorrect
      });

      console.log(`[SpacedRepetitionEngine] Updated performance for word '${word}': ${isCorrect ? 'correct' : 'incorrect'}`);
    } catch (error) {
      console.error('[SpacedRepetitionEngine] Error updating word performance:', error);
    }
  }

  static async initializeWord(
    userId: string,
    word: string,
    language: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('known_words')
        .upsert({
          user_id: userId,
          word: word,
          language: language,
          mastery_level: 1,
          review_count: 0,
          correct_count: 0,
          next_review_date: new Date().toISOString().split('T')[0]
        }, { onConflict: 'user_id,word,language' });

      if (error) throw error;

      console.log(`[SpacedRepetitionEngine] Initialized word '${word}' for user ${userId}`);
    } catch (error) {
      console.error('[SpacedRepetitionEngine] Error initializing word:', error);
    }
  }
}
