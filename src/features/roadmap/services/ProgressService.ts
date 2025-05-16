
import { supabase } from '@/integrations/supabase/client';
import { RoadmapProgressData, ProgressResponse, NodeProgressDetails } from '../types/service-types';

export class ProgressService {
  async getRoadmapProgress(roadmapId: string): Promise<ProgressResponse> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }
      
      // Get the roadmap to get language
      const { data: roadmap, error: roadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', roadmapId)
        .single();
        
      if (roadmapError) throw roadmapError;
      
      // Get all nodes for the roadmap for counting total
      const { data: nodes, error: nodesError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmap.roadmap_id)
        .eq('language', roadmap.language);
        
      if (nodesError) throw nodesError;
      
      // Get completed nodes
      const { data: progress, error: progressError } = await supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('roadmap_id', roadmap.roadmap_id)
        .eq('completed', true);
        
      if (progressError) throw progressError;
      
      // Get detailed node progress
      const { data: nodeProgress, error: nodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('roadmap_id', roadmap.roadmap_id)
        .eq('language', roadmap.language);
        
      if (nodeProgressError) throw nodeProgressError;
      
      // Format the node progress details
      const nodeProgressDetails: Record<string, NodeProgressDetails> = {};
      
      nodeProgress?.forEach(node => {
        nodeProgressDetails[node.node_id] = {
          nodeId: node.node_id,
          completionCount: node.completion_count,
          isCompleted: node.is_completed,
          lastPracticedAt: node.last_practiced_at ? new Date(node.last_practiced_at) : undefined
        };
      });
      
      // Calculate completion percentage
      const totalNodes = nodes?.length || 0;
      const completedNodes = progress?.length || 0;
      const completionPercentage = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;
      
      return {
        success: true,
        data: {
          roadmapId,
          completedNodes: progress?.map(p => p.node_id) || [],
          nodeProgress: nodeProgressDetails,
          completionPercentage
        }
      };
    } catch (error) {
      console.error('Error getting roadmap progress:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting progress'
      };
    }
  }
  
  async resetProgress(roadmapId: string): Promise<ProgressResponse> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }
      
      // Get the user roadmap to find the original roadmap_id
      const { data: userRoadmap, error: roadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', roadmapId)
        .single();
        
      if (roadmapError) throw roadmapError;
      
      // Delete progress records
      const { error: progressError } = await supabase
        .from('roadmap_progress')
        .delete()
        .eq('user_id', userId)
        .eq('roadmap_id', userRoadmap.roadmap_id);
        
      if (progressError) throw progressError;
      
      // Delete detailed node progress
      const { error: nodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .delete()
        .eq('user_id', userId)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language);
        
      if (nodeProgressError) throw nodeProgressError;
      
      // Find first node in roadmap
      const { data: firstNode, error: firstNodeError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language)
        .order('position', { ascending: true })
        .limit(1)
        .single();
        
      if (firstNodeError) throw firstNodeError;
      
      // Update user roadmap to point to first node
      const { error: updateError } = await supabase
        .from('user_roadmaps')
        .update({
          current_node_id: firstNode.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', roadmapId);
        
      if (updateError) throw updateError;
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error resetting roadmap progress:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error resetting progress'
      };
    }
  }
}
