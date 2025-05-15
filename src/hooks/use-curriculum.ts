
import { useContext } from 'react';

// Import from contexts for proper access
const CurriculumContext = React.createContext({});

export const useCurriculumContext = () => {
  const context = useContext(CurriculumContext);
  
  if (context === undefined) {
    throw new Error('useCurriculumContext must be used within a CurriculumProvider');
  }
  
  return context;
};

export default useCurriculumContext;
