
import { Exercise, Language } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { asUUID, asString, asBoolean, asNumber, asArray } from '@/utils/supabaseHelpers';

/**
 * Fetches exercises from Supabase for an authenticated user
 */
export const fetchExercises = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error('User ID is required to fetch exercises');
  }

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', asUUID(userId))
    .eq('archived', asBoolean(false)) // Only fetch non-archived exercises
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
      user_id: asUUID(userId),
      title: exercise.title,
      text: exercise.text,
      language: asString(exercise.language),
      tags: asArray(exercise.tags),
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
  if (updates.language !== undefined) updateData.language = asString(updates.language);
  if (updates.tags !== undefined) updateData.tags = asArray(updates.tags);
  if (updates.audioUrl !== undefined) updateData.audio_url = updates.audioUrl;
  if (updates.directoryId !== undefined) updateData.directory_id = updates.directoryId;
  if (updates.completionCount !== undefined) updateData.completion_count = asNumber(updates.completionCount);
  if (updates.isCompleted !== undefined) updateData.is_completed = asBoolean(updates.isCompleted);
  if (updates.archived !== undefined) updateData.archived = asBoolean(updates.archived);

  const { error } = await supabase
    .from('exercises')
    .update(updateData)
    .eq('id', asUUID(id))
    .eq('user_id', asUUID(userId));

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
    .eq('exercise_id', asUUID(exerciseId))
    .eq('user_id', asUUID(userId));

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
      .eq('exercise_id', asUUID(exerciseId))
      .eq('user_id', asUUID(userId));

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
    .eq('id', asUUID(id))
    .eq('user_id', asUUID(userId));

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
    .eq('id', asUUID(id))
    .eq('user_id', asUUID(userId));

  if (error) throw error;
};

/**
 * Records a completion attempt for an exercise
 */
export const recordCompletion = async (userId: string, exerciseId: string, accuracy: number, isCompleted: boolean) => {
  const { error: completionError } = await supabase
    .from('completions')
    .insert({
      user_id: asUUID(userId),
      exercise_id: asUUID(exerciseId),
      accuracy: asNumber(accuracy),
      completed: asBoolean(isCompleted)
    });

  if (completionError) {
    console.error('Error saving completion record:', completionError);
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
