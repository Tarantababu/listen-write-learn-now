import { Language, LanguageLevel } from '@/types';
import { RoadmapItem, RoadmapNode, ExerciseContent } from '../types';
import { supabase } from '@/integrations/supabase/client';

// Define a more comprehensive RoadmapService interface
class RoadmapService {
  // Get all roadmaps for a given language
  async getRoadmapsByLanguage(language: Language) {
    try {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*, roadmap_languages(language)')
        .eq('roadmap_languages.language', language);

      if (error) throw error;

      // Transform the data to match RoadmapItem interface
      const roadmaps: RoadmapItem[] = data.map(roadmap => ({
        id: roadmap.id,
        name: roadmap.name,
        level: roadmap.level as LanguageLevel, // Cast string to LanguageLevel
        language: language,
        languages: roadmap.roadmap_languages?.map((rl: any) => rl.language) || [language],
        description: roadmap.description || ''
      }));
      
      return { 
        status: 'success' as const, 
        data: roadmaps, 
        error: null 
      };
    } catch (error) {
      console.error('Error getting roadmaps:', error);
      return { 
        status: 'error' as const, 
        data: null, 
        error: 'Failed to fetch roadmaps' 
      };
    }
  }

  // Get user roadmaps for a language
  async getUserRoadmaps(language: Language) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_roadmaps')
        .select(`
          id,
          roadmap_id,
          language,
          current_node_id,
          roadmaps(id, name, level, description)
        `)
        .eq('user_id', userData.user.id)
        .eq('language', language);

      if (error) throw error;

      // Transform the data to match RoadmapItem interface
      const userRoadmaps: RoadmapItem[] = data.map(item => ({
        id: item.id,
        roadmapId: item.roadmap_id,
        name: item.roadmaps?.name || 'Learning Path',
        level: item.roadmaps?.level || 'A1',
        language: item.language as Language, // Cast string to Language type
        currentNodeId: item.current_node_id,
        userId: userData.user.id,
        description: item.roadmaps?.description || ''
      }));
      
