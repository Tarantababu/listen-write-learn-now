
import { useContext } from 'react';
import { CurriculumContext } from '@/contexts/CurriculumContext';

export const useCurriculumContext = () => {
  const context = useContext(CurriculumContext);
  
  if (context === undefined) {
    throw new Error('useCurriculumContext must be used within a CurriculumProvider');
  }
  
  return context;
};

export default useCurriculumContext;
