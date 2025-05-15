
import { useContext } from 'react';
import { CurriculumPathContext } from '@/contexts/CurriculumPathContext';

export const useCurriculumPath = () => {
  const context = useContext(CurriculumPathContext);
  if (context === undefined) {
    throw new Error('useCurriculumPath must be used within a CurriculumPathProvider');
  }
  return context;
};
