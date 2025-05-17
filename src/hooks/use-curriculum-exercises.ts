
import { useMemo, useEffect, useCallback } from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { CurriculumExercise } from '@/components/curriculum/CurriculumTagGroup';

/**
 * Hook to process default exercises and map them to curriculum exercises with completion status
 */
export function useCurriculumExercises() {
  const { defaultExercises, exercises, defaultExercisesLoading, refreshExercises } = useExerciseContext();
  const { settings } = useUserSettingsContext();
  
  // Define a refresh function that can be called by components
  const refreshData = useCallback(() => {
    console.log('Refreshing curriculum exercises data...');
    // Refresh exercises data to get latest progress
    refreshExercises();
  }, [refreshExercises]);
  
  // Add an effect to refresh exercises when the component mounts
  useEffect(() => {
    // Refresh exercises data when the component mounts
    refreshData();
    // We want this to run only once when the component mounts
  }, [refreshData]);
  
  // Process exercises data to determine completion status
  const processedExercises = useMemo(() => {
    console.log('Processing curriculum exercises with:', {
      defaultExercisesCount: defaultExercises.length,
      userExercisesCount: exercises.length,
      language: settings.selectedLanguage
    });
    
    // Filter default exercises by the user's selected language
    const languageDefaultExercises = defaultExercises
      .filter(ex => ex.language === settings.selectedLanguage)
      // Sort by creation date in ascending order (oldest first)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Debug log filtered exercises
    console.log(`Found ${languageDefaultExercises.length} default exercises for language: ${settings.selectedLanguage}`);
    
    // Map default exercises to include their completion status
    return languageDefaultExercises.map(defaultEx => {
      // Find matching user exercises (by default_exercise_id)
      const matchingExercises = exercises.filter(
        userEx => userEx.default_exercise_id === defaultEx.id
      );
      
      // Log matching process for debugging
      console.log(`Default exercise ID ${defaultEx.id} has ${matchingExercises.length} matching user exercises`);
      
      if (matchingExercises.length > 0) {
        // Log the matching exercise details for debugging
        console.log('Matching exercises:', matchingExercises.map(ex => ({
          id: ex.id,
          defaultExId: ex.default_exercise_id,
          isCompleted: ex.isCompleted,
          completionCount: ex.completionCount
        })));
      }
      
      let status: 'completed' | 'in-progress' | 'not-started' = 'not-started';
      let completionCount = 0;
      
      if (matchingExercises.length > 0) {
        // Check if any matching exercise is completed
        const isCompleted = matchingExercises.some(
          ex => ex.isCompleted || ex.archived
        );
        
        if (isCompleted) {
          status = 'completed';
          completionCount = 3; // If completed, set to max
        } else {
          // If not completed but exists, it's in progress
          status = 'in-progress';
          // Get the max completion count from all matching exercises
          completionCount = Math.max(
            ...matchingExercises.map(ex => ex.completionCount || 0),
            0 // Add 0 as a fallback if no completion counts are found
          );
        }
      }
      
      // Format as CurriculumExercise
      return {
        id: defaultEx.id,
        title: defaultEx.title,
        text: defaultEx.text,
        tags: defaultEx.tags || [],
        createdAt: defaultEx.created_at,
        status,
        completionCount
      } as CurriculumExercise;
    });
  }, [defaultExercises, exercises, settings.selectedLanguage]);
  
  // Group exercises by tag
  const exercisesByTag = useMemo(() => {
    const tagMap: Record<string, CurriculumExercise[]> = {};
    
    processedExercises.forEach(exercise => {
      if (exercise.tags && exercise.tags.length > 0) {
        exercise.tags.forEach(tag => {
          if (!tagMap[tag]) {
            tagMap[tag] = [];
          }
          tagMap[tag].push(exercise);
        });
      } else {
        // Group exercises without tags under "Uncategorized"
        if (!tagMap["Uncategorized"]) {
          tagMap["Uncategorized"] = [];
        }
        tagMap["Uncategorized"].push(exercise);
      }
    });
    
    return tagMap;
  }, [processedExercises]);
  
  // Calculate overall progress statistics
  const stats = useMemo(() => {
    const completed = processedExercises.filter(ex => ex.status === 'completed').length;
    const inProgress = processedExercises.filter(ex => ex.status === 'in-progress').length;
    const total = processedExercises.length;
    
    console.log('Curriculum stats calculated:', { completed, inProgress, total });
    
    return {
      completed,
      inProgress,
      total
    };
  }, [processedExercises]);
  
  return {
    exercises: processedExercises,
    exercisesByTag,
    stats,
    loading: defaultExercisesLoading,
    selectedLanguage: settings.selectedLanguage,
    refreshData // Export the refresh function to allow manual refreshes
  };
}
