
import { supabase } from '@/integrations/supabase/client';
import { LanguageLevel, Language } from '@/types';

// Helper function to handle possible non-array responses
const ensureArray = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  console.warn('Expected array data but got:', typeof data, data);
  return [];
};

/**
 * Get all curricula for a specific language
 */
export async function getAllCurricula(language?: Language) {
  try {
    let query = supabase
      .from('curricula')
      .select('*');
    
    if (language) {
      query = query.eq('language', language);
    }
    
    const { data, error } = await query.order('level');
    
    if (error) throw error;
    
    return ensureArray(data);
  } catch (error) {
    console.error("Error fetching curricula:", error);
    return [];
  }
}

/**
 * Get a specific curriculum by ID
 */
export async function getCurriculum(curriculumId: string) {
  try {
    const { data, error } = await supabase
      .from('curricula')
      .select('*')
      .eq('id', curriculumId)
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    return null;
  }
}

/**
 * Create a new curriculum
 */
export async function createCurriculum(curriculum: {
  name: string,
  language: Language,
  level: LanguageLevel,
  description?: string
}) {
  try {
    const { data, error } = await supabase
      .from('curricula')
      .insert({
        name: curriculum.name,
        language: curriculum.language,
        level: curriculum.level,
        description: curriculum.description || '',
        status: 'active',
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating curriculum:", error);
    throw error;
  }
}

/**
 * Update an existing curriculum
 */
export async function updateCurriculum(curriculumId: string, curriculum: {
  name?: string,
  language?: Language,
  level?: LanguageLevel,
  description?: string,
  status?: 'active' | 'inactive'
}) {
  try {
    const { data, error } = await supabase
      .from('curricula')
      .update({
        name: curriculum.name,
        language: curriculum.language,
        level: curriculum.level,
        description: curriculum.description,
        status: curriculum.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', curriculumId)
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error updating curriculum:", error);
    throw error;
  }
}

/**
 * Delete a curriculum
 */
export async function deleteCurriculum(curriculumId: string) {
  try {
    const { error } = await supabase
      .from('curricula')
      .delete()
      .eq('id', curriculumId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error deleting curriculum:", error);
    throw error;
  }
}

/**
 * Get all nodes for a curriculum
 */
export async function getCurriculumNodes(curriculumId: string) {
  try {
    const { data, error } = await supabase
      .from('curriculum_nodes')
      .select('*')
      .eq('curriculum_id', curriculumId)
      .order('sequence_order');
      
    if (error) throw error;
    
    return ensureArray(data);
  } catch (error) {
    console.error("Error fetching curriculum nodes:", error);
    return [];
  }
}

/**
 * Create a new node in a curriculum
 */
export async function createCurriculumNode(node: {
  curriculum_id: string,
  name: string,
  description?: string,
  sequence_order: number,
  min_completion_count?: number,
  min_accuracy_percentage?: number
}) {
  try {
    const { data, error } = await supabase
      .from('curriculum_nodes')
      .insert({
        curriculum_id: node.curriculum_id,
        name: node.name,
        description: node.description || '',
        sequence_order: node.sequence_order,
        min_completion_count: node.min_completion_count || 3,
        min_accuracy_percentage: node.min_accuracy_percentage || 95
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating curriculum node:", error);
    throw error;
  }
}

/**
 * Update an existing curriculum node
 */
export async function updateCurriculumNode(nodeId: string, node: {
  name?: string,
  description?: string,
  sequence_order?: number,
  min_completion_count?: number,
  min_accuracy_percentage?: number
}) {
  try {
    const { data, error } = await supabase
      .from('curriculum_nodes')
      .update({
        name: node.name,
        description: node.description,
        sequence_order: node.sequence_order,
        min_completion_count: node.min_completion_count,
        min_accuracy_percentage: node.min_accuracy_percentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', nodeId)
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error updating curriculum node:", error);
    throw error;
  }
}

/**
 * Delete a curriculum node
 */
export async function deleteCurriculumNode(nodeId: string) {
  try {
    const { error } = await supabase
      .from('curriculum_nodes')
      .delete()
      .eq('id', nodeId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error deleting curriculum node:", error);
    throw error;
  }
}

/**
 * Get exercises linked to a node
 */
export async function getNodeExercises(nodeId: string) {
  try {
    const { data, error } = await supabase
      .from('node_exercises')
      .select('*, exercise:exercise_id(*)')
      .eq('node_id', nodeId)
      .order('sequence_order');
      
    if (error) throw error;
    
    return ensureArray(data);
  } catch (error) {
    console.error("Error fetching node exercises:", error);
    return [];
  }
}

/**
 * Link an exercise to a node
 */
export async function linkExerciseToNode(nodeExercise: {
  node_id: string,
  exercise_id: string,
  sequence_order: number
}) {
  try {
    const { data, error } = await supabase
      .from('node_exercises')
      .insert({
        node_id: nodeExercise.node_id,
        exercise_id: nodeExercise.exercise_id,
        sequence_order: nodeExercise.sequence_order
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error linking exercise to node:", error);
    throw error;
  }
}

/**
 * Remove an exercise from a node
 */
export async function unlinkExerciseFromNode(nodeExerciseId: string) {
  try {
    const { error } = await supabase
      .from('node_exercises')
      .delete()
      .eq('id', nodeExerciseId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error unlinking exercise from node:", error);
    throw error;
  }
}

/**
 * Get user's enrolled curricula
 */
export async function getUserEnrolledCurricula(language?: Language) {
  try {
    let query = supabase
      .from('user_curricula')
      .select('*, curriculum:curriculum_id(*), current_node:current_node_id(*)');
    
    if (language) {
      query = query.eq('curriculum.language', language);
    }
    
    const { data, error } = await query.order('last_activity_date', { ascending: false });
    
    if (error) throw error;
    
    return ensureArray(data);
  } catch (error) {
    console.error("Error fetching user enrolled curricula:", error);
    return [];
  }
}

/**
 * Enroll user in a curriculum
 */
export async function enrollInCurriculum(curriculumId: string) {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .rpc('enroll_in_curriculum', {
        user_id_param: userId,
        curriculum_id_param: curriculumId
      });
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error enrolling in curriculum:", error);
    throw error;
  }
}

/**
 * Get available nodes for a user in a curriculum
 */
export async function getAvailableNodes(curriculumId: string) {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .rpc('get_available_curriculum_nodes', {
        user_id_param: userId,
        curriculum_id_param: curriculumId
      });
      
    if (error) throw error;
    
    return ensureArray(data);
  } catch (error) {
    console.error("Error fetching available nodes:", error);
    return [];
  }
}

/**
 * Get user's progress for a specific curriculum
 */
export async function getUserCurriculumProgress(curriculumId: string) {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from('user_node_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('curriculum_id', curriculumId);
      
    if (error) throw error;
    
    return ensureArray(data);
  } catch (error) {
    console.error("Error fetching user curriculum progress:", error);
    return [];
  }
}

/**
 * Record an exercise attempt in a curriculum
 */
export async function recordExerciseAttempt(attempt: {
  exercise_id: string,
  node_id: string,
  curriculum_id: string,
  accuracy_percentage: number,
  completion_time?: number
}) {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error("User not authenticated");
    }
    
    const { error } = await supabase
      .rpc('record_curriculum_exercise_attempt', {
        user_id_param: userId,
        exercise_id_param: attempt.exercise_id,
        node_id_param: attempt.node_id,
        curriculum_id_param: attempt.curriculum_id,
        accuracy_param: attempt.accuracy_percentage,
        completion_time_param: attempt.completion_time || null
      });
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error recording exercise attempt:", error);
    throw error;
  }
}
