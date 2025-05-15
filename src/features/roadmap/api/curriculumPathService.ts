import { supabase } from '@/integrations/supabase/client';
import { CurriculumPathItem, CurriculumNode, ExerciseContent, NodeCompletionResult } from '../types';
import { Language, LanguageLevel } from '@/types';
import { asUUID, asFilterParam, asBooleanParam } from '@/lib/utils/supabaseHelpers';

class CurriculumPathService {
  /**
   * Get all curriculum paths available for a specific language
   */
  async getCurriculumPathsForLanguage(language: Language): Promise<CurriculumPathItem[]> {
    try {
      // Use the roadmaps function for now until the database types are updated
      const { data, error } = await supabase
        .rpc('get_roadmaps_by_language', {
          requested_language: asFilterParam(language)
        });
        
      if (error) throw error;
      
      // Get all curriculum path languages to associate with the paths
      const { data: languagesData, error: languagesError } = await supabase
        .from('roadmap_languages')
        .select('curriculum_path_id, language');
        
      if (languagesError) throw languagesError;
      
      // Group languages by curriculum path ID
      const languagesByCurriculumPath: Record<string, Language[]> = {};
      if (Array.isArray(languagesData)) {
        languagesData.forEach((langItem: any) => {
          const pathId = langItem.curriculum_path_id || langItem.roadmap_id;
          if (!languagesByCurriculumPath[pathId]) {
            languagesByCurriculumPath[pathId] = [];
          }
          languagesByCurriculumPath[pathId].push(langItem.language as Language);
        });
      }
      
      if (!Array.isArray(data)) {
        return [];
      }
      
      return data.map((item: any): CurriculumPathItem => ({
        id: item.id,
        name: item.name,
        level: item.level as LanguageLevel,
        description: item.description,
        languages: languagesByCurriculumPath[item.id] || [],
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        createdBy: item.created_by,
      }));
    } catch (error) {
      console.error('Error getting curriculum paths for language:', error);
      throw error;
    }
  }
  
  /**
   * Get curriculum paths that the current user has started for a specific language
   */
  async getUserCurriculumPaths(language: Language): Promise<CurriculumPathItem[]> {
    try {
      // First check if the user is authenticated
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!userData.user) {
        throw new Error('User must be authenticated to access user curriculum paths');
      }
      
      // Use the roadmaps function for now until the database types are updated
      const { data, error } = await supabase
        .rpc('get_user_roadmaps_by_language', {
          user_id_param: asUUID(userData.user.id),
          requested_language: asFilterParam(language)
        });
        
      if (error) throw error;
      
      // If no user curriculum paths, return empty array
      if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
      }
      
      // Get detailed curriculum path information for each user curriculum path
      const pathIds = Array.isArray(data) 
        ? data.map((item: any) => item.curriculum_path_id || item.roadmap_id) 
        : [];
      
      const { data: pathsData, error: pathsError } = await supabase
        .from('roadmaps')
        .select('*')
        .in('id', pathIds);
        
      if (pathsError) throw pathsError;
      
      // Create a map of curriculum path data for easy lookup
      const pathMap: Record<string, any> = {};
      if (Array.isArray(pathsData)) {
        pathsData.forEach(path => {
          pathMap[path.id] = path;
        });
      }
      
