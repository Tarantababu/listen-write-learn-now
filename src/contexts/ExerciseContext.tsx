import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Exercise, Language } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchExercises,
  createExercise, 
  updateExercise as updateExerciseInDb, 
  deleteExercise as deleteExerciseFromDb,
  archiveExercise as archiveExerciseInDb,
  recordCompletion,
  ensureAudioBucket,
  deleteAssociatedVocabulary,
  deleteAssociatedCompletions
} from '@/services/exerciseService';
import { fetchDefaultExercises, copyDefaultExerciseToUser, mapToExercise } from '@/services/defaultExerciseService';
import { useLocalExercises } from '@/hooks/useLocalExercises';

interface ExerciseContextType {
  exercises: Exercise[];
  selectedExercise: Exercise | null;
  defaultExercises: any[];
  addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt' | 'completionCount' | 'isCompleted'>) => Promise<Exercise>;
  updateExercise: (id: string, updates: Partial<Exercise>) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  selectExercise: (id: string | null) => void;
  markProgress: (id: string, accuracy: number, reset?: boolean) => Promise<void>;
  filterExercisesByLanguage: (language: Language) => Exercise[];
  moveExerciseToDirectory: (exerciseId: string, directoryId: string | null) => Promise<void>;
  copyDefaultExercise: (defaultExerciseId: string) => Promise<Exercise>;
  hasReadingAnalysis: (exerciseId: string) => Promise<boolean>;
  loading: boolean;
  defaultExercisesLoading: boolean;
  canCreateMore: boolean;
  canEdit: boolean;
  exerciseLimit: number;
  refreshExercises: () => Promise<void>;
}

const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined);

export const useExerciseContext = () => {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExerciseContext must be used within an ExerciseProvider');
  }
  return context;
};

