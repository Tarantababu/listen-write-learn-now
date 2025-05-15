
import { useContext } from 'react';
import { CurriculumPathContext } from '@/contexts/CurriculumPathContext';
import type { CurriculumContextType } from '@/types';

/**
 * Custom hook to access the curriculum path context
 */
export const useCurriculumPath = (): CurriculumContextType => {
  const context = useContext(CurriculumPathContext);
  
  if (context === undefined) {
    throw new Error('useCurriculumPath must be used within a CurriculumPathProvider');
  }
  
  return context;
};