      return { 
        status: 'success' as const, 
        data: userRoadmaps, 
        error: null 
      };
    } catch (error) {
      console.error('Error getting user roadmaps:', error);
      return { 
        status: 'error' as const, 
        data: null, 
        error: 'Failed to fetch user roadmaps' 
      };
    }
  }

  // Get nodes for a roadmap
  async getRoadmapNodes(roadmapId: string) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      // First get the user roadmap to find the roadmap_id
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('roadmap_id, current_node_id')
        .eq('id', roadmapId)
        .single();

      if (userRoadmapError) throw userRoadmapError;

      // Get all nodes for this roadmap
      const { data: nodes, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .order('position', { ascending: true });

      if (nodesError) throw nodesError;

      // Get progress for these nodes
      const { data: progress, error: progressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', userRoadmap.roadmap_id);

      if (progressError) throw progressError;

      // Transform nodes with progress information
      const nodesWithStatus: RoadmapNode[] = nodes.map(node => {
        const nodeProgress = progress?.find(p => p.node_id === node.id);
        
        // Determine node status
        let status: 'completed' | 'current' | 'locked' | 'available' = 'locked';
        
        if (nodeProgress?.is_completed) {
          status = 'completed';
        } else if (node.id === userRoadmap.current_node_id) {
          status = 'current';
        } else if (node.position === 0 || progress?.some(p => 
          p.is_completed && 
          nodes.find(n => n.id === p.node_id)?.position === node.position - 1
        )) {
          status = 'available';
        }

        return {
          id: node.id,
          title: node.title,
          description: node.description || '',
          position: node.position,
          isBonus: node.is_bonus || false,
          language: node.language || 'english',
          roadmapId: node.roadmap_id,
          status,
          progressCount: nodeProgress?.completion_count || 0
        };
      });

      return { 
        status: 'success' as const, 
        data: nodesWithStatus, 
        error: null 
      };
    } catch (error) {
      console.error('Error getting roadmap nodes:', error);
      return { 
        status: 'error' as const, 
        data: null, 
        error: 'Failed to fetch roadmap nodes' 
      };
    }
  }

  // Initialize a roadmap for a user
  async initializeRoadmap(level: LanguageLevel, language: Language) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      // Find a roadmap with the specified level and language
      const { data: roadmaps, error: roadmapsError } = await supabase
        .from('roadmaps')
        .select('id, roadmap_languages!inner(language)')
        .eq('level', level)
        .eq('roadmap_languages.language', language);

      if (roadmapsError) throw roadmapsError;
      
      if (!roadmaps || roadmaps.length === 0) {
        throw new Error(`No roadmap found for level ${level} and language ${language}`);
      }

      // Use the first matching roadmap
      const roadmapId = roadmaps[0].id;

      // Get the first node of this roadmap to set as current
      const { data: firstNode, error: firstNodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmapId)
        .order('position', { ascending: true })
        .limit(1)
        .single();

      if (firstNodeError && firstNodeError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is fine if there are no nodes yet
        throw firstNodeError;
      }

      // Create user roadmap
      const { data: userRoadmap, error: createError } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: userData.user.id,
          roadmap_id: roadmapId,
          language: language,
          current_node_id: firstNode?.id || null
        })
        .select('id')
        .single();

      if (createError) throw createError;

      return { 
        status: 'success' as const, 
        data: userRoadmap.id, 
        error: null 
      };
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      return { 
        status: 'error' as const, 
        data: null, 
        error: 'Failed to initialize roadmap' 
      };
    }
  }

  // Get exercise content for a node
  async getNodeExerciseContent(nodeId: string): Promise<ExerciseContent | null> {
    try {
      // First, check if node has a default exercise attached
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('default_exercise_id')
        .eq('id', nodeId)
        .single();

      if (nodeError) throw nodeError;
      
      if (nodeData?.default_exercise_id) {
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('default_exercises')
          .select('*')
          .eq('id', nodeData.default_exercise_id)
          .single();

        if (exerciseError) throw exerciseError;
        
        if (exerciseData) {
          // Check if there's a reading analysis for this exercise
          const { data: analysisData } = await supabase
            .from('reading_analyses')
            .select('id')
            .eq('exercise_id', `roadmap-${nodeId}`)
            .maybeSingle();
          
          return {
            id: exerciseData.id,
            title: exerciseData.title,
            text: exerciseData.text,
            language: exerciseData.language,
            audioUrl: exerciseData.audio_url,
            readingAnalysisId: analysisData?.id || null,
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting node exercise content:', error);
      return null;
    }
  }

  // Record node completion with accuracy
  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<{ isCompleted: boolean, completionCount: number, nextNodeId?: string }> {
    try {
      if (accuracy < 95) {
        return { isCompleted: false, completionCount: 0 };
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      // Get the node to find its roadmap
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id, position')
        .eq('id', nodeId)
        .single();

      if (nodeError) throw nodeError;

      // Check if there's existing progress for this node
      const { data: existingProgress, error: progressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('node_id', nodeId)
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (progressError) throw progressError;

      let completionCount = 1;
      let isCompleted = false;
      let nextNodeId: string | undefined = undefined;

      // Update or create progress record
      if (existingProgress) {
        // If completion_count is already 3, nothing more to do
        if (existingProgress.completion_count >= 3) {
          return { 
            isCompleted: true,
            completionCount: existingProgress.completion_count,
            nextNodeId: await this.getNextNodeId(nodeId, nodeData.roadmap_id)
          };
        }

        completionCount = existingProgress.completion_count + 1;
        isCompleted = completionCount >= 3;

        // Update the progress record
        const { error: updateError } = await supabase
          .from('roadmap_nodes_progress')
          .update({
            completion_count: completionCount,
            is_completed: isCompleted,
            last_practiced_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);

        if (updateError) throw updateError;
      } else {
        // Create new progress record with completion_count = 1
        const { error: insertError } = await supabase
          .from('roadmap_nodes_progress')
          .insert({
            user_id: userData.user.id,
            roadmap_id: nodeData.roadmap_id,
            node_id: nodeId,
            completion_count: 1,
            is_completed: false,
            last_practiced_at: new Date().toISOString(),
            language: userRoadmap.language // Add the language field
          });

        if (insertError) throw insertError;
      }

      // If newly completed, update user_roadmap current_node_id to next node
      if (isCompleted) {
        nextNodeId = await this.getNextNodeId(nodeId, nodeData.roadmap_id);
        
        if (nextNodeId) {
          // Find the user roadmap for this roadmap
          const { data: userRoadmap, error: userRoadmapError } = await supabase
            .from('user_roadmaps')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('roadmap_id', nodeData.roadmap_id)
            .single();

          if (userRoadmapError) throw userRoadmapError;

          // Update the current node
          const { error: updateError } = await supabase
            .from('user_roadmaps')
            .update({
              current_node_id: nextNodeId
            })
            .eq('id', userRoadmap.id);

          if (updateError) throw updateError;
        }
      }

      return { 
        isCompleted,
        completionCount,
        nextNodeId
      };
    } catch (error) {
      console.error('Error recording node completion:', error);
      throw error;
    }
  }

  // Mark a node as completed
  async markNodeCompleted(nodeId: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      // Get the node to find its roadmap
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id')
        .eq('id', nodeId)
        .single();

      if (nodeError) throw nodeError;

      // Update or create progress record
      const { data: existingProgress, error: progressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('id')
        .eq('node_id', nodeId)
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (progressError) throw progressError;

      if (existingProgress) {
        // Update existing record
        await supabase
          .from('roadmap_nodes_progress')
          .update({
            completion_count: 3,
            is_completed: true,
            last_practiced_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);
      } else {
        // Create new record
        await supabase
          .from('roadmap_nodes_progress')
          .insert({
            user_id: userData.user.id,
            roadmap_id: nodeData.roadmap_id,
            node_id: nodeId,
            completion_count: 3,
            is_completed: true,
            last_practiced_at: new Date().toISOString(),
            language: userRoadmap.language // Add the language field
          });
      }

      // Find next node and update user roadmap
      const nextNodeId = await this.getNextNodeId(nodeId, nodeData.roadmap_id);
      
      if (nextNodeId) {
        // Find the user roadmap for this roadmap
        const { data: userRoadmap, error: userRoadmapError } = await supabase
          .from('user_roadmaps')
          .select('id')
          .eq('user_id', userData.user.id)
          .eq('roadmap_id', nodeData.roadmap_id)
          .single();

        if (userRoadmapError) throw userRoadmapError;

        // Update the current node
        await supabase
          .from('user_roadmaps')
          .update({
            current_node_id: nextNodeId
          })
          .eq('id', userRoadmap.id);
      }
    } catch (error) {
      console.error('Error marking node as completed:', error);
      throw error;
    }
  }

  // Helper method to get the next node ID
  private async getNextNodeId(currentNodeId: string, roadmapId: string): Promise<string | undefined> {
    try {
      // Get current node's position
      const { data: currentNode, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('position')
        .eq('id', currentNodeId)
        .single();

      if (nodeError) throw nodeError;

      // Find the next node based on position
      const { data: nextNodes, error: nextNodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmapId)
        .gt('position', currentNode.position)
        .order('position', { ascending: true })
        .limit(1);

      if (nextNodeError) throw nextNodeError;

      return nextNodes && nextNodes.length > 0 ? nextNodes[0].id : undefined;
    } catch (error) {
      console.error('Error finding next node:', error);
      return undefined;
    }
  }
}

export const roadmapService = new RoadmapService();
