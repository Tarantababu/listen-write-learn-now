
import { supabase } from '@/integrations/supabase/client';
import { 
  CurriculumPath, 
  CurriculumNode, 
  UserCurriculumPath, 
  CurriculumProgress, 
  CurriculumNodeProgress,
  Language,
  LanguageLevel 
} from '@/types';
import { toast } from '@/hooks/use-toast';

/**
 * Maps a curriculum path from database to front-end format
 */
export const mapCurriculumPathFromDb = (path: any): CurriculumPath => ({
  id: path.id,
  language: path.language,
  level: path.level,
  description: path.description,
  createdAt: new Date(path.created_at),
  updatedAt: new Date(path.updated_at),
  createdBy: path.created_by,
});

/**
 * Maps a curriculum node from database to front-end format
 */
export const mapCurriculumNodeFromDb = (node: any): CurriculumNode => ({
  id: node.id,
  curriculumPathId: node.curriculum_path_id,
  defaultExerciseId: node.default_exercise_id,
  title: node.title,
  description: node.description,
  position: node.position,
  isBonus: node.is_bonus,
  createdAt: new Date(node.created_at),
  updatedAt: new Date(node.updated_at),
});

/**
 * Maps a user curriculum path from database to front-end format
 */
export const mapUserCurriculumPathFromDb = (userPath: any): UserCurriculumPath => ({
  id: userPath.id,
  userId: userPath.user_id,
  curriculumPathId: userPath.curriculum_path_id,
  language: userPath.language,
  currentNodeId: userPath.current_node_id,
  createdAt: new Date(userPath.created_at),
  updatedAt: new Date(userPath.updated_at || userPath.created_at),
});

/**
 * Maps a curriculum progress from database to front-end format
 */
export const mapCurriculumProgressFromDb = (progress: any): CurriculumProgress => ({
  id: progress.id,
  userId: progress.user_id,
  curriculumPathId: progress.curriculum_path_id,
  nodeId: progress.curriculum_node_id || progress.node_id,
  completed: progress.completed,
  completedAt: progress.completed_at ? new Date(progress.completed_at) : undefined,
  createdAt: new Date(progress.created_at),
  updatedAt: new Date(progress.updated_at || progress.created_at),
});

/**
 * Maps a curriculum node progress from database to front-end format
 */
export const mapCurriculumNodeProgressFromDb = (progress: any): CurriculumNodeProgress => ({
  id: progress.id,
  userId: progress.user_id,
  curriculumPathId: progress.curriculum_path_id,
  nodeId: progress.node_id,
  language: progress.language,
  completionCount: progress.completion_count,
  isCompleted: progress.is_completed,
  lastPracticedAt: progress.last_practiced_at ? new Date(progress.last_practiced_at) : undefined,
  createdAt: new Date(progress.created_at),
  updatedAt: new Date(progress.updated_at || progress.created_at),
});

/**
 * Fetch all curriculum paths for a specific language
 */
export const fetchCurriculumPathsByLanguage = async (language: Language): Promise<CurriculumPath[]> => {
  const { data, error } = await supabase
    .from('curriculum_paths')
    .select('*')
    .eq('language', language)
    .order('level');

  if (error) {
    console.error('Error fetching curriculum paths:', error);
    throw error;
  }

  return (data || []).map(mapCurriculumPathFromDb);
};

/**
 * Fetch all curriculum nodes for a specific curriculum path
 */
export const fetchCurriculumNodes = async (curriculumPathId: string): Promise<CurriculumNode[]> => {
  const { data, error } = await supabase
    .from('curriculum_nodes')
    .select('*')
    .eq('curriculum_path_id', curriculumPathId)
    .order('position');

  if (error) {
    console.error('Error fetching curriculum nodes:', error);
    throw error;
  }

  return (data || []).map(mapCurriculumNodeFromDb);
};

/**
 * Fetch a user's curriculum paths for a specific language
 */
export const fetchUserCurriculumPaths = async (userId: string, language?: Language): Promise<UserCurriculumPath[]> => {
  let query = supabase
    .from('user_curriculum_paths')
    .select(`
      *,
      curriculum_paths!inner(*)
    `)
    .eq('user_id', userId);
    
  if (language) {
    query = query.eq('curriculum_paths.language', language);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user curriculum paths:', error);
    throw error;
  }

  return (data || []).map((item) => ({
    ...mapUserCurriculumPathFromDb(item),
    language: item.curriculum_paths.language,
  }));
};

/**
 * Fetch user progress for curriculum nodes
 */
export const fetchNodeProgress = async (userId: string, curriculumPathId: string): Promise<CurriculumNodeProgress[]> => {
  const { data, error } = await supabase
    .from('curriculum_nodes_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('curriculum_path_id', curriculumPathId);

  if (error) {
    console.error('Error fetching node progress:', error);
    throw error;
  }

  return (data || []).map(mapCurriculumNodeProgressFromDb);
};

/**
 * Initialize a new user curriculum path by selecting a path for a language and level
 */
export const initializeUserCurriculumPath = async (
  userId: string, 
  language: Language, 
  level: LanguageLevel
): Promise<UserCurriculumPath> => {
  try {
    // First find the curriculum path for the selected language and level
    const { data: pathData, error: pathError } = await supabase
      .from('curriculum_paths')
      .select('*')
      .eq('language', language)
      .eq('level', level)
      .single();

    if (pathError) {
      console.error('Error finding curriculum path:', pathError);
      throw pathError;
    }

    if (!pathData) {
      throw new Error(`No curriculum path found for ${language} at level ${level}`);
    }

    // Now create the user curriculum path
    const { data: userPathData, error: userPathError } = await supabase
      .from('user_curriculum_paths')
      .insert({
        user_id: userId,
        curriculum_path_id: pathData.id,
      })
      .select()
      .single();

    if (userPathError) {
      console.error('Error creating user curriculum path:', userPathError);
      throw userPathError;
    }

    return {
      ...mapUserCurriculumPathFromDb(userPathData),
      language,
    };
  } catch (error) {
    console.error('Error initializing user curriculum path:', error);
    toast({
      title: "Failed to start curriculum",
      description: "Could not initialize the curriculum path. Please try again.",
      variant: "destructive"
    });
    throw error;
  }
};

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
