
import { Exercise, Language } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data?.map(mapExerciseFromDb) || [];
};

/**
 * Creates an exercise in Supabase
 */
export const createExercise = async (
  userId: string, 
  exercise: Omit<Exercise, 'id' | 'createdAt' | 'completionCount' | 'isCompleted'>
) => {
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      user_id: userId,
      title: exercise.title,
      text: exercise.text,
      language: exercise.language,
      tags: exercise.tags,
      audio_url: exercise.audioUrl,
      directory_id: exercise.directoryId
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
  const { error } = await supabase
    .from('exercises')
    .update({
      title: updates.title,
      text: updates.text,
      language: updates.language,
      tags: updates.tags,
      audio_url: updates.audioUrl,
      directory_id: updates.directoryId,
      completion_count: updates.completionCount,
      is_completed: updates.isCompleted
    })
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
  // Delete completion records associated with the exercise
  const { error } = await supabase
    .from('completions')
    .delete()
    .eq('exercise_id', exerciseId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting associated completions:', error);
    throw error;
  }
};

/**
 * Deletes an exercise from Supabase
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
  isCompleted: ex.is_completed || false
});

/**
 * Creates initial audio bucket if it doesn't exist
 */
export const ensureAudioBucket = async () => {
  try {
    await supabase.functions.invoke('create-audio-bucket', { body: {} });
  } catch (error) {
    console.error('Error creating audio bucket:', error);
  }
};
