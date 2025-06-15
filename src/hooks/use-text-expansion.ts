
import { useState, useCallback } from 'react';

export const useTextExpansion = (initialExpanded = false) => {
  const [isTextExpanded, setIsTextExpanded] = useState(initialExpanded);

  const toggleTextExpansion = useCallback(() => {
    setIsTextExpanded(prev => !prev);
  }, []);

  const expandText = useCallback(() => {
    setIsTextExpanded(true);
  }, []);

  const collapseText = useCallback(() => {
    setIsTextExpanded(false);
  }, []);

  return {
    isTextExpanded,
    toggleTextExpansion,
    expandText,
    collapseText
  };
};
