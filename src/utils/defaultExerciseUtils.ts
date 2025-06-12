
import { Exercise } from '@/types';

/**
 * Utility functions for managing default exercise limitations
 */

/**
 * Count how many default exercises a user has added to their collection
 */
export const countUserDefaultExercises = (exercises: Exercise[]): number => {
  return exercises.filter(exercise => exercise.default_exercise_id !== null).length;
};

/**
 * Check if a user can add more default exercises based on their subscription status
 */
export const canAddMoreDefaultExercises = (
  userDefaultExerciseCount: number,
  isSubscribed: boolean,
  limit: number = 10
): boolean => {
  if (isSubscribed) {
    return true; // Premium users have unlimited access
  }
  
  return userDefaultExerciseCount < limit;
};

/**
 * Get the remaining default exercises a free user can add
 */
export const getRemainingDefaultExercises = (
  userDefaultExerciseCount: number,
  isSubscribed: boolean,
  limit: number = 10
): number => {
  if (isSubscribed) {
    return Infinity; // Premium users have unlimited access
  }
  
  return Math.max(0, limit - userDefaultExerciseCount);
};
