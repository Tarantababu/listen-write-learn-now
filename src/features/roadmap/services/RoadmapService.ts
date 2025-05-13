import { supabase } from '@/integrations/supabase/client';
import { Language, LanguageLevel } from '@/types';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult } from '../types';
import { adaptToRoadmapItem, adaptToRoadmapNode, adaptToExerciseContent } from '../utils/typeAdapters';

class RoadmapService {
  /**
   * Get all roadmaps available for a specific language
   */
  async getRoadmapsByLanguage(language: Language): Promise<{ status: string; data?: RoadmapItem[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*, roadmap_languages(language)')
        .order('level');

      if (error) throw error;

      // Filter to only include roadmaps that have this language
      const filteredRoadmaps = data.filter(roadmap => 
        roadmap.roadmap_languages.some((langItem: any) => langItem.language === language)
      );

      const roadmapItems: RoadmapItem[] = filteredRoadmaps.map(item => adaptToRoadmapItem({
        id: item.id,
        name: item.name,
        level: item.level,
        description: item.description,
        languages: item.roadmap_languages.map((lang: any) => lang.language),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        createdBy: item.created_by,
        language: language // Add the language field explicitly
      }));

      return { status: 'success', data: roadmapItems };
    } catch (error) {
      console.error('Error in getRoadmapsByLanguage:', error);
      return { status: 'error', error: (error as Error).message };
    }
  }

  /**
   * Get all user roadmaps for a specific language
   */
  async getUserRoadmaps(language: Language): Promise<{ status: string; data?: RoadmapItem[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_roadmaps')
        .select('*, roadmaps:roadmap_id(id, name, level, description)')
        .eq('language', language)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const roadmapItems: RoadmapItem[] = data.map(item => {
        // Convert the database field names to the expected property names
        return adaptToRoadmapItem({
          id: item.id,
          roadmapId: item.roadmap_id,
          name: item.roadmaps?.name || '',
          level: item.roadmaps?.level || 'A1',
          language: item.language,
          currentNodeId: item.current_node_id,
          userId: item.user_id,
          description: item.roadmaps?.description,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        });
      });

      return { status: 'success', data: roadmapItems };
    } catch (error) {
      console.error('Error in getUserRoadmaps:', error);
      return { status: 'error', error: (error as Error).message };
    }
  }

  /**
   * Initialize a new roadmap for the user
   */
  async initializeRoadmap(level: LanguageLevel, language: Language): Promise<{ status: string; data?: string; error?: string }> {
    try {
      // Get the roadmap template for this level and language
      const { data: roadmapTemplates, error: templateError } = await supabase
        .from('roadmaps')
        .select('id')
        .eq('level', level)
        .eq('is_template', true);

      if (templateError) throw templateError;
      if (!roadmapTemplates || roadmapTemplates.length === 0) {
        throw new Error(`No template found for level ${level}`);
      }

      const templateId = roadmapTemplates[0].id;

      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create a new user roadmap
      const { data: newRoadmap, error: roadmapError } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: user.id,
          roadmap_id: templateId,
          language: language
        })
        .select('id')
        .single();

      if (roadmapError) throw roadmapError;
      if (!newRoadmap) throw new Error('Failed to create roadmap');

