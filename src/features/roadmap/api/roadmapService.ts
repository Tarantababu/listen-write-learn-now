import { supabase } from '@/integrations/supabase/client';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '../types';
import { Language, LanguageLevel } from '@/types';

class RoadmapService {
  /**
   * Get all available roadmaps for a specific language
   */
  async getRoadmapsForLanguage(language: Language): Promise<RoadmapItem[]> {
    // Normalize language to lowercase for consistent comparison
    const normalizedLanguage = language.toLowerCase() as Language;
    
    console.log(`Fetching roadmaps for language: ${normalizedLanguage}`);
    
    try {
      const { data, error } = await supabase
        .rpc('get_roadmaps_by_language', {
          requested_language: normalizedLanguage
        });
      
      if (error) throw error;
      
      // Format roadmaps data
      const roadmaps: RoadmapItem[] = data.map((roadmap: any) => ({
        id: roadmap.id,
        name: roadmap.name,
        description: roadmap.description || '',
        level: roadmap.level,
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at),
        language: normalizedLanguage,
        languages: [normalizedLanguage], // Just include the requested language for simplicity
      }));
      
      return roadmaps;
    } catch (error) {
      console.error('Error getting roadmaps:', error);
      throw error;
    }
  }
  
  /**
   * Get user's roadmaps for a specific language
   */
  async getUserRoadmaps(language: Language): Promise<RoadmapItem[]> {
    // Normalize language to lowercase for consistent comparison
    const normalizedLanguage = language.toLowerCase() as Language;
    
    console.log(`Fetching user roadmaps for language: ${normalizedLanguage}`);
    
    try {
      // Use the RPC function to get user roadmaps by language
      const { data: userRoadmaps, error: userRoadmapsError } = await supabase
        .rpc('get_user_roadmaps_by_language', {
          user_id_param: (await supabase.auth.getUser()).data.user!.id,
          requested_language: normalizedLanguage
        });
      
      if (userRoadmapsError) throw userRoadmapsError;
      
      // Get roadmaps details
      const roadmapIds = userRoadmaps.map((ur: any) => ur.roadmap_id);
      
      if (roadmapIds.length === 0) {
        return [];
      }
      
      const { data: roadmapsData, error: roadmapsError } = await supabase
        .from('roadmaps')
        .select('*')
        .in('id', roadmapIds);
      
      if (roadmapsError) throw roadmapsError;
      
      // Create a map of roadmaps for easy lookup
      const roadmapsMap: Record<string, any> = {};
      roadmapsData.forEach(roadmap => {
        roadmapsMap[roadmap.id] = roadmap;
      });
      
      // Format user roadmap data
      const formattedUserRoadmaps: RoadmapItem[] = userRoadmaps.map((ur: any) => {
        const roadmapInfo = roadmapsMap[ur.roadmap_id] || {};
        
        return {
          id: ur.id,
          roadmapId: ur.roadmap_id,
          name: roadmapInfo.name || `Roadmap ${ur.id.substring(0, 6)}`,
          description: roadmapInfo.description || '',
          level: roadmapInfo.level,
          createdAt: new Date(ur.created_at),
          updatedAt: new Date(ur.updated_at),
          language: ur.language,
          currentNodeId: ur.current_node_id,
          userId: ur.user_id
        };
      });
      
      return formattedUserRoadmaps;
    } catch (error) {
      console.error('Error getting user roadmaps:', error);
      throw error;
    }
  }
  
  /**
   * Initialize a new roadmap for the user
   */
  async initializeRoadmap(level: LanguageLevel, language: Language): Promise<string> {
    // Normalize language to lowercase for consistent comparison
    const normalizedLanguage = language.toLowerCase() as Language;
    
    console.log(`Initializing roadmap level: ${level}, language: ${normalizedLanguage}`);
    
    try {
      // Find a matching roadmap for the given level and language
      const { data: roadmapsData, error: roadmapsError } = await supabase
        .from('roadmaps')
        .select('id')
        .eq('level', level);
      
      if (roadmapsError) throw roadmapsError;
      
      if (!roadmapsData || roadmapsData.length === 0) {
        throw new Error(`No roadmap found for level: ${level}`);
      }
      
      // Check if the roadmap supports the requested language
      const roadmapId = roadmapsData[0].id;
      const { data: languagesData, error: languagesError } = await supabase
        .from('roadmap_languages')
        .select('language')
        .eq('roadmap_id', roadmapId)
        .eq('language', normalizedLanguage);
      
      if (languagesError) throw languagesError;
      
      if (!languagesData || languagesData.length === 0) {
        throw new Error(`The roadmap ${roadmapId} does not support language: ${normalizedLanguage}`);
      }
      
      // Check if the user already has this roadmap for this language
      const userId = (await supabase.auth.getUser()).data.user!.id;
      const { data: existingRoadmap, error: existingError } = await supabase
        .from('user_roadmaps')
        .select('id')
        .eq('user_id', userId)
        .eq('roadmap_id', roadmapId)
        .eq('language', normalizedLanguage);
      
      if (existingError) throw existingError;
      
      if (existingRoadmap && existingRoadmap.length > 0) {
        console.log(`User already has this roadmap for language ${normalizedLanguage}, returning existing ID: ${existingRoadmap[0].id}`);
        return existingRoadmap[0].id;
      }
      
      // Get first node in roadmap
      const { data: firstNode, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmapId)
        .eq('language', normalizedLanguage)
        .order('position', { ascending: true })
        .limit(1);
      
      if (nodeError) throw nodeError;
      
      if (!firstNode || firstNode.length === 0) {
        throw new Error(`No nodes found for roadmap ${roadmapId} in language: ${normalizedLanguage}`);
      }
      
      const firstNodeId = firstNode[0].id;
      
      // Create user_roadmap record
      const { data: userRoadmap, error: createError } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: userId,
          roadmap_id: roadmapId,
          language: normalizedLanguage,
          current_node_id: firstNodeId
        })
        .select();
      
      if (createError) throw createError;
      
      if (!userRoadmap || userRoadmap.length === 0) {
        throw new Error('Failed to create user roadmap');
      }
      
      console.log(`Created new user roadmap with ID: ${userRoadmap[0].id}`);
      return userRoadmap[0].id;
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      throw error;
    }
  }
  
  /**
   * Get nodes for a specific roadmap
   */
  async getRoadmapNodes(userRoadmapId: string): Promise<RoadmapNode[]> {
    console.log(`Fetching nodes for user roadmap: ${userRoadmapId}`);
    
    try {
      // Get the user roadmap record first
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', userRoadmapId)
        .single();
      
      if (userRoadmapError) throw userRoadmapError;
      
      // Get the roadmap nodes
      const { data: nodes, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language)
        .order('position');
      
      if (nodesError) throw nodesError;
      
      // Get user's progress for these nodes
      const userId = (await supabase.auth.getUser()).data.user!.id;
      const { data: progress, error: progressError } = await supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('roadmap_id', userRoadmap.roadmap_id);
      
      if (progressError) throw progressError;
      
      // Process nodes with progress information
      const processedNodes: RoadmapNode[] = nodes.map((node: any) => {
        // Find progress for this node
        const nodeProgress = progress?.find(p => p.node_id === node.id);
        
        // First node is always available
        let status: 'locked' | 'available' | 'completed' = 'locked';
        if (nodeProgress?.completed) {
          status = 'completed';
        } else if (node.position === 1) {
          status = 'available';
        } else {
          // Check if the previous node is completed to determine if this one is available
          const previousNode = nodes.find((n: any) => n.position === node.position - 1);
          if (previousNode) {
            const previousNodeProgress = progress?.find(p => p.node_id === previousNode.id);
            if (previousNodeProgress?.completed) {
              status = 'available';
            }
          }
        }
        
        return {
          id: node.id,
          title: node.title,
          description: node.description || '',
          position: node.position,
          roadmapId: node.roadmap_id,
          isBonus: node.is_bonus,
          language: node.language,
          defaultExerciseId: node.default_exercise_id,
          status,
          isCompleted: nodeProgress?.completed || false,
          createdAt: new Date(node.created_at),
          updatedAt: new Date(node.updated_at),
        };
      });
      
      return processedNodes;
    } catch (error) {
      console.error('Error getting roadmap nodes:', error);
      throw error;
    }
  }
  
  /**
   * Get exercise content for a specific node
   */
  async getNodeExerciseContent(nodeId: string) {
    console.log(`Fetching exercise content for node: ${nodeId}`);
    
    try {
      // First get the node to find the default exercise ID
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('default_exercise_id')
        .eq('id', nodeId)
        .single();
      
      if (nodeError) throw nodeError;
      
      if (!nodeData || !nodeData.default_exercise_id) {
        console.log(`No default exercise found for node: ${nodeId}`);
        return null;
      }
      
      // Get the exercise content
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('default_exercises')
        .select('*')
        .eq('id', nodeData.default_exercise_id)
        .single();
      
      if (exerciseError) throw exerciseError;
      
      return exerciseData;
    } catch (error) {
      console.error('Error getting node exercise content:', error);
      throw error;
    }
  }
  
  /**
   * Record node completion with accuracy
   */
  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<NodeCompletionResult> {
    console.log(`Recording node ${nodeId} completion with accuracy: ${accuracy}`);
    
    try {
      if (accuracy < 0 || accuracy > 100) {
        throw new Error("Accuracy must be between 0 and 100");
      }
      
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      // Get node info to find roadmap_id
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id, language')
        .eq('id', nodeId)
        .single();
      
      if (nodeError) throw nodeError;
      
      // Increment node completion using the database function
      const { error: incrementError } = await supabase
        .rpc('increment_node_completion', {
          node_id_param: nodeId,
          user_id_param: userId,
          language_param: nodeData.language,
          roadmap_id_param: nodeData.roadmap_id
        });
      
      if (incrementError) throw incrementError;
      
      // Get the updated node progress
      const { data: progressData, error: progressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('node_id', nodeId)
        .eq('language', nodeData.language)
        .single();
      
      if (progressError) throw progressError;
      
      return {
        completionCount: progressData.completion_count,
        isCompleted: progressData.is_completed,
        lastPracticedAt: new Date(progressData.last_practiced_at)
      };
    } catch (error) {
      console.error('Error recording node completion:', error);
      throw error;
    }
  }
  
  /**
   * Mark a node as completed (without accuracy check)
   */
  async markNodeCompleted(nodeId: string): Promise<void> {
    console.log(`Marking node ${nodeId} as completed`);
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      // Get node info to find roadmap_id
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id, language, position')
        .eq('id', nodeId)
        .single();
      
      if (nodeError) throw nodeError;
      
      // Mark as completed in roadmap_progress
      const { error: progressError } = await supabase
        .from('roadmap_progress')
        .insert({
          user_id: userId,
          roadmap_id: nodeData.roadmap_id,
          node_id: nodeId,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .match({ user_id: userId, roadmap_id: nodeData.roadmap_id, node_id: nodeId });
      
      if (progressError) throw progressError;
      
      // Mark as fully completed in the nodes_progress table too
      const { error: nodesProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .insert({
          user_id: userId,
          roadmap_id: nodeData.roadmap_id,
          node_id: nodeId,
          language: nodeData.language,
          completion_count: 3, // Mark as fully completed
          is_completed: true,
          last_practiced_at: new Date().toISOString()
        })
        .match({ user_id: userId, node_id: nodeId, language: nodeData.language });
      
      if (nodesProgressError) throw nodesProgressError;
      
      // Find the next node by position
      const { data: nextNodeData, error: nextNodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', nodeData.roadmap_id)
        .eq('language', nodeData.language)
        .eq('position', nodeData.position + 1)
        .limit(1);
      
      if (nextNodeError) throw nextNodeError;
      
      // Update the user_roadmap current node
      // If there's no next node, keep the current one
      if (nextNodeData && nextNodeData.length > 0) {
        const nextNodeId = nextNodeData[0].id;
        
        // Find the user_roadmap record
        const { data: userRoadmap, error: userRoadmapError } = await supabase
          .from('user_roadmaps')
          .select('id')
          .eq('user_id', userId)
          .eq('roadmap_id', nodeData.roadmap_id)
          .eq('language', nodeData.language)
          .single();
        
        if (userRoadmapError) throw userRoadmapError;
        
        // Update current node
        const { error: updateError } = await supabase
          .from('user_roadmaps')
          .update({ 
            current_node_id: nextNodeId,
            updated_at: new Date().toISOString()
          })
          .eq('id', userRoadmap.id);
        
        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error marking node as completed:', error);
      throw error;
    }
  }
}

export const roadmapService = new RoadmapService();
