
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Exercise, Language } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

interface ExerciseContextProps {
  exercises: Exercise[];
  selectedExercise: Exercise | null;
  addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt' | 'completionCount' | 'isCompleted'>) => Promise<Exercise>;
  updateExercise: (id: string, updates: Partial<Exercise>) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  selectExercise: (id: string | null) => void;
  markProgress: (id: string, accuracy: number) => Promise<void>;
  filterExercisesByLanguage: (language: Language) => Exercise[];
  moveExerciseToDirectory: (exerciseId: string, directoryId: string | null) => Promise<void>;
  loading: boolean;
}

const ExerciseContext = createContext<ExerciseContextProps | undefined>(undefined);

export const useExerciseContext = () => {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExerciseContext must be used within an ExerciseProvider');
  }
  return context;
};

export const ExerciseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  
  // Ensure audio bucket exists
  useEffect(() => {
    const createAudioBucket = async () => {
      try {
        await supabase.functions.invoke('create-audio-bucket', {
          body: {}
        });
      } catch (error) {
        console.error('Error creating audio bucket:', error);
        // Don't show error to user as this is a background operation
      }
    };
    
    createAudioBucket();
  }, []);
  
  // Load exercises from Supabase when user changes
  useEffect(() => {
    const fetchExercises = async () => {
      if (!user) {
        // If not logged in, use local storage
        const savedExercises = localStorage.getItem('exercises');
        if (savedExercises) {
          try {
            setExercises(JSON.parse(savedExercises).map((ex: any) => ({
              ...ex,
              createdAt: new Date(ex.createdAt)
            })));
          } catch (error) {
            console.error('Error parsing stored exercises:', error);
            setExercises([]);
          }
        } else {
          setExercises([]);
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setExercises(data.map(ex => ({
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
          })));
        }
      } catch (error) {
        console.error('Error fetching exercises:', error);
        toast.error('Failed to load exercises');
        setExercises([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [user]);

  // Save exercises to local storage for non-authenticated users
  useEffect(() => {
    if (!user) {
      localStorage.setItem('exercises', JSON.stringify(exercises));
    }
  }, [exercises, user]);

  const addExercise = async (exercise: Omit<Exercise, 'id' | 'createdAt' | 'completionCount' | 'isCompleted'>) => {
    try {
      if (!user) {
        // Handle non-authenticated user
        const newExercise: Exercise = {
          ...exercise,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          completionCount: 0,
          isCompleted: false
        };
        
        setExercises(prev => [newExercise, ...prev]);
        return newExercise;
      }

      // Create exercise in Supabase
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          user_id: user.id,
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

      const newExercise: Exercise = {
        id: data.id,
        title: data.title,
        text: data.text,
        language: data.language as Language,
        tags: data.tags || [],
        audioUrl: data.audio_url,
        directoryId: data.directory_id,
        createdAt: new Date(data.created_at),
        completionCount: data.completion_count || 0,
        isCompleted: data.is_completed || false
      };

      setExercises(prev => [newExercise, ...prev]);
      return newExercise;
    } catch (error: any) {
      toast.error('Failed to create exercise: ' + error.message);
      throw error;
    }
  };

  const updateExercise = async (id: string, updates: Partial<Exercise>) => {
    try {
      if (!user) {
        // Handle non-authenticated user
        setExercises(exercises.map(ex => 
          ex.id === id ? { ...ex, ...updates } : ex
        ));
        return;
      }

      // Update exercise in Supabase
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
        .eq('user_id', user.id);

      if (error) throw error;

      setExercises(exercises.map(ex => 
        ex.id === id ? { ...ex, ...updates } : ex
      ));
      
      // Update selected exercise if it's the one being updated
      if (selectedExercise?.id === id) {
        setSelectedExercise(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error: any) {
      toast.error('Failed to update exercise: ' + error.message);
      throw error;
    }
  };

  const deleteExercise = async (id: string) => {
    try {
      if (!user) {
        // Handle non-authenticated user
        setExercises(exercises.filter(ex => ex.id !== id));
        if (selectedExercise?.id === id) {
          setSelectedExercise(null);
        }
        return;
      }

      // Delete exercise from Supabase
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setExercises(exercises.filter(ex => ex.id !== id));
      if (selectedExercise?.id === id) {
        setSelectedExercise(null);
      }
    } catch (error: any) {
      toast.error('Failed to delete exercise: ' + error.message);
      throw error;
    }
  };

  const selectExercise = (id: string | null) => {
    if (!id) {
      setSelectedExercise(null);
      return;
    }
    
    const exercise = exercises.find(ex => ex.id === id);
    setSelectedExercise(exercise || null);
  };

  const markProgress = async (id: string, accuracy: number) => {
    try {
      const exercise = exercises.find(ex => ex.id === id);
      if (!exercise) return;

      // Calculate new completion count and status
      let newCompletionCount = exercise.completionCount;
      let isCompleted = exercise.isCompleted;

      // If accuracy is > 95%, increment completion count
      if (accuracy >= 95) {
        newCompletionCount += 1;
        // Mark as completed if they've achieved >95% accuracy three times
        isCompleted = newCompletionCount >= 3;
      }

      // Update locally
      const updatedExercise = {
        ...exercise,
        completionCount: newCompletionCount,
        isCompleted
      };

      // Update in Supabase if authenticated
      if (user) {
        const { error } = await supabase
          .from('exercises')
          .update({
            completion_count: newCompletionCount,
            is_completed: isCompleted
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Also save completion record
        const { error: completionError } = await supabase
          .from('completions')
          .insert({
            user_id: user.id,
            exercise_id: id,
            attempt_count: exercise.completionCount + 1,
            completed: isCompleted,
            accuracy: accuracy
          });

        if (completionError) console.error('Error saving completion record:', completionError);
      }

      // Update state
      setExercises(exercises.map(ex => 
        ex.id === id ? updatedExercise : ex
      ));

      // Update selected exercise if needed
      if (selectedExercise?.id === id) {
        setSelectedExercise(updatedExercise);
      }
    } catch (error: any) {
      toast.error('Failed to update progress: ' + error.message);
      throw error;
    }
  };

  const moveExerciseToDirectory = async (exerciseId: string, directoryId: string | null) => {
    try {
      const exercise = exercises.find(ex => ex.id === exerciseId);
      if (!exercise) return;

      if (!user) {
        // Handle non-authenticated user
        setExercises(exercises.map(ex => 
          ex.id === exerciseId ? { ...ex, directoryId } : ex
        ));
        return;
      }

      // Update in Supabase
      const { error } = await supabase
        .from('exercises')
        .update({ directory_id: directoryId })
        .eq('id', exerciseId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setExercises(exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, directoryId } : ex
      ));
      
      toast.success('Exercise moved successfully');

    } catch (error: any) {
      toast.error('Failed to move exercise: ' + error.message);
      throw error;
    }
  };

  const filterExercisesByLanguage = (language: Language) => {
    return exercises.filter(ex => ex.language === language);
  };

  const value = {
    exercises,
    selectedExercise,
    addExercise,
    updateExercise,
    deleteExercise,
    selectExercise,
    markProgress,
    filterExercisesByLanguage,
    moveExerciseToDirectory,
    loading
  };

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
};