      return { status: 'success', data: newRoadmap.id };
    } catch (error) {
      console.error('Error in initializeRoadmap:', error);
      return { status: 'error', error: (error as Error).message };
    }
  }

  /**
   * Get nodes for a specific roadmap
   */
  async getRoadmapNodes(roadmapId: string): Promise<{ status: string; data?: RoadmapNode[]; error?: string }> {
    try {
      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get the roadmap to find the template ID
      const { data: userRoadmap, error: roadmapError } = await supabase
        .from('user_roadmaps')
        .select('roadmap_id')
        .eq('id', roadmapId)
        .single();

      if (roadmapError) throw roadmapError;
      if (!userRoadmap) throw new Error('Roadmap not found');

      // Get the nodes for this roadmap template
      const { data: nodes, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .order('position');

      if (nodesError) throw nodesError;
      if (!nodes) throw new Error('No nodes found for this roadmap');

      // Get user progress for these nodes
      const { data: progress, error: progressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('node_id', nodes.map(node => node.id));

      if (progressError) throw progressError;

      // Get the current node ID from the user roadmap
      const { data: currentNodeData, error: currentNodeError } = await supabase
        .from('user_roadmaps')
        .select('current_node_id')
        .eq('id', roadmapId)
        .single();

      if (currentNodeError) throw currentNodeError;

      // Determine status for each node
      const nodesWithStatus: RoadmapNode[] = nodes.map(node => {
        const nodeProgress = progress?.find(p => p.node_id === node.id);
        let status: 'completed' | 'current' | 'locked' | 'available' = 'locked';

        // If node has progress and is completed
        if (nodeProgress?.is_completed) {
          status = 'completed';
        }
        // If this is the current node
        else if (node.id === currentNodeData?.current_node_id) {
          status = 'current';
        }
        // If previous node is completed, this one is available
        else {
          // Find previous node
          const prevNodeIndex = nodes.findIndex(n => n.id === node.id) - 1;
          if (prevNodeIndex < 0 || 
              progress?.some(p => p.node_id === nodes[prevNodeIndex].id && p.is_completed)) {
            status = 'available';
          }
        }

        return adaptToRoadmapNode({
          ...node,
          status,
          progressCount: nodeProgress?.completion_count || 0
        });
      });

      return { status: 'success', data: nodesWithStatus };
    } catch (error) {
      console.error('Error in getRoadmapNodes:', error);
      return { status: 'error', error: (error as Error).message };
    }
  }

  /**
   * Get exercise content for a node
   */
  async getNodeExerciseContent(nodeId: string): Promise<ExerciseContent | null> {
    try {
      // Get the node to find the default exercise ID
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('default_exercise_id')
        .eq('id', nodeId)
        .single();

      if (nodeError) throw nodeError;
      if (!node || !node.default_exercise_id) return null;

      // Get the exercise content
      const { data: exercise, error: exerciseError } = await supabase
        .from('default_exercises')
        .select('*')
        .eq('id', node.default_exercise_id)
        .single();

      if (exerciseError) throw exerciseError;
      if (!exercise) return null;

      // Check if there's a reading analysis for this exercise
      const { data: analysis } = await supabase
        .from('reading_analyses')
        .select('id')
        .eq('exercise_id', `roadmap-${nodeId}`)
        .maybeSingle();

      return adaptToExerciseContent({
        ...exercise,
        readingAnalysisId: analysis?.id
      });
    } catch (error) {
      console.error('Error in getNodeExerciseContent:', error);
      return null;
    }
  }

  /**
   * Record node completion with accuracy
   */
  async recordNodeCompletion(
    nodeId: string, 
    accuracy: number
  ): Promise<NodeCompletionResult> {
    try {
      // Get node and roadmap information
      const { data: nodeData } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id')
        .eq('id', nodeId)
        .single();
      
      if (!nodeData) throw new Error('Node not found');
      
      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check for existing progress record
      const { data: existingProgress } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('node_id', nodeId)
        .eq('user_id', user.id)
        .maybeSingle();

      const now = new Date().toISOString();
      
      // Update or create progress record
      if (existingProgress) {
        // If node is already completed, just return the data
        if (existingProgress.is_completed) {
          return {
            isCompleted: true,
            completionCount: existingProgress.completion_count
          };
        }
        
        // Otherwise increment the completion count
        const newCount = existingProgress.completion_count + 1;
        const isCompleted = newCount >= 3;
        
        await supabase
          .from('roadmap_nodes_progress')
          .update({
            completion_count: newCount,
            is_completed: isCompleted,
            last_practiced_at: now
          })
          .eq('id', existingProgress.id);
          
        return {
          isCompleted,
          completionCount: newCount
        };
      } else {
        // Create a new progress record
        await supabase
          .from('roadmap_nodes_progress')
          .insert({
            user_id: user.id,
            roadmap_id: nodeData.roadmap_id,
            node_id: nodeId,
            completion_count: 1,
            is_completed: false,
            language: 'english', // Default language
            last_practiced_at: now
          });
          
        return {
          isCompleted: false,
          completionCount: 1
        };
      }
    } catch (error) {
      console.error('Error in recordNodeCompletion:', error);
      return {
        isCompleted: false,
        completionCount: 0
      };
    }
  }

  /**
   * Mark a node as completed
   */
  async markNodeCompleted(nodeId: string): Promise<{ status: string; error?: string }> {
    try {
      // Get node and roadmap information
      const { data: nodeData } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id')
        .eq('id', nodeId)
        .single();
      
      if (!nodeData) throw new Error('Node not found');
      
      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update or create progress record
      const { data: existingProgress } = await supabase
        .from('roadmap_nodes_progress')
        .select('id')
        .eq('node_id', nodeId)
        .eq('user_id', user.id)
        .maybeSingle();

      const now = new Date().toISOString();
      
      if (existingProgress) {
        await supabase
          .from('roadmap_nodes_progress')
          .update({
            completion_count: 3,
            is_completed: true,
            last_practiced_at: now
          })
          .eq('id', existingProgress.id);
      } else {
        await supabase
          .from('roadmap_nodes_progress')
          .insert({
            user_id: user.id,
            roadmap_id: nodeData.roadmap_id,
            node_id: nodeId,
            completion_count: 3,
            is_completed: true,
            language: 'english', // Default language
            last_practiced_at: now
          });
      }
      
      return { status: 'success' };
    } catch (error) {
      console.error('Error in markNodeCompleted:', error);
      return { status: 'error', error: (error as Error).message };
    }
  }

  /**
   * Get the next node in a roadmap
   */
  async getNextNode(nodeId: string): Promise<{ status: string; data?: string; error?: string }> {
    try {
      // Get the current node to find its position and roadmap
      const { data: currentNode, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('position, roadmap_id')
        .eq('id', nodeId)
        .single();

      if (nodeError) throw nodeError;
      if (!currentNode) throw new Error('Node not found');

      // Find the next node by position
      const { data: nextNodes, error: nextNodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', currentNode.roadmap_id)
        .gt('position', currentNode.position)
        .order('position', { ascending: true })
        .limit(1);

      if (nextNodeError) throw nextNodeError;
      if (!nextNodes || nextNodes.length === 0) {
        return { status: 'success', data: undefined }; // No next node
      }

      return { status: 'success', data: nextNodes[0].id };
    } catch (error) {
      console.error('Error in getNextNode:', error);
      return { status: 'error', error: (error as Error).message };
    }
  }

  /**
   * Update the current node for a user roadmap
   */
  async updateCurrentNode(roadmapId: string, nodeId: string): Promise<{ status: string; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_roadmaps')
        .update({ current_node_id: nodeId })
        .eq('id', roadmapId);

      if (error) throw error;
      return { status: 'success' };
    } catch (error) {
      console.error('Error in updateCurrentNode:', error);
      return { status: 'error', error: (error as Error).message };
    }
  }
}

export const roadmapService = new RoadmapService();
