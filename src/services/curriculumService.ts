import { supabase } from '@/integrations/supabase/client';
import { LanguageLevel, Language, CurriculumPath, CurriculumNode, UserCurriculumPath, CurriculumProgress } from '@/types';
import { toast } from '@/components/ui/use-toast';

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
    // Since we don't have a curriculum-specific function yet, use the roadmap function
    // and adapt the data structure
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
      description: path.description,
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
export async function getCurriculumNodes(curriculumPathId: string, language: Language): Promise<CurriculumNode[]> {
  try {
    // We'll use the roadmap nodes table until we have a dedicated curriculum table
    const { data, error } = await supabase
      .from('roadmap_nodes')
      .select('*')
      .eq('roadmap_id', curriculumPathId)
      .eq('language', language)
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
export async function getUserCurriculumPaths(language: Language): Promise<UserCurriculumPath[]> {
  try {
    // We'll use the user roadmaps table until we have a dedicated user curriculum paths table
    const { data, error } = await supabase
      .rpc('get_user_roadmaps_by_language', {
        user_id_param: supabase.auth.getUser().then(({ data }) => data.user?.id) || '',
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
export async function getCurriculumNodesProgress(pathId: string, language: Language): Promise<any[]> {
  try {
    // We'll use the roadmap nodes progress table
    const { data, error } = await supabase
      .from('roadmap_nodes_progress')
      .select('*')
      .eq('roadmap_id', pathId)
      .eq('language', language)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '');

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
export async function initializeUserCurriculumPath(level: LanguageLevel, language: Language): Promise<string | null> {
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
      return null;
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

    // Create a new user curriculum path
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
    return null;
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
      .rpc('increment_curriculum_node_completion', {
        user_id_param: userId,
        node_id_param: nodeId,
        language_param: language,
        curriculum_path_id_param: curriculumPathId
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
    const { error } = await supabase
      .from('curriculum_progress')
      .insert({
        user_id: userId,
        curriculum_node_id: nodeId,
        curriculum_path_id: curriculumPathId,
        completed: true,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // If it's a duplicate entry, try to update instead
      if (error.code === '23505') { // Unique violation
        const { error: updateError } = await supabase
          .from('curriculum_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('curriculum_node_id', nodeId);
          
        if (updateError) {
          console.error('Error updating curriculum progress:', updateError);
          throw updateError;
        }
      } else {
        console.error('Error marking node as completed:', error);
        throw error;
      }
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
    // Delete from curriculum_progress
    const { error: deleteProgressError } = await supabase
      .from('curriculum_progress')
      .delete()
      .eq('user_id', userId)
      .eq('curriculum_path_id', curriculumPathId);
      
    if (deleteProgressError) {
      console.error('Error deleting curriculum progress:', deleteProgressError);
      throw deleteProgressError;
    }
    
    // Delete from curriculum_nodes_progress
    const { error: deleteNodeProgressError } = await supabase
      .from('curriculum_nodes_progress')
      .delete()
      .eq('user_id', userId)
      .eq('curriculum_path_id', curriculumPathId);
      
    if (deleteNodeProgressError) {
      console.error('Error deleting node progress:', deleteNodeProgressError);
      throw deleteNodeProgressError;
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
      .from('curriculum_nodes')
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
