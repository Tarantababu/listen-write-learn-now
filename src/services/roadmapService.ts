
import { supabase } from '@/integrations/supabase/client';
import type { Roadmap, RoadmapNode, RoadmapLanguage } from '@/types/roadmap';

export const fetchRoadmaps = async (): Promise<Roadmap[]> => {
  // This is a stub function that will be called but return an empty array
  // since the roadmap tables no longer exist
  console.warn('fetchRoadmaps called but roadmap feature has been removed');
  return [];
};

export const fetchRoadmapNodes = async (roadmapId: string): Promise<RoadmapNode[]> => {
  // Stub function
  console.warn('fetchRoadmapNodes called but roadmap feature has been removed');
  return [];
};

export const fetchRoadmapLanguages = async (): Promise<RoadmapLanguage[]> => {
  // Stub function
  console.warn('fetchRoadmapLanguages called but roadmap feature has been removed');
  return [];
};

export const createRoadmap = async (roadmap: Partial<Roadmap>): Promise<Roadmap | null> => {
  // Stub function
  console.warn('createRoadmap called but roadmap feature has been removed');
  return null;
};

export const updateRoadmap = async (id: string, updates: Partial<Roadmap>): Promise<void> => {
  // Stub function
  console.warn('updateRoadmap called but roadmap feature has been removed');
};

export const deleteRoadmap = async (id: string): Promise<void> => {
  // Stub function
  console.warn('deleteRoadmap called but roadmap feature has been removed');
};

export const createRoadmapNode = async (node: Partial<RoadmapNode>): Promise<RoadmapNode | null> => {
  // Stub function
  console.warn('createRoadmapNode called but roadmap feature has been removed');
  return null;
};

export const updateRoadmapNode = async (id: string, updates: Partial<RoadmapNode>): Promise<void> => {
  // Stub function
  console.warn('updateRoadmapNode called but roadmap feature has been removed');
};

export const deleteRoadmapNode = async (id: string): Promise<void> => {
  // Stub function
  console.warn('deleteRoadmapNode called but roadmap feature has been removed');
};
