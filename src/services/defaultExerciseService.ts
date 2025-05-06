
import { Language, Exercise } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapExerciseFromDb } from './exerciseService';

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
  const { data, error } = await supabase
    .from('default_exercises')
    .insert({
      title: exercise.title,
      text: exercise.text,
      language: exercise.language,
      tags: exercise.tags || [],
      audio_url: exercise.audioUrl,
      created_by: userId
    })
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

  const { error } = await supabase
    .from('default_exercises')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
};

/**
 * Deletes a default exercise from Supabase
 */
export const deleteDefaultExercise = async (id: string) => {
  const { error } = await supabase
    .from('default_exercises')
    .delete()
    .eq('id', id);

  if (error) throw error;
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
