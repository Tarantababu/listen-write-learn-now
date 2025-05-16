
import { useContext } from 'react';
import { RoadmapContext, useRoadmap as useRoadmapFromContext } from '@/features/roadmap/context/RoadmapContext';

/**
 * Custom hook to access the curriculum context
 * Note: This was previously called "roadmap" but refers to the same feature
 */
export const useRoadmap = useRoadmapFromContext;

/**
 * Alias for useRoadmap to support new terminology
 */
export const useCurriculum = useRoadmap;
