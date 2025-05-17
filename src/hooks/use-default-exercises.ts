
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Language, LanguageLevel } from '@/types';

export type DefaultExercise = {
  id: string;
  title: string;
  text: string;
  language: Language;
  level: LanguageLevel;
  audioUrl?: string;
  tags?: string[];
  completionCount?: number;
  isCompleted?: boolean;
}

export function useDefaultExercises() {
  const [isLoading, setIsLoading] = useState(false);
  const [defaultExercises, setDefaultExercises] = useState<DefaultExercise[]>([]);
  const { user } = useAuth();

  // Fetch default exercises with optional language filter
  const fetchDefaultExercises = useCallback(async (language?: Language) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('default_exercises')
        .select('*')
        .order('level')
        .order('title');

      if (language) {
        query = query.eq('language', language);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (user) {
        // For logged-in users, check completion status
        const { data: completionData, error: completionError } = await supabase
          .from('exercises')
          .select('default_exercise_id, completion_count, is_completed')
          .eq('user_id', user.id)
          .not('default_exercise_id', 'is', null);

        if (completionError) {
          console.error('Error fetching completion data:', completionError);
        }

        const completionMap: Record<string, { count: number, completed: boolean }> = {};
        
        if (completionData) {
          completionData.forEach((item) => {
            if (item.default_exercise_id) {
              completionMap[item.default_exercise_id] = {
                count: item.completion_count || 0,
                completed: item.is_completed || false
              };
            }
          });
        }

        // Format the default exercises with completion status
        const formattedExercises = data?.map((exercise) => ({
          id: exercise.id,
          title: exercise.title,
          text: exercise.text,
          language: exercise.language,
          level: exercise.level || 'A1',
          audioUrl: exercise.audio_url,
          tags: exercise.tags,
          completionCount: completionMap[exercise.id]?.count || 0,
          isCompleted: completionMap[exercise.id]?.completed || false
        })) || [];

        setDefaultExercises(formattedExercises);
      } else {
        // For non logged-in users, just format the exercises
        const formattedExercises = data?.map((exercise) => ({
          id: exercise.id,
          title: exercise.title,
          text: exercise.text,
          language: exercise.language,
          level: exercise.level || 'A1',
          audioUrl: exercise.audio_url,
          tags: exercise.tags
        })) || [];

        setDefaultExercises(formattedExercises);
      }
    } catch (error) {
      console.error('Error loading default exercises:', error);
      toast({
        title: 'Error',
        description: 'Failed to load default exercises',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Add a default exercise to user's exercises
  const addToMyExercises = useCallback(async (defaultExerciseId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to add exercises to your collection',
        variant: 'destructive',
      });
      return null;
    }

    try {
      // Get the default exercise details
      const { data: defaultExercise, error: fetchError } = await supabase
        .from('default_exercises')
        .select('*')
        .eq('id', defaultExerciseId)
        .single();

      if (fetchError) throw fetchError;

      // Check if user already has this exercise
      const { data: existingExercise, error: checkError } = await supabase
        .from('exercises')
        .select('id')
        .eq('user_id', user.id)
        .eq('default_exercise_id', defaultExerciseId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingExercise) {
        toast({
          title: 'Already Added',
          description: 'This exercise is already in your collection',
        });
        return existingExercise.id;
      }

      // Add to user's exercises
      const { data: newExercise, error: insertError } = await supabase
        .from('exercises')
        .insert({
          user_id: user.id,
          title: defaultExercise.title,
          text: defaultExercise.text,
          language: defaultExercise.language,
          audio_url: defaultExercise.audio_url,
          tags: defaultExercise.tags,
          default_exercise_id: defaultExerciseId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: 'Exercise Added',
        description: 'Exercise has been added to your collection',
      });

      return newExercise.id;
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast({
        title: 'Error',
        description: 'Failed to add exercise to your collection',
        variant: 'destructive',
      });
      return null;
    }
  }, [user]);

  // Mark exercise as completed
  const markExerciseCompleted = useCallback(async (defaultExerciseId: string, accuracy: number) => {
    if (!user) return;

    try {
      // Check if user has this exercise
      const { data: existingExercise, error: checkError } = await supabase
        .from('exercises')
        .select('id, completion_count')
        .eq('user_id', user.id)
        .eq('default_exercise_id', defaultExerciseId)
        .maybeSingle();

      if (checkError) throw checkError;

      let exerciseId = existingExercise?.id;

      // If not found, add it first
      if (!exerciseId) {
        exerciseId = await addToMyExercises(defaultExerciseId);
        if (!exerciseId) return;
      }

      // Update completion count and status
      const newCompletionCount = (existingExercise?.completion_count || 0) + 1;
      const isCompleted = accuracy >= 95 || newCompletionCount >= 3;

      const { error: updateError } = await supabase
        .from('exercises')
        .update({
          completion_count: newCompletionCount,
          is_completed: isCompleted,
          updated_at: new Date().toISOString()
        })
        .eq('id', exerciseId);

      if (updateError) throw updateError;

      // Refresh exercises to update UI
      fetchDefaultExercises();
    } catch (error) {
      console.error('Error marking exercise as completed:', error);
    }
  }, [user, fetchDefaultExercises, addToMyExercises]);

  return {
    defaultExercises,
    isLoading,
    fetchDefaultExercises,
    addToMyExercises,
    markExerciseCompleted
  };
}
