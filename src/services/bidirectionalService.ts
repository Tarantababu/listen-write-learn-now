
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

    // Generate and store audio for the sentence
    await this.generateAndStoreAudio(exercise.id, data.original_sentence, data.target_language);

    return exercise as BidirectionalExercise;
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

  // Generate and store audio using TTS
  static async generateAndStoreAudio(
    exerciseId: string,
    text: string,
    language: string
  ): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          language,
          voice: this.getVoiceForLanguage(language)
        }
      });

      if (error) throw error;

      // Update exercise with audio URL
      await supabase
        .from('bidirectional_exercises')
        .update({ original_audio_url: data.audioUrl })
        .eq('id', exerciseId);
    } catch (error) {
      console.error('Error generating audio:', error);
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

  // Update exercise with user translations
  static async updateExerciseTranslations(
    exerciseId: string,
    data: {
      user_forward_translation?: string;
      user_back_translation?: string;
      reflection_notes?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('bidirectional_exercises')
      .update(data)
      .eq('id', exerciseId);

    if (error) throw error;
  }

  // Mark exercise as ready for reviewing and record initial completion for streaks
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

  // Record language activity for streak system integration
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
    reviewNumber: number = 1
  ): Date {
    const nextDate = new Date();
    
    if (!isCorrect) {
      // If incorrect, reset to 1 day
      nextDate.setDate(nextDate.getDate() + 1);
      return nextDate;
    }

    // Spaced repetition: 1 → 3 → 7 days
    switch (reviewNumber) {
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

  // Record a review attempt with system integrations
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

    const reviewNumber = (previousReviews?.length || 0) + 1;
    const nextReviewDate = this.calculateNextReviewDate(data.is_correct, reviewNumber);

    const { data: review, error } = await supabase
      .from('bidirectional_reviews')
      .insert({
        ...data,
        user_id: user.id,
        due_date: nextReviewDate.toISOString().split('T')[0],
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Get exercise for language tracking
    const exercise = await this.getExerciseById(data.exercise_id);
    if (exercise) {
      // Record language activity for streak system
      await this.recordLanguageActivity(user.id, exercise.target_language);

      // If this is day 7 review and correct, add mastered words
      if (data.is_correct && reviewNumber >= 3) {
        await this.extractAndMarkMasteredWords(data.exercise_id, exercise);
        
        // Mark exercise as mastered if both directions are complete
        await this.checkAndMarkAsMastered(data.exercise_id);
      }
    }

    return review as BidirectionalReview;
  }

  // Extract and mark words as mastered (Day 7+ reviews)
  static async extractAndMarkMasteredWords(
    exerciseId: string,
    exercise: BidirectionalExercise
  ): Promise<void> {
    const words = exercise.original_sentence
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2); // Only words longer than 2 characters

    if (words.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Add to bidirectional mastered words using upsert
    const masteredWords = words.map(word => ({
      user_id: user.id,
      exercise_id: exerciseId,
      word,
      language: exercise.target_language
    }));

    try {
      await supabase
        .from('bidirectional_mastered_words')
        .upsert(masteredWords, { 
          onConflict: 'user_id,word,language',
          ignoreDuplicates: true 
        });
    } catch (error) {
      console.error('Error upserting bidirectional mastered words:', error);
    }

    // Also add to main vocabulary system using upsert
    for (const word of words) {
      try {
        await supabase
          .from('vocabulary')
          .upsert({
            user_id: user.id,
            exercise_id: exerciseId,
            word,
            language: exercise.target_language,
            definition: `From bidirectional exercise: ${exercise.original_sentence}`,
            example_sentence: exercise.original_sentence
          }, { 
            onConflict: 'user_id,word,language',
            ignoreDuplicates: true 
          });
      } catch (error) {
        console.error('Error upserting vocabulary word:', error);
      }
    }

    // Record mastered words for streak system
    await this.recordLanguageActivity(user.id, exercise.target_language);
  }

  // Check if exercise should be marked as mastered
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

  // Get exercises due for review
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

  // Mark words as mastered
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

  // Get mastered words for a user
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

  // Get exercise by ID
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

  // Delete an exercise
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
