
import { useContext } from 'react';
import React from 'react';

// Import from contexts for proper access
// Since CurriculumContext doesn't exist, we'll create a placeholder
// This should be replaced with the actual context when it's implemented
const CurriculumContext = React.createContext({});

export const useCurriculumContext = () => {
  const context = useContext(CurriculumContext);
  
  if (context === undefined) {
    throw new Error('useCurriculumContext must be used within a CurriculumProvider');
  }
  
  return context;
};
