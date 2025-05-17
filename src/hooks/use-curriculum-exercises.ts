
import { useMemo } from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { CurriculumExercise } from '@/components/curriculum/CurriculumTagGroup';

/**
 * Hook to process default exercises and map them to curriculum exercises with completion status
 */
export function useCurriculumExercises() {
  const { defaultExercises, exercises, defaultExercisesLoading } = useExerciseContext();
  const { settings } = useUserSettingsContext();
  
  // Process exercises data to determine completion status
  const processedExercises = useMemo(() => {
    // Filter default exercises by the user's selected language
    const languageDefaultExercises = defaultExercises
      .filter(ex => ex.language === settings.selectedLanguage)
      // Sort by creation date in ascending order (oldest first)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // Map default exercises to include their completion status
    return languageDefaultExercises.map(defaultEx => {
      // Find matching user exercises (by default_exercise_id)
      const matchingExercises = exercises.filter(
        userEx => userEx.default_exercise_id === defaultEx.id
      );
      
      let status: 'completed' | 'in-progress' | 'not-started' = 'not-started';
      let completionCount = 0;
      
      if (matchingExercises.length > 0) {
        // Check if any matching exercise is completed or archived
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
            ...matchingExercises.map(ex => ex.completionCount || 0)
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
    selectedLanguage: settings.selectedLanguage
  };
}
