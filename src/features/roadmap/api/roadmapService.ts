import { supabase } from '@/integrations/supabase/client';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '../types';
import { Language, LanguageLevel } from '@/types';

class RoadmapService {
  /**
   * Get all roadmaps available for a specific language
   */
  async getRoadmapsForLanguage(language: Language): Promise<RoadmapItem[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_roadmaps_by_language', {
          requested_language: language
        });
        
      if (error) throw error;
      
      // Get all roadmap languages to associate with the roadmaps
      const { data: languagesData, error: languagesError } = await supabase
        .from('roadmap_languages')
        .select('roadmap_id, language');
        
      if (languagesError) throw languagesError;
      
      // Group languages by roadmap ID
      const languagesByRoadmap: Record<string, Language[]> = {};
      languagesData.forEach((langItem: any) => {
        if (!languagesByRoadmap[langItem.roadmap_id]) {
          languagesByRoadmap[langItem.roadmap_id] = [];
        }
        languagesByRoadmap[langItem.roadmap_id].push(langItem.language as Language);
      });
      
      return data.map((item: any): RoadmapItem => ({
        id: item.id,
        name: item.name,
        level: item.level as LanguageLevel,
        description: item.description,
        languages: languagesByRoadmap[item.id] || [],
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        createdBy: item.created_by,
      }));
    } catch (error) {
      console.error('Error getting roadmaps for language:', error);
      throw error;
    }
  }
  
  /**
   * Get roadmaps that the current user has started for a specific language
   */
  async getUserRoadmaps(language: Language): Promise<RoadmapItem[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_roadmaps_by_language', {
          user_id_param: (await supabase.auth.getUser()).data.user?.id,
          requested_language: language
        });
        
      if (error) throw error;
      
      // If no user roadmaps, return empty array
      if (!data || data.length === 0) {
        return [];
      }
      
      // Get detailed roadmap information for each user roadmap
      const roadmapIds = data.map((item: any) => item.roadmap_id);
      
      const { data: roadmapsData, error: roadmapsError } = await supabase
        .from('roadmaps')
        .select('*')
        .in('id', roadmapIds);
        
      if (roadmapsError) throw roadmapsError;
      
      // Create a map of roadmap data for easy lookup
      const roadmapMap: Record<string, any> = {};
      roadmapsData.forEach(roadmap => {
        roadmapMap[roadmap.id] = roadmap;
      });
      
      // Format the user roadmap data
      return data.map((item: any): RoadmapItem => {
        const roadmapDetails = roadmapMap[item.roadmap_id] || {};
        
        return {
          id: item.id,
          roadmapId: item.roadmap_id,
          name: roadmapDetails.name || 'Unnamed Roadmap',
          level: roadmapDetails.level as LanguageLevel || 'A1',
          description: roadmapDetails.description,
          language: item.language as Language,
          currentNodeId: item.current_node_id,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        };
      });
    } catch (error) {
      console.error('Error getting user roadmaps:', error);
      throw error;
    }
  }
  
  /**
   * Initialize a new roadmap for the current user
   */
  async initializeRoadmap(level: LanguageLevel, language: Language): Promise<string> {
    try {
      // Find a roadmap that matches the level and supports the language
      const { data: roadmapsData, error: roadmapsError } = await supabase
        .from('roadmaps')
        .select(`
          id,
          roadmap_languages!inner(language)
        `)
        .eq('level', level)
        .eq('roadmap_languages.language', language);
        
      if (roadmapsError) throw roadmapsError;
      
      if (!roadmapsData || roadmapsData.length === 0) {
        throw new Error(`No roadmap found for level ${level} and language ${language}`);
      }
      
      // Take the first matching roadmap
      const roadmapId = roadmapsData[0].id;
      
      // Create a new user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          roadmap_id: roadmapId,
          language: language
        })
        .select()
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Find first node of the roadmap to set as current
      const { data: firstNode, error: firstNodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .order('position', { ascending: true })
        .limit(1)
        .single();
        
      if (firstNodeError) {
        if (firstNodeError.code !== 'PGRST116') { // Not found
          throw firstNodeError;
        }
        // No nodes for this roadmap yet, that's okay
        return userRoadmap.id;
      }
      
      // Update user roadmap with first node
      if (firstNode) {
        const { error: updateError } = await supabase
          .from('user_roadmaps')
          .update({ current_node_id: firstNode.id })
          .eq('id', userRoadmap.id);
          
        if (updateError) throw updateError;
      }
      
      return userRoadmap.id;
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      throw error;
    }
  }
  
  /**
   * Get all nodes for a roadmap with their status
   */
  async getRoadmapNodes(userRoadmapId: string): Promise<RoadmapNode[]> {
    try {
      // First get the user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', userRoadmapId)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Get all nodes for this roadmap
      const { data: nodes, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language)
        .order('position', { ascending: true });
        
      if (nodesError) throw nodesError;
      
      // Get completed nodes for this user and roadmap
      const { data: progress, error: progressError } = await supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('roadmap_id', userRoadmap.roadmap_id);
        
      if (progressError) throw progressError;
      
      // Get detailed node progress
      const { data: nodeProgress, error: nodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language);
        
      if (nodeProgressError) throw nodeProgressError;
      
      // Create a map of node progress
      const nodeProgressMap: Record<string, any> = {};
      if (nodeProgress) {
        nodeProgress.forEach(item => {
          nodeProgressMap[item.node_id] = item;
        });
      }
      
      // Create a set of completed node IDs
      const completedNodeIds = new Set<string>();
      if (progress) {
        progress
          .filter(item => item.completed)
          .forEach(item => completedNodeIds.add(item.node_id));
      }
      
      // Mark nodes as completed from node_progress table as well
      if (nodeProgress) {
        nodeProgress
          .filter(item => item.is_completed)
          .forEach(item => completedNodeIds.add(item.node_id));
      }
      
      // Calculate available nodes based on completed nodes
      // A node is available if it's the first node or if the previous node is completed
      const availableNodeIds = new Set<string>();
      
      // Format and return the nodes with status information
      const formattedNodes: RoadmapNode[] = nodes.map((node, index) => {
        // First node is always available
        if (index === 0) {
          availableNodeIds.add(node.id);
        } 
        // Other nodes are available if previous node is completed
        else if (index > 0 && completedNodeIds.has(nodes[index - 1].id)) {
          availableNodeIds.add(node.id);
        }
        
        // Get node progress count
        const progressCount = nodeProgressMap[node.id]?.completion_count || 0;
        
        // Determine node status
        let status: 'locked' | 'available' | 'completed' | 'current' = 'locked';
        
        if (completedNodeIds.has(node.id)) {
          status = 'completed';
        } else if (node.id === userRoadmap.current_node_id) {
          status = 'current';
        } else if (availableNodeIds.has(node.id)) {
          status = 'available';
        }
        
        return {
          id: node.id,
          roadmapId: node.roadmap_id,
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
      console.error('Error getting roadmap nodes:', error);
      throw error;
    }
  }
  
  /**
   * Get exercise content for a roadmap node
   */
  async getNodeExerciseContent(nodeId: string): Promise<ExerciseContent | null> {
    try {
      // First get the node to get the default exercise ID
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
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
      // Get the node to get the roadmap ID
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id, position')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Get the user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('roadmap_id', node.roadmap_id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Only increment if accuracy is high enough (95% or better)
      if (accuracy >= 95) {
        // Call the function to increment node completion
        const { data, error } = await supabase
          .rpc('increment_node_completion', {
            node_id_param: nodeId,
            user_id_param: (await supabase.auth.getUser()).data.user?.id,
            language_param: userRoadmap.language,
            roadmap_id_param: node.roadmap_id
          });
          
        if (error) throw error;
        
        // Get updated node progress
        const { data: nodeProgress, error: nodeProgressError } = await supabase
          .from('roadmap_nodes_progress')
          .select('completion_count, is_completed')
          .eq('node_id', nodeId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();
          
        if (nodeProgressError) throw nodeProgressError;
        
        // Check if node is now completed
        if (nodeProgress.is_completed) {
          // Find next node in sequence
          const { data: nextNode, error: nextNodeError } = await supabase
            .from('roadmap_nodes')
            .select('id')
            .eq('roadmap_id', node.roadmap_id)
            .eq('language', userRoadmap.language)
            .eq('position', node.position + 1)
            .single();
            
          let nextNodeId = undefined;
          
          // Update current node if a next node was found
          if (!nextNodeError && nextNode) {
            nextNodeId = nextNode.id;
            
            const { error: updateError } = await supabase
              .from('user_roadmaps')
              .update({ 
                current_node_id: nextNode.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', userRoadmap.id);
              
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
      // Get the node to get the roadmap ID
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id, position')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Get the user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('roadmap_id', node.roadmap_id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Mark node as completed in roadmap_progress
      const { error: progressError } = await supabase
        .from('roadmap_progress')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          roadmap_id: node.roadmap_id,
          node_id: nodeId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (progressError) throw progressError;
      
      // Also mark as completed in roadmap_nodes_progress
      const { error: nodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          roadmap_id: node.roadmap_id,
          node_id: nodeId,
          language: userRoadmap.language,
          completion_count: 3, // Set to max
          is_completed: true,
          last_practiced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (nodeProgressError) throw nodeProgressError;
      
      // Find next node in sequence
      const { data: nextNode, error: nextNodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', node.roadmap_id)
        .eq('language', userRoadmap.language)
        .eq('position', node.position + 1)
        .single();
        
      // Update current node if a next node was found
      if (!nextNodeError && nextNode) {
        const { error: updateError } = await supabase
          .from('user_roadmaps')
          .update({ 
            current_node_id: nextNode.id,
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
