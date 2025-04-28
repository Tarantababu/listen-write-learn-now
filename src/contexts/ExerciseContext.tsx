
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Exercise, Language } from '@/types';

interface ExerciseContextProps {
  exercises: Exercise[];
  selectedExercise: Exercise | null;
  addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt' | 'completionCount' | 'isCompleted'>) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  selectExercise: (id: string | null) => void;
  markProgress: (id: string, accuracy: number) => void;
  filterExercisesByLanguage: (language: Language) => Exercise[];
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
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const savedExercises = localStorage.getItem('exercises');
    return savedExercises 
      ? JSON.parse(savedExercises).map((ex: any) => ({
          ...ex,
          createdAt: new Date(ex.createdAt)
        })) 
      : [];
  });
  
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

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
    
    setExercises([...exercises, newExercise]);
    
    // Here we would typically generate audio using the ChatGPT API
    // For now, we'll mock this functionality
    console.log(`Audio would be generated for: ${newExercise.text}`);
    
    return newExercise;
  };

  const updateExercise = (id: string, updates: Partial<Exercise>) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, ...updates } : ex
    ));
  };

  const deleteExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
    if (selectedExercise?.id === id) {
      setSelectedExercise(null);
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

  const markProgress = (id: string, accuracy: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === id) {
        // If accuracy is > 95%, increment completion count
        if (accuracy >= 95) {
          const newCompletionCount = ex.completionCount + 1;
          // Mark as completed if they've achieved >95% accuracy three times
          return {
            ...ex,
            completionCount: newCompletionCount,
            isCompleted: newCompletionCount >= 3
          };
        }
        return ex;
      }
      return ex;
    }));
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
    filterExercisesByLanguage
  };

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
};
