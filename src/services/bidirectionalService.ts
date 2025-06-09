
import { supabase } from '@/integrations/supabase/client';
import type { BidirectionalExercise, BidirectionalReview, BidirectionalMasteredWord, SpacedRepetitionConfig, DEFAULT_SRS_CONFIG } from '@/types/bidirectional';

export class BidirectionalService {
  // Create a new bidirectional exercise
  static async createExercise(data: {
    original_sentence: string;
    target_language: string;
    support_language: string;
  }): Promise<BidirectionalExercise> {
    const { data: exercise, error } = await supabase
      .from('bidirectional_exercises')
      .insert({
        ...data,
        status: 'learning'
      })
      .select()
      .single();

    if (error) throw error;
    return exercise;
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
    return data || [];
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

  // Mark exercise as ready for reviewing
  static async promoteToReviewing(exerciseId: string): Promise<void> {
    const { error } = await supabase
      .from('bidirectional_exercises')
      .update({ status: 'reviewing' })
      .eq('id', exerciseId);

    if (error) throw error;
  }

  // Calculate next review date based on spaced repetition
  static calculateNextReviewDate(
    isCorrect: boolean,
    previousInterval: number = 1,
    config: SpacedRepetitionConfig = DEFAULT_SRS_CONFIG
  ): Date {
    const nextDate = new Date();
    let nextInterval: number;

    if (isCorrect) {
      nextInterval = Math.min(
        Math.ceil(previousInterval * config.correctMultiplier),
        config.maxInterval
      );
    } else {
      nextInterval = Math.max(1, Math.ceil(previousInterval * config.incorrectMultiplier));
    }

    nextDate.setDate(nextDate.getDate() + nextInterval);
    return nextDate;
  }

  // Record a review attempt
  static async recordReview(data: {
    exercise_id: string;
    review_type: 'forward' | 'backward';
    user_recall_attempt: string;
    is_correct: boolean;
    feedback?: string;
  }): Promise<BidirectionalReview> {
    const nextReviewDate = this.calculateNextReviewDate(data.is_correct);

    const { data: review, error } = await supabase
      .from('bidirectional_reviews')
      .insert({
        ...data,
        due_date: nextReviewDate.toISOString().split('T')[0],
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return review;
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
        dueExercises.push({ exercise, review_type: 'forward' });
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
        dueExercises.push({ exercise, review_type: 'backward' });
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
    const masteredWords = words.map(word => ({
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
    return data || [];
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
    return data;
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
