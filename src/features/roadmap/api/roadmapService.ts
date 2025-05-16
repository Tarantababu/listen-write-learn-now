
import { supabase } from '@/integrations/supabase/client';
import { Language, LanguageLevel } from '@/types';
import { RoadmapItem, RoadmapNode, NodeCompletionResult, ExerciseContent } from '../types';

// Fix the getRoadmapsForLanguage function to return the correct type
export async function getRoadmapsForLanguage(language: Language): Promise<RoadmapItem[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_roadmaps_by_language', {
        requested_language: language as string // Cast to string to fix type error
      });

    if (error) throw error;

    // Ensure the returned data has all required fields
    const roadmaps: RoadmapItem[] = data.map((roadmap: any) => ({
      id: roadmap.id,
      name: roadmap.name,
      description: roadmap.description,
      level: roadmap.level,
      language: language as Language,
      nodeCount: roadmap.node_count,
      createdAt: new Date(roadmap.created_at),
      updatedAt: new Date(roadmap.updated_at || roadmap.created_at) // Ensure updatedAt is present
    }));

    return roadmaps;
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    return [];
  }
}

// Fix the getUserRoadmaps function to return the correct type
export async function getUserRoadmaps(language: Language): Promise<RoadmapItem[]> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];

    const { data, error } = await supabase
      .rpc('get_user_roadmaps_by_language', {
        user_id_param: userData.user.id,
        requested_language: language
      });

    if (error) throw error;

    // Ensure the returned data has all required fields
    const roadmaps: RoadmapItem[] = data.map((roadmap: any) => ({
      id: roadmap.id,
      roadmapId: roadmap.roadmap_id,
      name: roadmap.name,
      description: roadmap.description,
      level: roadmap.level,
      language: roadmap.language,
      currentNodeId: roadmap.current_node_id,
      completedNodes: roadmap.completed_nodes,
      totalNodes: roadmap.total_nodes,
      createdAt: new Date(roadmap.created_at),
      updatedAt: new Date(roadmap.updated_at || roadmap.created_at) // Ensure updatedAt is present
    }));

    return roadmaps;
  } catch (error) {
    console.error('Error fetching user roadmaps:', error);
    return [];
  }
}

// Fix recordNodeCompletion to include lastPracticedAt
export async function recordNodeCompletion(nodeId: string, accuracy: number): Promise<NodeCompletionResult> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('User not authenticated');

    // First, get the node details to get the roadmap ID
    const { data: nodeData, error: nodeError } = await supabase
      .from('roadmap_nodes')
      .select('roadmap_id, language')
      .eq('id', nodeId)
      .single();

    if (nodeError) throw nodeError;

    // Check if a progress record already exists
    const { data: existingProgress, error: existingError } = await supabase
      .from('roadmap_nodes_progress')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('node_id', nodeId)
      .single();

    const now = new Date();

    if (!existingError && existingProgress) {
      // Update existing progress
      const newCompletionCount = existingProgress.completion_count + 1;
      const isComplete = newCompletionCount >= 3 || accuracy >= 95;

      const { data, error } = await supabase
        .from('roadmap_nodes_progress')
        .update({
          completion_count: newCompletionCount,
          is_completed: isComplete,
          last_practiced_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', existingProgress.id)
        .select()
        .single();

      if (error) throw error;

      return {
        completionCount: newCompletionCount,
        isCompleted: isComplete,
        lastPracticedAt: now
      };
    } else {
      // Create new progress record
      const isComplete = accuracy >= 95;

      const { error: insertError } = await supabase
        .from('roadmap_nodes_progress')
        .insert({
          user_id: userData.user.id,
          roadmap_id: nodeData.roadmap_id,
          node_id: nodeId,
          language: nodeData.language,
          completion_count: 1,
          is_completed: isComplete,
          last_practiced_at: now.toISOString()
        })
        .select();

      if (insertError) throw insertError;

      return {
        completionCount: 1,
        isCompleted: isComplete,
        lastPracticedAt: now
      };
    }
  } catch (error) {
    console.error('Error recording node completion:', error);
    throw error;
  }
}

export const roadmapService = {
  getRoadmapsForLanguage,
  getUserRoadmaps,
  recordNodeCompletion,
};
