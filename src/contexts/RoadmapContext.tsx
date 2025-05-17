
import React, { createContext, ReactNode } from 'react';

// Create an empty context with the same shape as the original
export const RoadmapContext = createContext<any>(null);

/**
 * Placeholder provider for RoadmapContext
 * This feature has been deprecated but this stub remains to prevent import errors
 */
export const RoadmapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Simply render children without any additional functionality
  return <>{children}</>;
};
