
// Create a stub version of the roadmap service to fix build errors
// In a real implementation, this would contain actual API calls to fetch roadmap data

import { supabase } from '@/integrations/supabase/client';
import { RoadmapNode, Roadmap } from '@/types';

export async function getRoadmapsByLanguage(language: string): Promise<Roadmap[]> {
  try {
    // Instead of calling a non-existent function, use a direct query
    const { data, error } = await supabase
      .from('curricula') // Use an existing table instead of 'roadmaps'
      .select('*')
      .eq('language', language);

    if (error) throw error;

    // Map to the expected format
    return (data || []).map((item) => ({
      id: item.id,
      name: item.name || '',
      description: item.description || '',
      level: item.level || 'A1',
      createdAt: item.created_at,
      languageId: item.language
    }));
  } catch (error) {
    console.error('Error getting roadmaps:', error);
    return [];
  }
}

export async function getUserRoadmapsByLanguage(language: string): Promise<Roadmap[]> {
  try {
    // Use an existing table instead of a non-existent function
    const { data, error } = await supabase
      .from('user_curricula')
      .select('curricula(*)')
      .eq('curricula.language', language);

    if (error) throw error;

    // Map to the expected format
    return (data || []).map((item) => {
      const curriculum = item.curricula;
      return {
        id: curriculum.id,
        name: curriculum.name || '',
        description: curriculum.description || '',
        level: curriculum.level || 'A1',
        createdAt: curriculum.created_at,
        languageId: curriculum.language
      };
    });
  } catch (error) {
    console.error('Error getting user roadmaps:', error);
    return [];
  }
}

export async function getRoadmapNodes(roadmapId: string): Promise<RoadmapNode[]> {
  try {
    // Use an existing table instead of 'roadmap_nodes'
    const { data, error } = await supabase
      .from('curriculum_nodes')
      .select('*')
      .eq('curriculum_id', roadmapId)
      .order('sequence_order');

    if (error) throw error;

    // Map to the expected format
    return (data || []).map((node) => ({
      id: node.id,
      name: node.name,
      title: node.name,
      description: node.description || '',
      roadmapId: node.curriculum_id,
      parentId: null, // Not storing parent relationships
      position: node.sequence_order,
      exerciseCount: 0, // Default value
      isBonus: false,
      createdAt: node.created_at
    }));
  } catch (error) {
    console.error('Error getting roadmap nodes:', error);
    return [];
  }
}

export async function getRoadmapNodeProgress(userId: string, roadmapId: string): Promise<any[]> {
  try {
    // Use an existing table
    const { data, error } = await supabase
      .from('user_node_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('curriculum_id', roadmapId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting roadmap node progress:', error);
    return [];
  }
}
