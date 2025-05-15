
import { useContext } from 'react';
import { CurriculumContext } from '@/contexts/CurriculumContext';

export const useCurriculum = () => {
  const context = useContext(CurriculumContext);
  if (context === undefined) {
    throw new Error('useCurriculum must be used within a CurriculumProvider');
  }
  return context;
};
