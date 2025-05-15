
import { supabase } from '@/integrations/supabase/client';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult, UserRoadmap } from '../types';
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
      
      return (data || []).map((item: any): RoadmapItem => ({
        id: item.id,
        name: item.name,
        level: item.level as LanguageLevel,
        description: item.description,
        languages: [], // Empty array as default
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));
    } catch (error) {
      console.error('Error getting roadmaps for language:', error);
      return [];
    }
  }
  
  /**
   * Get roadmaps that the current user has started for a specific language
   */
  async getUserRoadmaps(language: Language): Promise<UserRoadmap[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_roadmaps_by_language', {
          user_id_param: (await supabase.auth.getUser()).data.user?.id,
          requested_language: language
        });
        
      if (error) throw error;
      
      // Format the user roadmap data
      return (data || []).map((item: any): UserRoadmap => ({
        id: item.id,
        userId: item.user_id,
        roadmapId: item.roadmap_id,
        language: item.language as Language,
        currentNodeId: item.current_node_id,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        name: "Learning Path", // Required field
        level: "A1" as LanguageLevel, // Required field
        languages: [] // Required field
      }));
    } catch (error) {
      console.error('Error getting user roadmaps:', error);
      return [];
    }
  }
  
  /**
   * Initialize a new roadmap for the current user
   */
  async initializeRoadmap(level: LanguageLevel, language: Language): Promise<string> {
    try {
      // First check if the user is authenticated
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!userData.user) {
        throw new Error('User must be authenticated to initialize a roadmap');
      }
      
      const { data, error } = await supabase
        .rpc('get_roadmaps_by_language', {
          requested_language: language
        });
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error(`No roadmap found for language ${language}`);
      }
      
      // Take the first matching roadmap
      const matchingRoadmap = data.find((r: any) => r.level === level);
      if (!matchingRoadmap) {
        throw new Error(`No roadmap found for level ${level} and language ${language}`);
      }
      
      // Return a placeholder ID
      return matchingRoadmap.id;
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      throw error;
    }
  }
  
  /**
   * Get all nodes for a roadmap
   */
  async getRoadmapNodes(userRoadmapId: string): Promise<RoadmapNode[]> {
    try {
      // This is a stub implementation
      return [];
    } catch (error) {
      console.error('Error getting roadmap nodes:', error);
      return [];
    }
  }
  
  /**
   * Get exercise content for a roadmap node
   */
  async getNodeExerciseContent(nodeId: string): Promise<ExerciseContent | null> {
    try {
      // This is a stub implementation
      return null;
    } catch (error) {
      console.error('Error getting node exercise content:', error);
      return null;
    }
  }
  
  /**
   * Record completion of a node with an accuracy score
   */
  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<NodeCompletionResult> {
    try {
      // This is a stub implementation
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
   * Mark a node as completed
   */
  async markNodeAsCompleted(nodeId: string): Promise<void> {
    try {
      console.log('Marking node as completed:', nodeId);
      // This is a stub implementation
    } catch (error) {
      console.error('Error marking node as completed:', error);
      throw error;
    }
  }

  /**
   * Reset progress for a roadmap
   */
  async resetProgress(roadmapId: string): Promise<void> {
    try {
      console.log('Resetting progress for roadmap:', roadmapId);
      // This is a stub implementation
    } catch (error) {
      console.error('Error resetting progress:', error);
      throw error;
    }
  }
}

export const roadmapService = new RoadmapService();
