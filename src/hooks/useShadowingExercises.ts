
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShadowingExercise {
  id: string;
  title: string;
  language: string;
  difficulty_level: string;
  source_type: string;
  source_reading_exercise_id?: string;
  custom_text?: string;
  sentences: any[];
  created_at: string;
  updated_at: string;
  archived: boolean;
}

export const useShadowingExercises = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<ShadowingExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExercises = useCallback(async () => {
    if (!user) {
      setExercises([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('shadowing_exercises')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching shadowing exercises:', error);
      toast.error('Failed to load shadowing exercises');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createExercise = async (exerciseData: Omit<ShadowingExercise, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('shadowing_exercises')
      .insert({
        ...exerciseData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateProgress = async (exerciseId: string, sentenceIndex: number, totalSentences: number) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.rpc('update_shadowing_progress', {
      exercise_id_param: exerciseId,
      user_id_param: user.id,
      sentence_index_param: sentenceIndex,
      total_sentences_param: totalSentences,
    });

    if (error) throw error;
  };

  const refreshExercises = useCallback(() => {
    fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  return {
    exercises,
    loading,
    createExercise,
    updateProgress,
    refreshExercises,
  };
};
