import { useState, useEffect } from 'react';
import { Exercise } from '@/types';

/**
 * Hook to manage exercises in local storage for non-authenticated users
 */
export const useLocalExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
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
  }, []);

  // Save to localStorage when exercises change
  useEffect(() => {
    localStorage.setItem('exercises', JSON.stringify(exercises));
  }, [exercises]);

  const addExercise = (exercise: Omit<Exercise, 'id' | 'createdAt' | 'completionCount' | 'isCompleted'>) => {
    const newExercise: Exercise = {
      ...exercise,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      completionCount: 0,
      isCompleted: false
    };
    
    setExercises(prev => [newExercise, ...prev]);
    return newExercise;
  };

  const updateExercise = (id: string, updates: Partial<Exercise>) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, ...updates } : ex
    ));
  };

  const deleteExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const markProgress = (id: string, accuracy: number) => {
    const exercise = exercises.find(ex => ex.id === id);
    if (!exercise) return;

    // If accuracy is 0, it means we're resetting progress
    if (accuracy === 0) {
      updateExercise(id, {
        completionCount: 0,
        isCompleted: false
      });
      return;
    }

    // Otherwise, handle normal progress tracking
    let newCompletionCount = exercise.completionCount;
    let isCompleted = exercise.isCompleted;

    // If accuracy is > 95%, increment completion count
    if (accuracy >= 95) {
      newCompletionCount += 1;
      // Mark as completed if they've achieved >95% accuracy three times
      isCompleted = newCompletionCount >= 3;
    }

    updateExercise(id, {
      completionCount: newCompletionCount,
      isCompleted
    });
  };

  // New method to reset progress for all exercises of a specific language
  const resetLanguageProgress = (language: string) => {
    const updatedExercises = exercises.map(exercise => 
      exercise.language === language 
        ? { ...exercise, completionCount: 0, isCompleted: false }
        : exercise
    );
    
    setExercises(updatedExercises);
  };

  return {
    exercises,
    addExercise,
    updateExercise,
    deleteExercise,
    markProgress,
    resetLanguageProgress
  };
};
