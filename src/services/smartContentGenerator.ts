
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';

export interface VocabularyProfile {
  knownWords: string[];
  strugglingWords: string[];
  masteredWords: string[];
  wordFrequency: Record<string, number>;
}

export interface ContentGenerationParams {
  difficulty: DifficultyLevel;
  language: string;
  userId: string;
  sessionId: string;
  vocabularyProfile: VocabularyProfile;
  failurePatterns: string[];
  previousSentences: string[];
}

export interface EnhancedExerciseRequest {
  difficulty_level: DifficultyLevel;
  language: string;
  session_id: string;
  known_words: string[];
  struggling_words: string[];
  previous_sentences: string[];
  target_word_types: string[];
  n_plus_one: boolean;
  adaptive_hints: boolean;
}

export class SmartContentGenerator {
  private static readonly STRUGGLING_WORD_THRESHOLD = 3; // Failed 3+ times
  private static readonly MASTERED_WORD_THRESHOLD = 5; // Correct 5+ times

  static async generateVocabularyProfile(userId: string, language: string): Promise<VocabularyProfile> {
    // Get known words with mastery levels
    const { data: knownWords } = await supabase
      .from('known_words')
      .select('word, mastery_level, correct_count, review_count')
      .eq('user_id', userId)
      .eq('language', language);

    const profile: VocabularyProfile = {
      knownWords: [],
      strugglingWords: [],
      masteredWords: [],
      wordFrequency: {}
    };

    if (knownWords) {
      knownWords.forEach(wordData => {
        const word = wordData.word;
        profile.knownWords.push(word);
        profile.wordFrequency[word] = wordData.review_count || 0;

        // Classify based on performance
        const accuracy = wordData.review_count > 0 
          ? (wordData.correct_count / wordData.review_count) 
          : 0;

        if (wordData.review_count >= this.STRUGGLING_WORD_THRESHOLD && accuracy < 0.6) {
          profile.strugglingWords.push(word);
        }

        if (wordData.correct_count >= this.MASTERED_WORD_THRESHOLD && accuracy >= 0.8) {
          profile.masteredWords.push(word);
        }
      });
    }

    return profile;
  }

  static async detectFailurePatterns(userId: string, language: string): Promise<string[]> {
    // First get the session IDs
    const { data: sessions } = await supabase
      .from('sentence_mining_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('language', language);

    if (!sessions || sessions.length === 0) {
      return [];
    }

    const sessionIds = sessions.map(session => session.id);

    // Get recent failed exercises using the extracted session IDs
    const { data: recentExercises } = await supabase
      .from('sentence_mining_exercises')
      .select('target_words, is_correct, session_id')
      .eq('is_correct', false)
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false })
      .limit(20);

    const failurePatterns: string[] = [];
    const wordFailures: Record<string, number> = {};

    if (recentExercises) {
      recentExercises.forEach(exercise => {
        if (exercise.target_words) {
          exercise.target_words.forEach((word: string) => {
            wordFailures[word] = (wordFailures[word] || 0) + 1;
          });
        }
      });

      // Identify patterns (words that failed multiple times recently)
      Object.entries(wordFailures).forEach(([word, count]) => {
        if (count >= 2) {
          failurePatterns.push(word);
        }
      });
    }

    return failurePatterns;
  }

  static async enhanceGenerationPrompt(params: ContentGenerationParams): Promise<EnhancedExerciseRequest> {
    const failurePatterns = await this.detectFailurePatterns(params.userId, params.language);
    
    // Determine target word types based on user's weakness
    const targetWordTypes = this.determineTargetWordTypes(
      params.vocabularyProfile, 
      failurePatterns, 
      params.difficulty
    );

    return {
      difficulty_level: params.difficulty,
      language: params.language,
      session_id: params.sessionId,
      known_words: params.vocabularyProfile.knownWords.slice(0, 50), // Limit for API
      struggling_words: params.vocabularyProfile.strugglingWords,
      previous_sentences: params.previousSentences,
      target_word_types: targetWordTypes,
      n_plus_one: true,
      adaptive_hints: true
    };
  }

  private static determineTargetWordTypes(
    profile: VocabularyProfile, 
    failurePatterns: string[], 
    difficulty: DifficultyLevel
  ): string[] {
    const types: string[] = [];

    // Focus on struggling words for reinforcement
    if (profile.strugglingWords.length > 0 && Math.random() < 0.4) {
      types.push('reinforcement');
    }

    // Include word types based on difficulty
    switch (difficulty) {
      case 'beginner':
        types.push('basic_nouns', 'common_verbs', 'everyday_adjectives');
        break;
      case 'intermediate':
        types.push('complex_verbs', 'descriptive_adjectives', 'prepositions');
        break;
      case 'advanced':
        types.push('abstract_concepts', 'idiomatic_expressions', 'formal_vocabulary');
        break;
    }

    return types;
  }

  static async trackWordPerformance(
    userId: string, 
    word: string, 
    language: string, 
    isCorrect: boolean
  ): Promise<void> {
    // Update word mastery using the existing RPC function
    await supabase.rpc('update_word_mastery', {
      user_id_param: userId,
      word_param: word,
      language_param: language,
      is_correct_param: isCorrect
    });
  }
}
