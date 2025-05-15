import { supabase } from '@/integrations/supabase/client';
import { LanguageLevel, Language, CurriculumPath, CurriculumNode, UserCurriculumPath, CurriculumProgress } from '@/types';
import { toast } from '@/hooks/use-toast';

// Helper function to handle possible non-array responses
const ensureArray = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  console.warn('Expected array data but got:', typeof data, data);
  return [];
};

/**
 * Get all curriculum paths for a specific language
 */
export async function getCurriculumPaths(language: Language): Promise<CurriculumPath[]> {
  try {
    // Since curriculum paths functionality is not fully implemented,
    // we'll use the roadmap tables as a fallback
    const { data, error } = await supabase
      .rpc('get_roadmaps_by_language', {
        requested_language: language
      });

    if (error) throw error;

    // Convert the roadmap data to curriculum path format
    return ensureArray(data).map(path => ({
      id: path.id,
      language: language,
      level: path.level as LanguageLevel,
      description: path.description || '',
      createdAt: new Date(path.created_at),
      updatedAt: new Date(path.updated_at),
      createdBy: path.created_by
    }));
  } catch (error) {
    console.error("Error fetching curriculum paths:", error);
    throw error;
  }
}

/**
 * Get all nodes for a curriculum path
 */
export async function getCurriculumNodes(curriculumPathId: string): Promise<CurriculumNode[]> {
  try {
    // We'll use the roadmap nodes table until we have a dedicated curriculum table
    const { data, error } = await supabase
      .from('roadmap_nodes')
      .select('*')
      .eq('roadmap_id', curriculumPathId)
      .order('position');

    if (error) throw error;

    // Convert the roadmap nodes to curriculum node format
    return ensureArray(data).map(node => ({
      id: node.id,
      curriculumPathId: node.roadmap_id,
      title: node.title,
      description: node.description || '',
      position: node.position,
      isBonus: node.is_bonus,
      defaultExerciseId: node.default_exercise_id,
      createdAt: new Date(node.created_at),
      updatedAt: new Date(node.updated_at),
    }));
  } catch (error) {
    console.error("Error fetching curriculum nodes:", error);
    throw error;
  }
}

/**
 * Get all user curriculum paths
 */
export async function getUserCurriculumPaths(language?: Language): Promise<UserCurriculumPath[]> {
  try {
    // We'll use the user roadmaps table until we have a dedicated user curriculum paths table
    const { data, error } = await supabase
      .rpc('get_user_roadmaps_by_language', {
        user_id_param: (await supabase.auth.getUser()).data.user?.id,
        requested_language: language
      });

    if (error) throw error;

    // Convert to user curriculum path format
    return ensureArray(data).map(path => ({
      id: path.id,
      userId: path.user_id,
      curriculumPathId: path.roadmap_id,
      language: path.language as Language,
      currentNodeId: path.current_node_id,
      createdAt: new Date(path.created_at),
      updatedAt: new Date(path.updated_at),
    }));
  } catch (error) {
    console.error("Error fetching user curriculum paths:", error);
    throw error;
  }
}

/**
 * Get curriculum nodes progress
 */
export async function getCurriculumNodesProgress(userId: string, pathId: string): Promise<any[]> {
  try {
    // We'll use the roadmap nodes progress table
    const { data, error } = await supabase
      .from('roadmap_nodes_progress')
      .select('*')
      .eq('roadmap_id', pathId)
      .eq('user_id', userId);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching curriculum nodes progress:", error);
    return [];
  }
}

/**
 * Get curriculum progress
 */
