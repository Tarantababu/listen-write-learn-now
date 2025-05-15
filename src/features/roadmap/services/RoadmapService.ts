import { supabase } from '@/integrations/supabase/client';
import { RoadmapItem, RoadmapNode, ExerciseContent, NodeCompletionResult, UserRoadmap } from '../types';
import { Language, LanguageLevel } from '@/types';
import { toast } from '@/components/ui/use-toast';

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
      
      console.log(`Initializing roadmap for user ${userData.user.id}, level ${level}, language ${language}`);
      
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
      
      // Handle the case where no roadmap is found for the specified language
      if (!roadmapsData || roadmapsData.length === 0) {
        // Check if we have roadmaps for any languages (to find a fallback)
        const { data: anyRoadmapsData, error: anyRoadmapsError } = await supabase
          .from('roadmaps')
          .select('id, level')
          .eq('level', level)
          .limit(1);
          
        if (anyRoadmapsError) throw anyRoadmapsError;
        
        if (!anyRoadmapsData || anyRoadmapsData.length === 0) {
          // No roadmaps found at all for this level - throw a more descriptive error
          const errorMessage = `No roadmap found for level ${level} and language ${language}. Please try a different level or language.`;
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
        
        // We found a roadmap for this level but not for this language
        // Return a special error code that can be handled by the UI
        throw {
          code: 'ROADMAP_NOT_AVAILABLE_FOR_LANGUAGE',
          message: `No roadmap is available for ${language} at level ${level}. Try English instead.`,
          suggestedLanguage: 'english'
        };
      }
      
      // Take the first matching roadmap
      const roadmapId = roadmapsData[0].id;
      
      // Check if the user already has this roadmap
      const { data: existingRoadmap, error: existingError } = await supabase
        .from('user_roadmaps')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .maybeSingle();
        
      if (existingError) throw existingError;
      
      // If the user already has this roadmap, return its ID
      if (existingRoadmap) {
        return existingRoadmap.id;
      }
      
      // Create a new user roadmap - explicitly associate it with the current authenticated user
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: userData.user.id,
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
      
      console.log(`Created roadmap for user ${userData.user.id}, roadmap ID: ${userRoadmap.id}`);
      return userRoadmap.id;
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
      // First, we need to get the user's roadmap to get the language
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      // Get the node to find its roadmap
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Get the user roadmap
      const { data: userRoadmap, error: roadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('user_id', userId)
        .eq('roadmap_id', nodeData.roadmap_id)
        .single();
        
      if (roadmapError) throw roadmapError;
      
      // Call the RPC function with the correct parameters
      // Fix the type error by casting to Language
      const { error: incrementError } = await supabase
        .rpc('increment_node_completion', {
          node_id_param: nodeId,
          user_id_param: userId,
          language_param: userRoadmap.language as Language,
          roadmap_id_param: nodeData.roadmap_id
        });
        
      if (incrementError) throw incrementError;
      
      // Get the updated node progress
      const { data: progressData, error: progressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('node_id', nodeId)
        .eq('language', userRoadmap.language)
        .single();
        
      if (progressError) throw progressError;
      
      return {
        isCompleted: progressData.is_completed,
        completionCount: progressData.completion_count
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
      // First check if the user is authenticated
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!userData.user) {
        throw new Error('User must be authenticated to reset roadmap progress');
      }
      
      console.log('Resetting progress for roadmap:', roadmapId);
      
      // Delete all progress for this user and roadmap
      const { error: progressError } = await supabase
        .from('roadmap_progress')
        .delete()
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', roadmapId);
        
      if (progressError) throw progressError;
      
      // Also delete node progress
      const { error: nodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .delete()
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', roadmapId);
        
      if (nodeProgressError) throw nodeProgressError;
      
      // Get first node of roadmap
      const { data: firstNode, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmapId)
        .order('position', { ascending: true })
        .limit(1)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Update user roadmap to set current node to first node
      const { error: updateError } = await supabase
        .from('user_roadmaps')
        .update({ current_node_id: firstNode.id })
        .eq('roadmap_id', roadmapId)
        .eq('user_id', userData.user.id);
        
      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error resetting progress:', error);
      throw error;
    }
  }
}

export const roadmapService = new RoadmapService();
