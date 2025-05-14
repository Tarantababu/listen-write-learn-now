
import { supabase } from '@/integrations/supabase/client';
import { Language } from '@/types';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '../types';

class RoadmapService {
  /**
   * Get all available roadmaps for a specific language
   */
  async getRoadmapsForLanguage(language: Language): Promise<RoadmapItem[]> {
    try {
      // First get all roadmaps
      const { data: roadmapsData, error: roadmapsError } = await supabase
        .from('roadmaps')
        .select('*');
      
      if (roadmapsError) throw roadmapsError;
      
      // Then get roadmap languages to filter by the requested language
      const { data: languagesData, error: languagesError } = await supabase
        .from('roadmap_languages')
        .select('*')
        .eq('language', language);
      
      if (languagesError) throw languagesError;
      
      // Get roadmaps that have the requested language
      const roadmapIds = languagesData.map(item => item.roadmap_id);
      const filteredRoadmaps = roadmapsData.filter(roadmap => 
        roadmapIds.includes(roadmap.id)
      );
      
      return filteredRoadmaps.map(roadmap => ({
        id: roadmap.id,
        name: roadmap.name,
        level: roadmap.level,
        description: roadmap.description,
        language,
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
      return [];
    }
  }

  /**
   * Get all roadmaps that the current user is enrolled in
   */
  async getUserRoadmaps(language: Language): Promise<RoadmapItem[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');
      
      // Get user's roadmaps
      const { data: userRoadmapsData, error: userRoadmapsError } = await supabase
        .from('user_roadmaps')
        .select('*, roadmaps(*)')
        .eq('user_id', user.user.id)
        .eq('language', language);
      
      if (userRoadmapsError) throw userRoadmapsError;
      
      return userRoadmapsData.map(userRoadmap => ({
        id: userRoadmap.id,
        name: userRoadmap.roadmaps.name,
        level: userRoadmap.roadmaps.level,
        description: userRoadmap.roadmaps.description,
        language: userRoadmap.language,
        createdAt: new Date(userRoadmap.created_at),
        updatedAt: new Date(userRoadmap.updated_at),
        currentNodeId: userRoadmap.current_node_id,
        roadmapId: userRoadmap.roadmap_id
      }));
    } catch (error) {
      console.error('Error fetching user roadmaps:', error);
      return [];
    }
  }
  
  /**
   * Get nodes for a specific user roadmap
   */
  async getRoadmapNodes(userRoadmapId: string): Promise<RoadmapNode[]> {
    try {
      // First get the user roadmap to get the roadmap ID
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', userRoadmapId)
        .single();
      
      if (userRoadmapError) throw userRoadmapError;
      
      // Get nodes for this roadmap
      const { data: nodesData, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language)
        .order('position');
      
      if (nodesError) throw nodesError;
      
      // Get progress for these nodes
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');
      
      const { data: progressData, error: progressError } = await supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('roadmap_id', userRoadmap.roadmap_id);
      
      if (progressError) throw progressError;
      
      // Get the detailed node progress data
      const { data: nodeProgressData, error: nodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('roadmap_id', userRoadmap.roadmap_id);
      
      if (nodeProgressError) throw nodeProgressError;
      
      // Create a set of completed node IDs for quick lookup
      const completedNodeIds = new Set(
        progressData
          .filter(progress => progress.completed)
          .map(progress => progress.node_id)
      );
      
      // Process nodes to add UI state
      return nodesData.map((node, index) => {
        // Node is completed if it's in the completed set
        const isCompleted = completedNodeIds.has(node.id);
        
        // Node is current if it matches the current_node_id
        const isCurrent = userRoadmap.current_node_id === node.id;
        
        // Node is available if it's the first node, or the previous node is completed
        const isAvailable = index === 0 || 
          (index > 0 && completedNodeIds.has(nodesData[index - 1].id));
        
        // Determine the node status
        let status: 'locked' | 'available' | 'completed' | 'current' = 'locked';
        
        if (isCompleted) {
          status = 'completed';
        } else if (isCurrent) {
          status = 'current';
        } else if (isAvailable) {
          status = 'available';
        }
        
        // Find progress count for this node
        const nodeProgress = nodeProgressData?.find(np => np.node_id === node.id);
        
        return {
          id: node.id,
          roadmapId: node.roadmap_id,
          title: node.title,
          description: node.description || '',
          position: node.position,
          exerciseId: node.default_exercise_id,
          isBonus: node.is_bonus,
          language: node.language,
          createdAt: new Date(node.created_at),
          updatedAt: new Date(node.updated_at),
          status,
          progressCount: nodeProgress?.completion_count || 0
        };
      });
    } catch (error) {
      console.error('Error fetching roadmap nodes:', error);
      return [];
    }
  }
  
  /**
   * Get exercise content for a specific node
   */
  async getNodeExercise(nodeId: string): Promise<ExerciseContent | null> {
    try {
      // First get the node to find its associated exercise
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('id', nodeId)
        .single();
      
      if (nodeError) throw nodeError;
      if (!node.default_exercise_id) return null;
      
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
        language: exercise.language,
        tags: exercise.tags
      };
    } catch (error) {
      console.error('Error fetching node exercise:', error);
      return null;
    }
  }
  
  /**
   * Initialize a new roadmap for the user
   */
  async initializeRoadmap(roadmapId: string): Promise<string> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');
      
      // Get the roadmap details
      const { data: roadmap, error: roadmapError } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('id', roadmapId)
        .single();
      
      if (roadmapError) throw roadmapError;
      
      // Get the user's selected language from their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('selected_language')
        .eq('id', user.user.id)
        .single();
      
      if (profileError) throw profileError;
      
      // Create a user roadmap entry
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: user.user.id,
          roadmap_id: roadmapId,
          language: profile.selected_language
        })
        .select()
        .single();
      