      // Format the user curriculum path data
      return Array.isArray(data) ? data.map((item: any): CurriculumPathItem => {
        const pathId = item.curriculum_path_id || item.roadmap_id;
        const pathDetails = pathMap[pathId] || {};
        
        return {
          id: item.id,
          curriculumPathId: pathId,
          name: pathDetails.name || 'Unnamed Path',
          level: pathDetails.level as LanguageLevel || 'A1',
          description: pathDetails.description,
          language: item.language as Language,
          currentNodeId: item.current_node_id,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        };
      }) : [];
    } catch (error) {
      console.error('Error getting user curriculum paths:', error);
      throw error;
    }
  }
  
  /**
   * Initialize a new curriculum path for the current user
   */
  async initializeCurriculumPath(level: LanguageLevel, language: Language): Promise<string> {
    try {
      // First check if the user is authenticated
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!userData.user) {
        throw new Error('User must be authenticated to initialize a curriculum path');
      }
      
      console.log(`Initializing curriculum path for user ${userData.user.id}, level ${level}, language ${language}`);
      
      // Find a curriculum path that matches the level and supports the language
      const { data: pathsData, error: pathsError } = await supabase
        .from('roadmaps')
        .select(`
          id,
          curriculum_path_languages!inner(language)
        `)
        .eq('level', asFilterParam(level))
        .eq('curriculum_path_languages.language', asFilterParam(language));
        
      if (pathsError) throw pathsError;
      
      if (!pathsData || !Array.isArray(pathsData) || pathsData.length === 0) {
        throw new Error(`No curriculum path found for level ${level} and language ${language}`);
      }
      
      // Take the first matching curriculum path
      const pathId = pathsData[0].id;
      
      // Check if the user already has this curriculum path
      const { data: existingPath, error: existingError } = await supabase
        .from('user_curriculum_paths')
        .select('id')
        .eq('user_id', asUUID(userData.user.id))
        .eq('curriculum_path_id', asUUID(pathId))
        .eq('language', asFilterParam(language))
        .maybeSingle();
        
      if (existingError) throw existingError;
      
      // If the user already has this curriculum path, return its ID
      if (existingPath) {
        return existingPath.id;
      }
      
      // Create a new user curriculum path - explicitly associate it with the current authenticated user
      const { data: userPath, error: userPathError } = await supabase
        .from('user_curriculum_paths')
        .insert({
          user_id: userData.user.id,
          curriculum_path_id: pathId,
          language: language
        })
        .select()
        .single();
        
      if (userPathError) throw userPathError;
      
      // Find first node of the curriculum path to set as current
      const { data: firstNode, error: firstNodeError } = await supabase
        .from('curriculum_nodes')
        .select('id')
        .eq('curriculum_path_id', asUUID(pathId))
        .eq('language', asFilterParam(language))
        .order('position', { ascending: true })
        .limit(1)
        .single();
        
      if (firstNodeError) {
        if (firstNodeError.code !== 'PGRST116') { // Not found
          throw firstNodeError;
        }
        // No nodes for this curriculum path yet, that's okay
        return userPath.id;
      }
      
      // Update user curriculum path with first node
      if (firstNode) {
        const { error: updateError } = await supabase
          .from('user_curriculum_paths')
          .update({ current_node_id: firstNode.id })
          .eq('id', asUUID(userPath.id));
          
        if (updateError) throw updateError;
      }
      
      console.log(`Created curriculum path for user ${userData.user.id}, path ID: ${userPath.id}`);
      return userPath.id;
    } catch (error) {
      console.error('Error initializing curriculum path:', error);
      throw error;
    }
  }
  
  /**
   * Get all nodes for a curriculum path with their status
   */
  async getCurriculumNodes(userPathId: string): Promise<CurriculumNode[]> {
    try {
      // First get the user curriculum path
      const { data: userPath, error: userPathError } = await supabase
        .from('user_curriculum_paths')
        .select('*')
        .eq('id', userPathId)
        .single();
        
      if (userPathError) throw userPathError;
      
      // Get all nodes for this curriculum path
      const { data: nodes, error: nodesError } = await supabase
        .from('curriculum_nodes')
        .select('*')
        .eq('curriculum_path_id', userPath.curriculum_path_id)
        .eq('language', userPath.language)
        .order('position', { ascending: true });
        
      if (nodesError) throw nodesError;
      
      // Get completed nodes for this user and curriculum path
      const { data: progress, error: progressError } = await supabase
        .from('curriculum_progress')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('curriculum_path_id', userPath.curriculum_path_id);
        
      if (progressError) throw progressError;
      
      // Get detailed node progress
      const { data: nodeProgress, error: nodeProgressError } = await supabase
        .from('curriculum_nodes_progress')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('curriculum_path_id', userPath.curriculum_path_id)
        .eq('language', userPath.language);
        
      if (nodeProgressError) throw nodeProgressError;
      
      const nodeArray = Array.isArray(nodes) ? nodes : [];
      const progressArray = Array.isArray(progress) ? progress : [];
      const nodeProgressArray = Array.isArray(nodeProgress) ? nodeProgress : [];
      
      // Create a map of node progress
      const nodeProgressMap: Record<string, any> = {};
      if (nodeProgressArray.length > 0) {
        nodeProgressArray.forEach(item => {
          nodeProgressMap[item.node_id] = item;
        });
      }
      
      // Create a set of completed node IDs
      const completedNodeIds = new Set<string>();
      if (progressArray.length > 0) {
        progressArray
          .filter(item => item.completed)
          .forEach(item => completedNodeIds.add(item.node_id));
      }
      
      // Mark nodes as completed from node_progress table as well
      if (nodeProgressArray.length > 0) {
        nodeProgressArray
          .filter(item => item.is_completed)
          .forEach(item => completedNodeIds.add(item.node_id));
      }
      
      // Calculate available nodes based on completed nodes
      // A node is available if it's the first node or if the previous node is completed
      const availableNodeIds = new Set<string>();
      
      // Format and return the nodes with status information
      const formattedNodes: CurriculumNode[] = nodeArray.map((node, index) => {
        // First node is always available
        if (index === 0) {
          availableNodeIds.add(node.id);
        } 
        // Other nodes are available if previous node is completed
        else if (index > 0 && completedNodeIds.has(nodeArray[index - 1].id)) {
          availableNodeIds.add(node.id);
        }
        
        // Get node progress count
        const progressCount = nodeProgressMap[node.id]?.completion_count || 0;
        
        // Determine node status
        let status: 'locked' | 'available' | 'completed' | 'current' = 'locked';
        
        if (completedNodeIds.has(node.id)) {
          status = 'completed';
        } else if (node.id === userPath.current_node_id) {
          status = 'current';
        } else if (availableNodeIds.has(node.id)) {
          status = 'available';
        }
        
        return {
          id: node.id,
          curriculumPathId: node.curriculum_path_id,
          title: node.title,
          description: node.description || '',
          position: node.position,
          isBonus: node.is_bonus,
          defaultExerciseId: node.default_exercise_id,
          language: node.language as Language | undefined,
          createdAt: new Date(node.created_at),
          updatedAt: new Date(node.updated_at),
          status,
          progressCount
        };
      });
      
      return formattedNodes;
    } catch (error) {
      console.error('Error getting curriculum nodes:', error);
      throw error;
    }
  }
  
  /**
   * Get exercise content for a curriculum node
   */
  async getNodeExerciseContent(nodeId: string): Promise<ExerciseContent | null> {
    try {
      // First get the node to get the default exercise ID
      const { data: node, error: nodeError } = await supabase
        .from('curriculum_nodes')
        .select('default_exercise_id, language')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      if (!node.default_exercise_id) {
        return null;
      }
      
      // Get the exercise content
      const { data: exercise, error: exerciseError } = await supabase
        .from('default_exercises')
        .select('*')
        .eq('id', node.default_exercise_id)
        .single();
        
      if (exerciseError) throw exerciseError;
      
      return {
        id: exercise.id,
        title: exercise.title,
        text: exercise.text,
        audioUrl: exercise.audio_url,
        language: (exercise.language || node.language) as Language,
        tags: exercise.tags
      };
    } catch (error) {
      console.error('Error getting node exercise content:', error);
      throw error;
    }
  }
  
  /**
   * Record completion of a node with an accuracy score
   */
  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<NodeCompletionResult> {
    try {
      // Get the node to get the curriculum path ID
      const { data: node, error: nodeError } = await supabase
        .from('curriculum_nodes')
        .select('curriculum_path_id, position')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Get the user curriculum path
      const { data: userPath, error: userPathError } = await supabase
        .from('user_curriculum_paths')
        .select('*')
        .eq('curriculum_path_id', node.curriculum_path_id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
        
      if (userPathError) throw userPathError;
      
      // Only increment if accuracy is high enough (95% or better)
      if (accuracy >= 95) {
        // Call the function to increment node completion
        const { data, error } = await supabase
          .rpc('increment_curriculum_node_completion', {
            node_id_param: nodeId,
            user_id_param: (await supabase.auth.getUser()).data.user?.id,
            language_param: userPath.language,
            curriculum_path_id_param: node.curriculum_path_id
          });
          
        if (error) throw error;
        
        // Get updated node progress
        const { data: nodeProgress, error: nodeProgressError } = await supabase
          .from('curriculum_nodes_progress')
          .select('completion_count, is_completed')
          .eq('node_id', nodeId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();
          
        if (nodeProgressError) throw nodeProgressError;
        
        // Check if node is now completed
        if (nodeProgress.is_completed) {
          // Find next node in sequence
          const { data: nextNode, error: nextNodeError } = await supabase
            .from('curriculum_nodes')
            .select('id')
            .eq('curriculum_path_id', node.curriculum_path_id)
            .eq('language', userPath.language)
            .eq('position', node.position + 1)
            .single();
            
          let nextNodeId = undefined;
          
          // Update current node if a next node was found
          if (!nextNodeError && nextNode) {
            nextNodeId = nextNode.id;
            
            const { error: updateError } = await supabase
              .from('user_curriculum_paths')
              .update({ 
                current_node_id: nextNode.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', userPath.id);
              
            if (updateError) throw updateError;
          }
          
          return {
            isCompleted: true,
            completionCount: nodeProgress.completion_count,
            nextNodeId
          };
        }
        
        return {
          isCompleted: false,
          completionCount: nodeProgress.completion_count
        };
      } 
      
      // If accuracy is too low, don't increment
      return {
        isCompleted: false,
        completionCount: 0
      };
    } catch (error) {
      console.error('Error recording node completion:', error);
      throw error;
    }
  }
  
  /**
   * Mark a node as completed manually (without incrementing)
   */
  async markNodeCompleted(nodeId: string): Promise<void> {
    try {
      // Get the node to get the curriculum path ID
      const { data: node, error: nodeError } = await supabase
        .from('curriculum_nodes')
        .select('curriculum_path_id, position')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Get the user curriculum path
      const { data: userPath, error: userPathError } = await supabase
        .from('user_curriculum_paths')
        .select('*')
        .eq('curriculum_path_id', node.curriculum_path_id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
        
      if (userPathError) throw userPathError;
      
      // Mark node as completed in curriculum_progress
      const { error: progressError } = await supabase
        .from('curriculum_progress')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          curriculum_path_id: node.curriculum_path_id,
          node_id: nodeId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (progressError) throw progressError;
      
      // Also mark as completed in curriculum_nodes_progress
      const { error: nodeProgressError } = await supabase
        .from('curriculum_nodes_progress')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          curriculum_path_id: node.curriculum_path_id,
          node_id: nodeId,
          language: userPath.language,
          completion_count: 3, // Set to max
          is_completed: true,
          last_practiced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (nodeProgressError) throw nodeProgressError;
      
      // Find next node in sequence
      const { data: nextNode, error: nextNodeError } = await supabase
        .from('curriculum_nodes')
        .select('id')
        .eq('curriculum_path_id', node.curriculum_path_id)
        .eq('language', userPath.language)
        .eq('position', node.position + 1)
        .single();
        
      // Update current node if a next node was found
      if (!nextNodeError && nextNode) {
        const { error: updateError } = await supabase
          .from('user_curriculum_paths')
          .update({ 
            current_node_id: nextNode.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', userPath.id);
          
        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error marking node as completed:', error);
      throw error;
    }
  }
}

export const curriculumPathService = new CurriculumPathService();
