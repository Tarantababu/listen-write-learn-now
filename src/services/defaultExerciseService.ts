
import { Language, Exercise } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapExerciseFromDb } from './exerciseService';
import { asUUID, asInsertObject, asUpdateObject } from '@/utils/supabaseHelpers';

/**
 * Ensures that the audio storage bucket exists
 */
export const ensureAudioBucket = async () => {
  try {
    await supabase.functions.invoke('ensure-audio-bucket');
  } catch (error) {
    console.warn('Audio bucket check failed, but this is non-blocking:', error);
  }
};

/**
 * Fetches all default exercises from Supabase
 */
export const fetchDefaultExercises = async () => {
  const { data, error } = await supabase
    .from('default_exercises')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data || [];
};

/**
 * Creates a default exercise in Supabase
 */
export const createDefaultExercise = async (
  userId: string,
  exercise: {
    title: string;
    text: string;
    language: Language;
    tags?: string[];
    audioUrl?: string;
  }
) => {
  // First ensure the audio bucket exists
  await ensureAudioBucket();

  // Fix: Use proper type casting for the insert operation
  const insertData = asInsertObject({
    title: exercise.title,
    text: exercise.text,
    language: exercise.language,
    tags: exercise.tags || [],
    audio_url: exercise.audioUrl,
    created_by: userId
  });
  
  const { data, error } = await supabase
    .from('default_exercises')
    .insert(insertData)
    .select('*')
    .single();

  if (error) throw error;

  return data;
};

/**
 * Updates a default exercise in Supabase
 */
export const updateDefaultExercise = async (
  id: string,
  updates: {
    title?: string;
    text?: string;
    language?: Language;
    tags?: string[];
    audioUrl?: string;
  }
) => {
  // Create an object with only the database fields
  const updateData: Record<string, any> = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.text !== undefined) updateData.text = updates.text;
  if (updates.language !== undefined) updateData.language = updates.language;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.audioUrl !== undefined) updateData.audio_url = updates.audioUrl;
  updateData.updated_at = new Date();
  
  // Fix: Use proper type casting for the update operation
  const typedUpdateData = asUpdateObject(updateData);

  const { error } = await supabase
    .from('default_exercises')
    .update(typedUpdateData)
    .eq('id', id);

  if (error) throw error;
};

/**
 * Checks if a default exercise is referenced by any user exercises
 */
export const checkDefaultExerciseUsage = async (id: string): Promise<number> => {
  const { count, error } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('default_exercise_id', id);

  if (error) throw error;
  
  return count || 0;
};

/**
 * Deletes a default exercise from Supabase
 * Note: This will first nullify any references in user exercises
 * to avoid foreign key constraint violations
 */
export const deleteDefaultExercise = async (id: string) => {
  // Start a transaction to handle the delete properly
  try {
    // First, check if any exercises reference this default exercise
    const referenceCount = await checkDefaultExerciseUsage(id);
    
    if (referenceCount > 0) {
      // If there are references, update all user exercises to remove the reference
      const { error: updateError } = await supabase
        .from('exercises')
        .update({ default_exercise_id: null })
        .eq('default_exercise_id', id);
      
      if (updateError) {
        console.error('Error removing references to default exercise:', updateError);
        throw updateError;
      }
      
      console.log(`Updated ${referenceCount} user exercises to remove reference to default exercise ${id}`);
    }
    
    // Now safe to delete the default exercise
    const { error } = await supabase
      .from('default_exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error in delete default exercise transaction:', error);
    throw error;
  }
};

/**
 * Maps a default exercise to a normal exercise
 */
export const mapToExercise = (defaultEx: any): Omit<Exercise, 'id' | 'createdAt' | 'completionCount' | 'isCompleted'> => ({
  title: defaultEx.title,
  text: defaultEx.text,
  language: defaultEx.language as Language,
  tags: defaultEx.tags || [],
  audioUrl: defaultEx.audio_url,
  directoryId: null,
  default_exercise_id: defaultEx.id
});

/**
 * Copies a default exercise to a user's exercise list
 */
export const copyDefaultExerciseToUser = async (defaultExerciseId: string, userId: string) => {
  // First, fetch the default exercise
  const { data: defaultExercise, error: fetchError } = await supabase
    .from('default_exercises')
    .select('*')
    .eq('id', defaultExerciseId)
    .single();

  if (fetchError) throw fetchError;

  // Then create a new exercise for the user based on the default exercise
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      title: defaultExercise.title,
      text: defaultExercise.text,
      language: defaultExercise.language,
      tags: defaultExercise.tags,
      audio_url: defaultExercise.audio_url,
      user_id: userId,
      default_exercise_id: defaultExerciseId
    })
    .select('*')
    .single();

  if (error) throw error;

  return mapExerciseFromDb(data);
};