      if (userRoadmapError) throw userRoadmapError;
      
      // Get the first node of the roadmap
      const { data: firstNode, error: firstNodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmapId)
        .eq('language', profile.selected_language)
        .order('position')
        .limit(1)
        .single();
      
      if (firstNodeError) throw firstNodeError;
      
      // Update the user roadmap with the first node
      const { error: updateError } = await supabase
        .from('user_roadmaps')
        .update({ current_node_id: firstNode.id })
        .eq('id', userRoadmap.id);
      
      if (updateError) throw updateError;
      
      return userRoadmap.id;
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      throw error;
    }
  }
  
  /**
   * Mark a node as completed
   */
  async completeNode(nodeId: string, userRoadmapId: string): Promise<NodeCompletionResult> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');
      
      // Get the user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', userRoadmapId)
        .single();
      
      if (userRoadmapError) throw userRoadmapError;
      
      // Check if the node is already completed
      const { data: existingProgress, error: existingProgressError } = await supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('node_id', nodeId)
        .maybeSingle();
      
      if (existingProgressError) throw existingProgressError;
      
      if (existingProgress?.completed) {
        // Node is already completed, nothing to do
        return { 
          isCompleted: true,
          completionCount: 3 // Maximum completion count
        };
      }
      
      // Create or update progress record
      if (existingProgress) {
        await supabase
          .from('roadmap_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);
      } else {
        await supabase
          .from('roadmap_progress')
          .insert({
            user_id: user.user.id,
            roadmap_id: userRoadmap.roadmap_id,
            node_id: nodeId,
            completed: true,
            completed_at: new Date().toISOString()
          });
      }
      
      // Find next node
      const { data: nodes, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language)
        .order('position');
      
      if (nodesError) throw nodesError;
      
      // Find current node index
      const currentNodeIndex = nodes.findIndex(node => node.id === nodeId);
      if (currentNodeIndex === -1) throw new Error('Node not found');
      
      // Check if there's a next node
      const nextNode = nodes[currentNodeIndex + 1];
      
      if (nextNode) {
        // Update user roadmap with next node
        await supabase
          .from('user_roadmaps')
          .update({ current_node_id: nextNode.id })
          .eq('id', userRoadmapId);
        
        return {
          isCompleted: true,
          nextNodeId: nextNode.id,
          completionCount: 3
        };
      }
      
      // This was the last node, roadmap is complete
      return {
        isCompleted: true,
        completionCount: 3
      };
    } catch (error) {
      console.error('Error completing node:', error);
      throw error;
    }
  }
}

export const roadmapService = new RoadmapService();
