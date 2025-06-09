import { supabase } from '@/integrations/supabase/client';
import type { BidirectionalExercise, BidirectionalReview, BidirectionalMasteredWord, SpacedRepetitionConfig } from '@/types/bidirectional';

const DEFAULT_SRS_CONFIG: SpacedRepetitionConfig = {
  correctMultiplier: 2.5,
  incorrectMultiplier: 0.8,
  maxInterval: 365,
  graduationInterval: 4
};

export class BidirectionalService {
  // Create a new bidirectional exercise
  static async createExercise(data: {
    original_sentence: string;
    target_language: string;
    support_language: string;
  }): Promise<BidirectionalExercise> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate translations using OpenAI
    const translations = await this.generateTranslations(
      data.original_sentence,
      data.target_language,
      data.support_language
    );

    const { data: exercise, error } = await supabase
      .from('bidirectional_exercises')
      .insert({
        ...data,
        user_id: user.id,
        status: 'learning',
        normal_translation: translations.normal,
        literal_translation: translations.literal
      })
      .select()
      .single();

    if (error) throw error;

    // Generate and store audio for all three versions with proper URLs
    await Promise.all([
      this.generateAndStoreAudio(
        exercise.id, 
        data.original_sentence, 
        data.target_language, 
        'original'
      ),
      this.generateAndStoreAudio(
        exercise.id, 
        translations.normal, 
        data.support_language, 
        'normal_translation'
      ),
      this.generateAndStoreAudio(
        exercise.id, 
        translations.literal, 
        data.support_language, 
        'literal_translation'
      )
    ]);

    // Fetch the updated exercise with audio URLs
    const { data: updatedExercise } = await supabase
      .from('bidirectional_exercises')
      .select('*')
      .eq('id', exercise.id)
      .single();

