import React, { createContext, useContext, useState, useEffect } from 'react';
import { Exercise, Language } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
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
import { useLocalExercises } from '@/hooks/useLocalExercises';

// Free user limits
const FREE_USER_EXERCISE_LIMIT = 3;

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
  const localExercises = useLocalExercises();
  const { subscription } = useSubscription();
  
  // Check if user has premium subscription
  const isPremium = subscription.isSubscribed && subscription.subscriptionTier === 'premium';
  
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

  // For non-authenticated users, use the local exercises
  useEffect(() => {
    if (!user) {
      setExercises(localExercises.exercises);
    }
  }, [user, localExercises.exercises]);

  const addExercise = async (exercise: Omit<Exercise, 'id' | 'createdAt' | 'completionCount' | 'isCompleted'>) => {
    try {
      // Check if user has reached their exercise limit (include deleted/archived exercises)
      if (!isPremium && exercises.length >= FREE_USER_EXERCISE_LIMIT) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span>You've reached the maximum number of exercises (3) for free accounts.</span>
            <span>Upgrade to premium for unlimited exercises.</span>
          </div>
        );
        throw new Error("Exercise limit reached");
      }

      if (!user) {
        // Handle non-authenticated user
        return localExercises.addExercise(exercise);
      }

      // Create exercise in Supabase
      const newExercise = await createExercise(user.id, exercise);
      setExercises(prev => [newExercise, ...prev]);
      return newExercise;
    } catch (error: any) {
      if (error.message !== "Exercise limit reached") {
        toast.error('Failed to create exercise: ' + error.message);
      }
      throw error;
    }
  };

  const updateExercise = async (id: string, updates: Partial<Exercise>) => {
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
        await updateExerciseInDb(user.id, id, {
          completionCount: newCompletionCount,
          isCompleted
        });

        // Also save completion record
        await recordCompletion(user.id, id, accuracy, isCompleted);
      } else {
        localExercises.markProgress(id, accuracy);
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
      await updateExercise(exerciseId, { directoryId });
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
