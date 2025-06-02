
import { supabase } from '@/integrations/supabase/client';
import type { Language, LanguageLevel, Exercise } from '@/types';

interface CreateDefaultExerciseData {
  title: string;
  text: string;
  language: Language;
  level: LanguageLevel;
  tags: string;
  audioUrl: string;
}

class DefaultExerciseService {
  private static instance: DefaultExerciseService;

  static getInstance(): DefaultExerciseService {
    if (!DefaultExerciseService.instance) {
      DefaultExerciseService.instance = new DefaultExerciseService();
    }
    return DefaultExerciseService.instance;
  }

  async createDefaultExercise(data: CreateDefaultExerciseData) {
    const tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    const { data: exercise, error } = await supabase
      .from('default_exercises')
      .insert({
        title: data.title,
        text: data.text,
        language: data.language,
        level: data.level,
        tags: tagsArray,
        audio_url: data.audioUrl
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return exercise;
  }

  async getDefaultExercises() {
    const { data, error } = await supabase
      .from('default_exercises')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  async fetchDefaultExercises() {
    return this.getDefaultExercises();
  }

  async deleteDefaultExercise(exerciseId: string) {
    // First, update any user exercises that reference this default exercise
    const { error: updateError } = await supabase
      .from('exercises')
      .update({ default_exercise_id: null })
      .eq('default_exercise_id', exerciseId);

    if (updateError) {
      throw updateError;
    }

    // Then delete the default exercise
    const { error } = await supabase
      .from('default_exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) {
      throw error;
    }
  }

  async checkDefaultExerciseUsage(exerciseId: string): Promise<number> {
    const { count, error } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('default_exercise_id', exerciseId);

    if (error) {
      throw error;
    }

    return count || 0;
  }

  async copyDefaultExerciseToUser(defaultExerciseId: string, userId: string): Promise<Exercise> {
    // First get the default exercise
    const { data: defaultExercise, error: fetchError } = await supabase
      .from('default_exercises')
      .select('*')
      .eq('id', defaultExerciseId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Create a new user exercise based on the default exercise
    const { data: userExercise, error: createError } = await supabase
      .from('exercises')
      .insert({
        title: defaultExercise.title,
        text: defaultExercise.text,
        language: defaultExercise.language,
        tags: defaultExercise.tags || [],
        audio_url: defaultExercise.audio_url,
        user_id: userId,
        default_exercise_id: defaultExerciseId
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return this.mapToExercise(userExercise);
  }

  mapToExercise(dbExercise: any): Exercise {
    return {
      id: dbExercise.id,
      title: dbExercise.title,
      text: dbExercise.text,
      language: dbExercise.language,
      tags: dbExercise.tags || [],
      audioUrl: dbExercise.audio_url,
      createdAt: dbExercise.created_at,
      completionCount: dbExercise.completion_count || 0,
      isCompleted: dbExercise.is_completed || false,
      directoryId: dbExercise.directory_id,
      default_exercise_id: dbExercise.default_exercise_id,
      archived: dbExercise.archived || false
    };
  }
}

export const defaultExerciseService = DefaultExerciseService.getInstance();

// Export the individual functions
export const fetchDefaultExercises = () => defaultExerciseService.fetchDefaultExercises();
export const deleteDefaultExercise = (id: string) => defaultExerciseService.deleteDefaultExercise(id);
export const checkDefaultExerciseUsage = (id: string) => defaultExerciseService.checkDefaultExerciseUsage(id);
export const copyDefaultExerciseToUser = (defaultId: string, userId: string) => defaultExerciseService.copyDefaultExerciseToUser(defaultId, userId);
export const mapToExercise = (dbExercise: any) => defaultExerciseService.mapToExercise(dbExercise);