    return updatedExercise as BidirectionalExercise;
  }

  // Generate translations using OpenAI
  static async generateTranslations(
    sentence: string,
    targetLanguage: string,
    supportLanguage: string
  ): Promise<{ normal: string; literal: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-reading-analysis', {
        body: {
          text: sentence,
          language: targetLanguage,
          type: 'bidirectional_translation',
          supportLanguage
        }
      });

      if (error) throw error;

      return {
        normal: data.normalTranslation || '',
        literal: data.literalTranslation || ''
      };
    } catch (error) {
      console.error('Error generating translations:', error);
      return { normal: '', literal: '' };
    }
  }

  // Generate and store audio using TTS with proper URL storage
  static async generateAndStoreAudio(
    exerciseId: string,
    text: string,
    language: string,
    audioType: 'original' | 'normal_translation' | 'literal_translation'
  ): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          language,
          exerciseId,
          audioType
        }
      });

      if (error) throw error;

      // Update exercise with audio URL
      if (data.audioUrl) {
        const updateData: { [key: string]: string } = {};
        if (audioType === 'original') {
          updateData.original_audio_url = data.audioUrl;
        } else if (audioType === 'normal_translation') {
          updateData.normal_translation_audio_url = data.audioUrl;
        } else if (audioType === 'literal_translation') {
          updateData.literal_translation_audio_url = data.audioUrl;
        }

        await supabase
          .from('bidirectional_exercises')
          .update(updateData)
          .eq('id', exerciseId);
        
        console.log(`Updated exercise ${exerciseId} with ${audioType} audio URL: ${data.audioUrl}`);
      }
    } catch (error) {
      console.error(`Error generating ${audioType} audio:`, error);
    }
  }

  // Get appropriate voice for language
  static getVoiceForLanguage(language: string): string {
    const voiceMap: { [key: string]: string } = {
      'spanish': 'alloy',
      'french': 'echo',
      'german': 'fable',
      'italian': 'onyx',
      'portuguese': 'nova',
      'english': 'alloy'
    };
    return voiceMap[language] || 'alloy';
  }

  // Get user's bidirectional exercises
  static async getUserExercises(userId: string, status?: string): Promise<BidirectionalExercise[]> {
    let query = supabase
      .from('bidirectional_exercises')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as BidirectionalExercise[];
  }

  static async updateExerciseTranslations(
    exerciseId: string,
    data: {
      user_forward_translation?: string;
      user_back_translation?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('bidirectional_exercises')
      .update(data)
      .eq('id', exerciseId);

    if (error) throw error;
  }

  static async promoteToReviewing(exerciseId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('bidirectional_exercises')
      .update({ status: 'reviewing' })
      .eq('id', exerciseId);

    if (error) throw error;

    // Get exercise details for language tracking
    const exercise = await this.getExerciseById(exerciseId);
    if (exercise) {
      // Record language activity for streak tracking
      await this.recordLanguageActivity(user.id, exercise.target_language);
    }
  }

  static async recordLanguageActivity(userId: string, language: string): Promise<void> {
    try {
      await supabase.rpc('record_language_activity', {
        user_id_param: userId,
        language_param: language,
        activity_date_param: new Date().toISOString().split('T')[0],
        exercises_completed_param: 1,
        words_mastered_param: 0
      });
    } catch (error) {
      console.error('Error recording language activity:', error);
    }
  }

  // Calculate next review date based on spaced repetition (1 → 3 → 7 days)
  static calculateNextReviewDate(
    isCorrect: boolean,
    reviewRound: number = 1
  ): Date {
    const nextDate = new Date();
    
    if (!isCorrect) {
      // If incorrect, reset to 1 day
      nextDate.setDate(nextDate.getDate() + 1);
      return nextDate;
    }

    // Spaced repetition: 1 → 3 → 7 days
    switch (reviewRound) {
      case 1:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 2:
        nextDate.setDate(nextDate.getDate() + 3);
        break;
      case 3:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      default:
        // After day 7, mark as mastered
        nextDate.setDate(nextDate.getDate() + 30);
        break;
    }

    return nextDate;
  }

  static async recordReview(data: {
    exercise_id: string;
    review_type: 'forward' | 'backward';
    user_recall_attempt: string;
    is_correct: boolean;
    feedback?: string;
  }): Promise<BidirectionalReview> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current review count for this exercise and type
    const { data: previousReviews } = await supabase
      .from('bidirectional_reviews')
      .select('*')
      .eq('exercise_id', data.exercise_id)
      .eq('review_type', data.review_type)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const reviewRound = (previousReviews?.length || 0) + 1;
    const nextReviewDate = this.calculateNextReviewDate(data.is_correct, reviewRound);

    const { data: review, error } = await supabase
      .from('bidirectional_reviews')
      .insert({
        ...data,
        user_id: user.id,
        due_date: nextReviewDate.toISOString().split('T')[0],
        completed_at: new Date().toISOString(),
        review_round: reviewRound
      })
      .select()
      .single();

    if (error) throw error;

    // Get exercise for language tracking
    const exercise = await this.getExerciseById(data.exercise_id);
    if (exercise) {
      // Record language activity for streak system
      await this.recordLanguageActivity(user.id, exercise.target_language);

      // If this is round 3 review and correct, add mastered words
      if (data.is_correct && reviewRound >= 3) {
        await this.extractAndMarkMasteredWords(data.exercise_id, exercise);
        
        // Mark exercise as mastered if both directions are complete
        await this.checkAndMarkAsMastered(data.exercise_id);
      }
    }

    return review as BidirectionalReview;
  }

  static async extractAndMarkMasteredWords(
    exerciseId: string,
    exercise: BidirectionalExercise
  ): Promise<void> {
    try {
      await supabase.rpc('extract_bidirectional_mastered_words', {
        exercise_id_param: exerciseId
      });

      // Record mastered words for streak system
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.recordLanguageActivity(user.id, exercise.target_language);
      }
    } catch (error) {
      console.error('Error extracting mastered words:', error);
    }
  }

  static async checkAndMarkAsMastered(exerciseId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if both forward and backward reviews have been completed successfully
    const { data: forwardReviews } = await supabase
      .from('bidirectional_reviews')
      .select('*')
      .eq('exercise_id', exerciseId)
      .eq('review_type', 'forward')
      .eq('user_id', user.id)
      .eq('is_correct', true);

    const { data: backwardReviews } = await supabase
      .from('bidirectional_reviews')
      .select('*')
      .eq('exercise_id', exerciseId)
      .eq('review_type', 'backward')
      .eq('user_id', user.id)
      .eq('is_correct', true);

    const forwardComplete = (forwardReviews?.length || 0) >= 3;
    const backwardComplete = (backwardReviews?.length || 0) >= 3;

    if (forwardComplete && backwardComplete) {
      await supabase
        .from('bidirectional_exercises')
        .update({ status: 'mastered' })
        .eq('id', exerciseId);
    }
  }

  static async getExercisesDueForReview(userId: string): Promise<{
    exercise: BidirectionalExercise;
    review_type: 'forward' | 'backward';
  }[]> {
    const today = new Date().toISOString().split('T')[0];

    // Get exercises that need reviewing
    const { data: exercises, error: exerciseError } = await supabase
      .from('bidirectional_exercises')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'reviewing');

    if (exerciseError) throw exerciseError;

    const dueExercises: { exercise: BidirectionalExercise; review_type: 'forward' | 'backward' }[] = [];

    for (const exercise of exercises || []) {
      const typedExercise = exercise as BidirectionalExercise;
      
      // Check if forward review is due
      const { data: forwardReviews } = await supabase
        .from('bidirectional_reviews')
        .select('*')
        .eq('exercise_id', exercise.id)
        .eq('review_type', 'forward')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastForwardReview = forwardReviews?.[0];
      if (!lastForwardReview || lastForwardReview.due_date <= today) {
        dueExercises.push({ exercise: typedExercise, review_type: 'forward' });
      }

      // Check if backward review is due
      const { data: backwardReviews } = await supabase
        .from('bidirectional_reviews')
        .select('*')
        .eq('exercise_id', exercise.id)
        .eq('review_type', 'backward')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastBackwardReview = backwardReviews?.[0];
      if (!lastBackwardReview || lastBackwardReview.due_date <= today) {
        dueExercises.push({ exercise: typedExercise, review_type: 'backward' });
      }
    }

    return dueExercises;
  }

  static async markWordsAsMastered(
    exerciseId: string,
    words: string[],
    language: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const masteredWords = words.map(word => ({
      user_id: user.id,
      exercise_id: exerciseId,
      word,
      language
    }));

    const { error } = await supabase
      .from('bidirectional_mastered_words')
      .insert(masteredWords);

    if (error) throw error;
  }

  static async getMasteredWords(userId: string, language?: string): Promise<BidirectionalMasteredWord[]> {
    let query = supabase
      .from('bidirectional_mastered_words')
      .select('*')
      .eq('user_id', userId);

    if (language) {
      query = query.eq('language', language);
    }

    const { data, error } = await query.order('mastered_at', { ascending: false });

    if (error) throw error;
    return (data || []) as BidirectionalMasteredWord[];
  }

  static async getExerciseById(exerciseId: string): Promise<BidirectionalExercise | null> {
    const { data, error } = await supabase
      .from('bidirectional_exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data as BidirectionalExercise;
  }

  static async deleteExercise(exerciseId: string): Promise<void> {
    // Delete related records first
    await supabase.from('bidirectional_reviews').delete().eq('exercise_id', exerciseId);
    await supabase.from('bidirectional_mastered_words').delete().eq('exercise_id', exerciseId);

    const { error } = await supabase
      .from('bidirectional_exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) throw error;
  }
}