export const ExerciseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [defaultExercises, setDefaultExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultExercisesLoading, setDefaultExercisesLoading] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const { user } = useAuth();
  const localExercises = useLocalExercises();
  const { subscription } = useSubscription();
  
  // Define the exercise limit for non-premium users - updated to 3
  const exerciseLimit = 3;
  
  // Determine if user can create more exercises
  const canCreateMore = subscription.isSubscribed || exercises.length < exerciseLimit;
  
  // Determine if user can edit exercises (only premium users can)
  const canEdit = subscription.isSubscribed;

  // Ensure audio bucket exists
  useEffect(() => {
    ensureAudioBucket();
  }, []);
  
  // Load exercises from Supabase when user changes
  useEffect(() => {
    const loadExercises = async () => {
      if (!user) {
        // If not logged in, use local storage via the hook
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchExercises(user.id);
        setExercises(data);
      } catch (error) {
        console.error('Error fetching exercises:', error);
        toast.error('Failed to load exercises');
        setExercises([]);
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, [user]);

  // Load default exercises
  useEffect(() => {
    const loadDefaultExercises = async () => {
      try {
        setDefaultExercisesLoading(true);
        const data = await fetchDefaultExercises();
        setDefaultExercises(data);
      } catch (error) {
        console.error('Error fetching default exercises:', error);
        toast.error('Failed to load default exercises');
        setDefaultExercises([]);
      } finally {
        setDefaultExercisesLoading(false);
      }
    };

    loadDefaultExercises();
  }, []);

  // For non-authenticated users, use the local exercises
  useEffect(() => {
    if (!user) {
      setExercises(localExercises.exercises);
    }
  }, [user, localExercises.exercises]);

  const addExercise = async (exercise: Omit<Exercise, 'id' | 'createdAt' | 'completionCount' | 'isCompleted'>) => {
    if (!canCreateMore) {
      toast.error(`You've reached the limit of ${exerciseLimit} exercises. Upgrade to premium for unlimited exercises.`);
      throw new Error('Exercise limit reached');
    }
    
    try {
      if (!user) {
        // Handle non-authenticated user
        return localExercises.addExercise(exercise);
      }

      // Create exercise in Supabase
      const newExercise = await createExercise(user.id, exercise);
      setExercises(prev => [newExercise, ...prev]);
      return newExercise;
    } catch (error: any) {
      toast.error('Failed to create exercise: ' + error.message);
      throw error;
    }
  };

  const updateExercise = async (id: string, updates: Partial<Exercise>) => {
    // Check if user has edit permission
    if (!canEdit && user) {
      toast.error('Upgrade to premium to edit exercises.');
      throw new Error('Premium subscription required to edit exercises');
    }
    
    try {
      if (!user) {
        // Handle non-authenticated user
        localExercises.updateExercise(id, updates);
        return;
      }

      // Update exercise in Supabase
      await updateExerciseInDb(user.id, id, updates);

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
        localExercises.deleteExercise(id);
        if (selectedExercise?.id === id) {
          setSelectedExercise(null);
        }
        return;
      }

      // Instead of attempting to delete, archive the exercise
      await archiveExerciseInDb(user.id, id);

      setExercises(exercises.filter(ex => ex.id !== id));
      if (selectedExercise?.id === id) {
        setSelectedExercise(null);
      }
    } catch (error: any) {
      toast.error('Failed to archive exercise: ' + error.message);
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

  const markProgress = async (id: string, accuracy: number, reset: boolean = false) => {
    try {
      const exercise = exercises.find(ex => ex.id === id);
      if (!exercise) return;

      // Calculate new completion count and status
      let newCompletionCount = exercise.completionCount;
      let isCompleted = exercise.isCompleted;

      // If reset is true, force completion count to 0
      if (reset) {
        newCompletionCount = 0;
        isCompleted = false;
      } 
      // Otherwise handle normal progress update
      else if (accuracy >= 95) {
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
        await updateExerciseInDb(user.id, id, {
          completionCount: newCompletionCount,
          isCompleted
        });

        // Only save completion record if not resetting
        if (!reset && accuracy > 0) {
          await recordCompletion(user.id, id, accuracy, isCompleted);
        }
      } else {
        // Fix: Check if the hook's markProgress supports the reset parameter
        // If not, handle reset manually
        if (reset) {
          // For reset, just pass 0 as accuracy
          localExercises.markProgress(id, 0);
        } else {
          localExercises.markProgress(id, accuracy);
        }
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
      // Instead of calling updateExercise (which checks for premium subscription),
      // implement directory movement logic directly here
      const exercise = exercises.find(ex => ex.id === exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }

      if (!user) {
        // Handle non-authenticated user
        localExercises.updateExercise(exerciseId, { directoryId });
      } else {
        // Update directly in the database without premium check
        await updateExerciseInDb(user.id, exerciseId, { directoryId });
      }

      // Update the state
      setExercises(exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, directoryId } : ex
      ));
      
      // Update selected exercise if it's the one being moved
      if (selectedExercise?.id === exerciseId) {
        setSelectedExercise(prev => prev ? { ...prev, directoryId } : null);
      }
      
      toast.success('Exercise moved successfully');
    } catch (error: any) {
      toast.error('Failed to move exercise: ' + error.message);
      throw error;
    }
  };

  const copyDefaultExercise = async (defaultExerciseId: string) => {
    if (!user) {
      toast.error('You need to be logged in to copy default exercises');
      throw new Error('Authentication required');
    }
    
    try {
      const newExercise = await copyDefaultExerciseToUser(defaultExerciseId, user.id);
      setExercises(prev => [newExercise, ...prev]);
      toast.success('Default exercise copied to your exercises');
      return newExercise;
    } catch (error: any) {
      toast.error('Failed to copy default exercise: ' + error.message);
      throw error;
    }
  };

  const filterExercisesByLanguage = (language: Language) => {
    return exercises.filter(ex => ex.language === language);
  };

  // Add a new function to check if an exercise has a reading analysis
  const hasReadingAnalysis = async (exerciseId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error, count } = await supabase
        .from('reading_analyses')
        .select('id', { count: 'exact' })
        .eq('exercise_id', exerciseId)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error checking reading analysis:', error);
        return false;
      }
      
      return count ? count > 0 : false;
    } catch (error) {
      console.error('Error in hasReadingAnalysis:', error);
      return false;
    }
  };

  /**
   * Refresh exercises data - allows components to force a refresh
   */
  const refreshExercises = useCallback(async () => {
    if (user) {
      setLoadingExercises(true);
      try {
        const fetchedExercises = await fetchExercises(user.id);
        setExercises(fetchedExercises);
      } catch (error) {
        console.error('Error refreshing exercises:', error);
      } finally {
        setLoadingExercises(false);
      }
    }
  }, [user]);

  const value = {
    exercises,
    selectedExercise,
    defaultExercises,
    addExercise,
    updateExercise,
    deleteExercise,
    selectExercise,
    markProgress,
    filterExercisesByLanguage,
    moveExerciseToDirectory,
    copyDefaultExercise,
    hasReadingAnalysis,
    loading,
    defaultExercisesLoading,
    canCreateMore,
    canEdit,
    exerciseLimit,
    refreshExercises,
  };

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
};
