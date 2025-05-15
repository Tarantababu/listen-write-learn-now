
import { useContext } from 'react';
import { CurriculumContext } from '@/contexts/CurriculumContext';
import type { CurriculumContextType } from '@/types';

/**
 * Custom hook to access the CurriculumContext with proper type-checking
 * Optimized to prevent unnecessary re-renders
 */
export const useCurriculum = (): CurriculumContextType => {
  const context = useContext(CurriculumContext);
  if (context === undefined) {
    throw new Error('useCurriculum must be used within a CurriculumProvider');
  }
  return context;
};

// Add a renamed export for backward compatibility 
export const useCurriculumContext = useCurriculum;