export async function getCurriculumProgress(pathId: string): Promise<CurriculumProgress[]> {
  try {
    // We'll use the roadmap progress table
    const { data, error } = await supabase
      .from('roadmap_progress')
      .select('*')
      .eq('roadmap_id', pathId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '');

    if (error) throw error;

    // Convert to curriculum progress format
    return ensureArray(data).map(item => ({
      id: item.id,
      userId: item.user_id,
      curriculumPathId: item.roadmap_id,
      nodeId: item.node_id,
      completed: item.completed,
      completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error) {
    console.error("Error fetching curriculum progress:", error);
    return [];
  }
}

/**
 * Initialize a curriculum path for the current user
 */
export async function initializeUserCurriculumPath(level: LanguageLevel, language: Language): Promise<string> {
  try {
    // First check if a path exists for this level and language
    const { data: pathData, error: pathError } = await supabase
      .rpc('get_roadmaps_by_language', {
        requested_language: language
      });

    if (pathError) throw pathError;

    // Find the path that matches the requested level
    const matchingPath = ensureArray(pathData).find(p => p.level === level);

    if (!matchingPath) {
      console.error("No curriculum path found for level:", level, "and language:", language);
      return "";
    }

    // Check if user already has this path
    const { data: userPaths, error: userPathsError } = await supabase
      .from('user_roadmaps')
      .select('*')
      .eq('roadmap_id', matchingPath.id)
      .eq('language', language)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '');

    if (userPathsError) throw userPathsError;

    if (userPaths && userPaths.length > 0) {
      // User already has this path
      console.log("User already has this path:", userPaths[0].id);
      return userPaths[0].id;
    }

    // Create a new user curriculum path using rpc function or direct insert
    const { data: newPath, error: createError } = await supabase
      .from('user_roadmaps')
      .insert({
        roadmap_id: matchingPath.id,
        language: language,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (createError) throw createError;

    // Find first node for this path
    const { data: nodesData, error: nodesError } = await supabase
      .from('roadmap_nodes')
      .select('*')
      .eq('roadmap_id', matchingPath.id)
      .eq('language', language)
      .order('position')
      .limit(1);

    if (nodesError) throw nodesError;

    if (nodesData && nodesData.length > 0) {
      // Update path with first node
      const { error: updateError } = await supabase
        .from('user_roadmaps')
        .update({ current_node_id: nodesData[0].id })
        .eq('id', newPath.id);

      if (updateError) throw updateError;
    }

    return newPath.id;
  } catch (error) {
    console.error("Error initializing user curriculum path:", error);
    return "";
  }
}

/**
 * Increment node completion count for a user
 */
export const incrementNodeCompletion = async (
  userId: string,
  nodeId: string,
  curriculumPathId: string,
  language: Language
): Promise<void> => {
  try {
    const { error } = await supabase
      .rpc('increment_node_completion', {
        user_id_param: userId,
        node_id_param: nodeId,
        language_param: language,
        roadmap_id_param: curriculumPathId
      });

    if (error) {
      console.error('Error incrementing node completion:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error incrementing node completion:', error);
    throw error;
  }
};

/**
 * Mark a node as completed directly
 */
export const markNodeAsCompleted = async (
  userId: string,
  nodeId: string,
  curriculumPathId: string
): Promise<void> => {
  try {
    // Use RPC function to mark node as completed
    const { error } = await supabase
      .rpc('increment_node_completion', {
        user_id_param: userId,
        node_id_param: nodeId,
        language_param: 'english', // Fallback
        roadmap_id_param: curriculumPathId
      });

    if (error) {
      console.error('Error marking node as completed:', error);
      throw error;
    }

    // Also update the roadmap_progress table using rpc or direct operation
    const { error: progressError } = await supabase
      .from('roadmap_progress')
      .upsert({
        user_id: userId,
        node_id: nodeId,
        roadmap_id: curriculumPathId,
        completed: true,
        completed_at: new Date().toISOString()
      })
      .select();
      
    if (progressError) {
      console.error('Error updating roadmap progress:', progressError);
      throw progressError;
    }
  } catch (error) {
    console.error('Error marking node as completed:', error);
    throw error;
  }
};

/**
 * Reset progress for a specific curriculum path
 */
export const resetProgress = async (
  userId: string,
  curriculumPathId: string
): Promise<void> => {
  try {
    // Delete from roadmap_progress using rpc or direct operation
    const { error: deleteProgressError } = await supabase
      .rpc('reset_roadmap_progress', {
        user_id_param: userId,
        roadmap_id_param: curriculumPathId
      });
      
    if (deleteProgressError) {
      // Fallback to direct delete
      const { error: directDeleteError } = await supabase
        .from('roadmap_progress')
        .delete()
        .eq('user_id', userId)
        .eq('roadmap_id', curriculumPathId);
        
      if (directDeleteError) {
        console.error('Error deleting roadmap progress:', directDeleteError);
        throw directDeleteError;
      }
    }
    
    // Also delete from roadmap_nodes_progress
    const { error: deleteNodeProgressError } = await supabase
      .rpc('reset_roadmap_nodes_progress', {
        user_id_param: userId,
        roadmap_id_param: curriculumPathId
      });
      
    if (deleteNodeProgressError) {
      // Fallback to direct delete
      const { error: directDeleteNodeError } = await supabase
        .from('roadmap_nodes_progress')
        .delete()
        .eq('user_id', userId)
        .eq('roadmap_id', curriculumPathId);
        
      if (directDeleteNodeError) {
        console.error('Error deleting node progress:', directDeleteNodeError);
        throw directDeleteNodeError;
      }
    }
  } catch (error) {
    console.error('Error resetting progress:', error);
    throw error;
  }
};

/**
 * Fetch an exercise for a curriculum node
 */
export const getNodeExercise = async (nodeId: string): Promise<any> => {
  try {
    // First get the node to get the default exercise ID
    const { data: nodeData, error: nodeError } = await supabase
      .from('roadmap_nodes')
      .select('default_exercise_id')
      .eq('id', nodeId)
      .single();

    if (nodeError) {
      console.error('Error fetching node:', nodeError);
      throw nodeError;
    }

    if (!nodeData.default_exercise_id) {
      throw new Error('This node has no associated exercise');
    }

    // Now get the default exercise
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('default_exercises')
      .select('*')
      .eq('id', nodeData.default_exercise_id)
      .single();

    if (exerciseError) {
      console.error('Error fetching exercise:', exerciseError);
      throw exerciseError;
    }

    return exerciseData;
  } catch (error) {
    console.error('Error getting node exercise:', error);
    throw error;
  }
};

/**
 * Create a curriculum path
 */
export const createCurriculumPath = async (
  language: Language, 
  level: LanguageLevel, 
  description?: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('add_curriculum_path', {
      language_param: language,
      level_param: level,
      description_param: description || null
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating curriculum path:', error);
    throw error;
  }
};

/**
 * Update a curriculum path
 */
export const updateCurriculumPath = async (
  pathId: string,
  language: Language, 
  level: LanguageLevel, 
  description?: string
): Promise<void> => {
  try {
    const { error } = await supabase.rpc('update_curriculum_path', {
      path_id_param: pathId,
      language_param: language,
      level_param: level,
      description_param: description || null
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating curriculum path:', error);
    throw error;
  }
};

/**
 * Delete a curriculum path
 */
export const deleteCurriculumPath = async (pathId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('delete_curriculum_path', {
      path_id_param: pathId
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting curriculum path:', error);
    throw error;
  }
};

/**
 * Create a curriculum node
 */
export const createCurriculumNode = async (
  curriculumPathId: string,
  title: string,
  description: string | null,
  position: number,
  isBonus: boolean,
  defaultExerciseId?: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('add_curriculum_node', {
      curriculum_path_id_param: curriculumPathId,
      title_param: title,
      description_param: description,
      position_param: position,
      is_bonus_param: isBonus,
      default_exercise_id_param: defaultExerciseId || null
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating curriculum node:', error);
    throw error;
  }
};

/**
 * Update a curriculum node
 */
export const updateCurriculumNode = async (
  nodeId: string,
  title: string,
  description: string | null,
  position: number,
  isBonus: boolean,
  defaultExerciseId?: string
): Promise<void> => {
  try {
    const { error } = await supabase.rpc('update_curriculum_node', {
      node_id_param: nodeId,
      title_param: title,
      description_param: description,
      position_param: position,
      is_bonus_param: isBonus,
      default_exercise_id_param: defaultExerciseId || null
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating curriculum node:', error);
    throw error;
  }
};

/**
 * Delete a curriculum node
 */
export const deleteCurriculumNode = async (nodeId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('delete_curriculum_node', {
      node_id_param: nodeId
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting curriculum node:', error);
    throw error;
  }
};

/**
 * Fetch default exercises
 */
export const fetchDefaultExercises = async (language?: Language): Promise<any[]> => {
  try {
    let query = supabase
      .from('default_exercises')
      .select('id, title, language');
      
    if (language) {
      query = query.eq('language', language);
    }
    
    query = query.order('title');
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching default exercises:', error);
    throw error;
  }
};
