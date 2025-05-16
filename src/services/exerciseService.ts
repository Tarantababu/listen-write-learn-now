
import { Exercise, Language } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// Remove the import that's causing the conflict since we have our own implementation
// import { ensureAudioBucket } from '@/services/defaultExerciseService';

/**
 * Fetches exercises from Supabase for an authenticated user
 */
export const fetchExercises = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error('User ID is required to fetch exercises');
  }

  // Use explicit type casting to avoid deep recursion
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false) // Only fetch non-archived exercises
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data?.map(mapExerciseFromDb) || [];
};

/**
 * Creates a new exercise for the current user
 */
export const createExercise = async (
  userId: string, 
  exercise: Omit<Exercise, 'id' | 'createdAt' | 'completionCount' | 'isCompleted'>
) => {
  // Ensure audio bucket exists
  await ensureAudioBucket();

  const { data, error } = await supabase
    .from('exercises')
    .insert({
      user_id: userId,
      title: exercise.title,
      text: exercise.text,
      language: exercise.language,
      tags: exercise.tags,
      audio_url: exercise.audioUrl,
      directory_id: exercise.directoryId,
      archived: false // New exercises are not archived
    })
    .select('*')
    .single();

  if (error) throw error;

  return mapExerciseFromDb(data);
};

/**
 * Updates an exercise in Supabase
 */
export const updateExercise = async (userId: string, id: string, updates: Partial<Exercise>) => {
  // Create an object with only the database fields
  const updateData: Record<string, any> = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.text !== undefined) updateData.text = updates.text;
  if (updates.language !== undefined) updateData.language = updates.language;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.audioUrl !== undefined) updateData.audio_url = updates.audioUrl;
  if (updates.directoryId !== undefined) updateData.directory_id = updates.directoryId;
  if (updates.completionCount !== undefined) updateData.completion_count = updates.completionCount;
  if (updates.isCompleted !== undefined) updateData.is_completed = updates.isCompleted;
  if (updates.archived !== undefined) updateData.archived = updates.archived;

  const { error } = await supabase
    .from('exercises')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
};

/**
 * Deletes all vocabulary items associated with an exercise
 */
export const deleteAssociatedVocabulary = async (userId: string, exerciseId: string) => {
  // Delete vocabulary items associated with the exercise
  const { error } = await supabase
    .from('vocabulary')
    .delete()
    .eq('exercise_id', exerciseId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting associated vocabulary:', error);
    throw error;
  }
};

/**
 * Deletes all completions associated with an exercise
 */
export const deleteAssociatedCompletions = async (userId: string, exerciseId: string) => {
  try {
    console.log(`Attempting to delete completions for exercise ${exerciseId} and user ${userId}`);
    
    // Delete completion records associated with the exercise
    const { error, count } = await supabase
      .from('completions')
      .delete({ count: 'exact' })
      .eq('exercise_id', exerciseId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting associated completions:', error);
      throw error;
    }
    
    console.log(`Successfully deleted ${count} completion records for exercise ${exerciseId}`);
    return true;
  } catch (error) {
    console.error('Error deleting associated completions:', error);
    throw error;
  }
};

/**
 * Archives an exercise in Supabase instead of deleting it
 */
export const archiveExercise = async (userId: string, id: string) => {
  const { error } = await supabase
    .from('exercises')
    .update({ archived: true })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
};

/**
 * Deletes an exercise from Supabase
 * Note: This function is kept for backwards compatibility but should be avoided
 * in favor of archiveExercise to prevent foreign key constraint violations
 */
export const deleteExercise = async (userId: string, id: string) => {
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
};

/**
 * Records a completion attempt for an exercise
 */
export const recordCompletion = async (userId: string, exerciseId: string, accuracy: number, isCompleted: boolean) => {
  try {
    // Record completion in the completions table
    const { error: completionError } = await supabase
      .from('completions')
      .insert({
        user_id: userId,
        exercise_id: exerciseId,
        accuracy: accuracy,
        completed: isCompleted
      });

    if (completionError) {
      console.error('Error saving completion record:', completionError);
      throw completionError;
    }

    // Get the exercise language to record activity
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .select('language')
      .eq('id', exerciseId)
      .single();

    if (exerciseError) {
      console.error('Error fetching exercise language:', exerciseError);
      return;
    }

    // Only record high accuracy completions (95%+) in the activity system
    if (accuracy >= 95 && exerciseData.language) {
      // Use our new record_language_activity function to update streaks
      const { error: activityError } = await supabase.rpc(
        'record_language_activity',
        {
          user_id_param: userId,
          language_param: exerciseData.language,
          activity_date_param: new Date().toISOString().split('T')[0],
          exercises_completed_param: 1,
          words_mastered_param: 0 // Words mastered is calculated separately
        }
      );

      if (activityError) {
        console.error('Error recording language activity:', activityError);
      }
    }
  } catch (error) {
    console.error('Error in recordCompletion:', error);
  }
};

/**
 * Maps an exercise from the database format to the app format
 */
export const mapExerciseFromDb = (ex: any): Exercise => ({
  id: ex.id,
  title: ex.title,
  text: ex.text,
  language: ex.language as Language,
  tags: ex.tags || [],
  audioUrl: ex.audio_url,
  directoryId: ex.directory_id,
  createdAt: new Date(ex.created_at),
  completionCount: ex.completion_count || 0,
  isCompleted: ex.is_completed || false,
  archived: ex.archived || false
});

/**
 * Creates initial audio bucket if it doesn't exist
 */
export const ensureAudioBucket = async () => {
  try {
    // Changed to use the ensure-audio-bucket edge function instead of create-audio-bucket
    await supabase.functions.invoke('ensure-audio-bucket');
  } catch (error) {
    console.error('Error ensuring audio bucket exists:', error);
  }
};
