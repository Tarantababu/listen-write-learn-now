
// Re-export the hook from the main codebase
import { useRoadmap } from '@/hooks/use-roadmap';
import { Language } from '@/types';

// Import the type definition from the source file directly
import type { UnifiedRoadmapContextType } from '@/hooks/use-roadmap';

export { 
  useRoadmap,
  type UnifiedRoadmapContextType,
  type Language
};
