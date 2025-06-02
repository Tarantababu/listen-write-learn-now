
import { supabase } from '@/integrations/supabase/client';
import type { Language, LanguageLevel } from '@/types';

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
}

export const defaultExerciseService = DefaultExerciseService.getInstance();
