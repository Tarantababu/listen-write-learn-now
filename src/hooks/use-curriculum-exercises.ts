
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
  
  // Group exercises by tag and sort tags in a logical order
  const exercisesByTag = useMemo(() => {
    const tagMap: Record<string, CurriculumExercise[]> = {};
    
    // Define a list of common tag priorities (put beginner tags first)
    const tagPriorities: Record<string, number> = {
      "Basics": 0,
      "Beginner": 1,
      "First Words": 2,
      "Greetings": 3,
      "Introductions": 4,
      "Common Phrases": 5,
      "Daily Life": 6,
      "Intermediate": 7,
      "Advanced": 8,
      // Add more tags with priority values as needed
    };
    
    // Helper function to determine tag priority
    const getTagPriority = (tag: string): number => {
      // Check if the tag exactly matches a priority key
      if (tag in tagPriorities) return tagPriorities[tag];
      
      // Check if any priority key is part of the tag
      for (const [priorityTag, value] of Object.entries(tagPriorities)) {
        if (tag.includes(priorityTag)) return value;
      }
      
      // Default priority for unknown tags
      return 999;
    };
    
    // Group exercises by tag
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
    
    // Ensure exercises in each tag are sorted by creation date
    for (const tag in tagMap) {
      tagMap[tag].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    
    // Sort tags by priority and return as a new object
    const sortedTags = Object.keys(tagMap).sort((a, b) => {
      return getTagPriority(a) - getTagPriority(b);
    });
    
    const sortedTagMap: Record<string, CurriculumExercise[]> = {};
    sortedTags.forEach(tag => {
      sortedTagMap[tag] = tagMap[tag];
    });
    
    return sortedTagMap;
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
