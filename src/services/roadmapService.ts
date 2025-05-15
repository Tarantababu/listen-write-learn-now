import { supabase } from '@/integrations/supabase/client';
import { 
  RoadmapItem, 
  UserRoadmap,
  RoadmapNodeProgress,
  RoadmapProgress
} from '@/features/roadmap/types';
import { RoadmapNode, Language, LanguageLevel } from '@/types';

class RoadmapService {
  // Get all roadmaps
  async getRoadmaps(): Promise<RoadmapItem[]> {
    try {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*');
        
      if (error) throw error;
      
      // Get all roadmap languages
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
      
      return data.map((roadmap: any): RoadmapItem => ({
        id: roadmap.id,
        name: roadmap.name,
        level: roadmap.level as LanguageLevel,
        description: roadmap.description,
        languages: languagesByRoadmap[roadmap.id] || [],
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at),
        createdBy: roadmap.created_by
      }));
    } catch (error) {
      console.error('Error getting roadmaps:', error);
      throw error;
    }
  }
  
  // Get user roadmaps for language
  async getUserRoadmaps(language: Language = 'english'): Promise<UserRoadmap[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      // First get user roadmaps
      const { data, error } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('language', language as string)
        .eq('user_id', userData.user.id);
        
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      // Get detailed roadmap info for each user roadmap
      const roadmapIds = data.map(item => item.roadmap_id);
      
      const { data: roadmapsData, error: roadmapsError } = await supabase
        .from('roadmaps')
        .select('*')
        .in('id', roadmapIds);
        
      if (roadmapsError) throw roadmapsError;
      
      // Create a map of roadmap data
      const roadmapMap: Record<string, any> = {};
      roadmapsData.forEach(roadmap => {
        roadmapMap[roadmap.id] = roadmap;
      });
      
      // Format user roadmap data
      return data.map((item): UserRoadmap => {
        const roadmapDetails = roadmapMap[item.roadmap_id] || {};
        
        return {
          id: item.id,
          userId: item.user_id,
          roadmapId: item.roadmap_id,
          name: roadmapDetails.name || 'Unnamed Roadmap',
          level: (roadmapDetails.level || 'A1') as LanguageLevel,
          description: roadmapDetails.description,
          language: item.language as Language,
          currentNodeId: item.current_node_id,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at || item.created_at),
          languages: [] // Add empty languages array
        };
      });
    } catch (error) {
      console.error('Error getting user roadmaps:', error);
      return [];
    }
  }

  // Get a specific user roadmap by ID
  async getUserRoadmap(userRoadmapId: string): Promise<UserRoadmap | null> {
    try {
      const { data, error } = await supabase
        .from('user_roadmaps')
        .select('*, roadmaps(*)')
        .eq('id', userRoadmapId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      if (!data) return null;
      
      return {
        id: data.id,
        userId: data.user_id,
        roadmapId: data.roadmap_id,
        name: data.roadmaps?.name || 'Unnamed Roadmap',
        level: (data.roadmaps?.level || 'A1') as LanguageLevel,
        description: data.roadmaps?.description,
        language: data.language,
        currentNodeId: data.current_node_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at || data.created_at),
      };
    } catch (error) {
      console.error('Error getting user roadmap:', error);
      throw error;
    }
  }

  // Initialize a new roadmap for the user
  async initializeRoadmap(level: LanguageLevel, language: Language): Promise<string | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      // Find roadmap for level and language
      const { data: roadmapsData, error: roadmapsError } = await supabase
        .from('roadmaps')
        .select(`
          id,
          roadmap_languages!inner(language)
        `)
        .eq('level', level)
        .eq('roadmap_languages.language', language as string);
        
      if (roadmapsError) throw roadmapsError;
      
      if (!roadmapsData || roadmapsData.length === 0) {
        console.warn(`No roadmap found for level ${level} and language ${language}`);
        return null;
      }
      
      const roadmapId = roadmapsData[0].id;
      
      // Check if user already has this roadmap
      const { data: existingRoadmap } = await supabase
        .from('user_roadmaps')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .maybeSingle();
        
      if (existingRoadmap) {
        return existingRoadmap.id;
      }
      
      // Create new user roadmap
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
      
      // Find first node
      const { data: firstNode } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmapId)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();
        
      // Update user roadmap with first node if exists
      if (firstNode) {
        await supabase
          .from('user_roadmaps')
          .update({ current_node_id: firstNode.id })
          .eq('id', userRoadmap.id);
      }
      
      return userRoadmap.id;
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      throw error;
    }
  }

  // Get all nodes for a roadmap
  async getRoadmapNodes(roadmapId: string): Promise<RoadmapNode[]> {
    try {
      const { data, error } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', roadmapId)
        .order('position', { ascending: true });
        
      if (error) throw error;
      
      return (data || []).map((node): RoadmapNode => ({
        id: node.id,
        roadmapId: node.roadmap_id,
        title: node.title,
        description: node.description,
        position: node.position,
        isBonus: node.is_bonus,
        defaultExerciseId: node.default_exercise_id,
        language: node.language,
        createdAt: new Date(node.created_at),
        updatedAt: new Date(node.updated_at),
      }));
    } catch (error) {
      console.error('Error getting roadmap nodes:', error);
      throw error;
    }
  }

  // Get progress for a roadmap
  async getRoadmapProgress(userRoadmapId: string): Promise<{ 
    progress: RoadmapProgress[],
    nodeProgress: RoadmapNodeProgress[]
  }> {
    try {
      // First get the user roadmap to get its roadmap_id
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', userRoadmapId)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      // Get completed nodes
      const { data: progressData, error: progressError } = await supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', userRoadmap.roadmap_id);
        
      if (progressError) throw progressError;
      
      // Get node progress
      const { data: nodeProgressData, error: nodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language);
        
      if (nodeProgressError) throw nodeProgressError;
      
      return {
        progress: (progressData || []).map((p): RoadmapProgress => ({
          id: p.id,
          userId: p.user_id,
          roadmapId: p.roadmap_id,
          nodeId: p.node_id,
          completed: p.completed,
          completedAt: p.completed_at ? new Date(p.completed_at) : undefined,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at || p.created_at),
        })),
        nodeProgress: (nodeProgressData || []).map((np): RoadmapNodeProgress => ({
          id: np.id,
          userId: np.user_id,
          roadmapId: np.roadmap_id,
          nodeId: np.node_id,
          language: np.language as Language,
          completionCount: np.completion_count,
          isCompleted: np.is_completed,
          lastPracticedAt: np.last_practiced_at ? new Date(np.last_practiced_at) : undefined,
          createdAt: new Date(np.created_at),
          updatedAt: new Date(np.updated_at || np.created_at),
        })),
      };
    } catch (error) {
      console.error('Error getting roadmap progress:', error);
      throw error;
    }
  }

  // Record completion of a node practice session
  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      // Find the node to get the roadmap ID
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id, language')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Find user roadmap with this node
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('id, language')
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', node.roadmap_id)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Use the function to increment completion count
      const { error: incrementError } = await supabase.rpc(
        'increment_node_completion',
        {
          node_id_param: nodeId,
          user_id_param: userData.user.id,
          language_param: userRoadmap.language,
          roadmap_id_param: node.roadmap_id
        }
      );
        
      if (incrementError) throw incrementError;
    } catch (error) {
      console.error('Error recording node completion:', error);
      throw error;
    }
  }

  // Mark a node as completed and return the next node if any
  async markNodeAsCompleted(nodeId: string): Promise<{ nextNodeId?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      // Find the node to get the roadmap ID and position
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id, position')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // Find user roadmap for this roadmap
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', node.roadmap_id)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Mark as completed
      const { error: progressError } = await supabase
        .from('roadmap_progress')
        .insert({
          user_id: userData.user.id,
          roadmap_id: node.roadmap_id,
          node_id: nodeId,
          completed: true,
          completed_at: new Date().toISOString()
        });
      
      if (progressError) {
        // Try update if insert fails - use upsert properly
        const { error: upsertError } = await supabase
          .from('roadmap_progress')
          .upsert({
            user_id: userData.user.id,
            roadmap_id: node.roadmap_id,
            node_id: nodeId,
            completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'user_id,roadmap_id,node_id' 
          });
          
        if (upsertError) throw upsertError;
      }
      
      // Find next node
      const { data: nextNode } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', node.roadmap_id)
        .eq('position', node.position + 1)
        .maybeSingle();
        
      // Update user roadmap with next node
      if (nextNode) {
        await supabase
          .from('user_roadmaps')
          .update({ current_node_id: nextNode.id })
          .eq('id', userRoadmap.id);
      }
      
      return { nextNodeId: nextNode?.id };
    } catch (error) {
      console.error('Error marking node as completed:', error);
      throw error;
    }
  }

  // Reset progress for a roadmap
  async resetProgress(userRoadmapId: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      // Get the user roadmap to get its roadmap_id
      const { data: userRoadmap, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('roadmap_id')
        .eq('id', userRoadmapId)
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Delete from roadmap_progress
      const { error: deleteProgressError } = await supabase
        .from('roadmap_progress')
        .delete()
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', userRoadmap.roadmap_id);
        
      if (deleteProgressError) throw deleteProgressError;
      
      // Delete from roadmap_nodes_progress
      const { error: deleteNodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .delete()
        .eq('user_id', userData.user.id)
        .eq('roadmap_id', userRoadmap.roadmap_id);
        
      if (deleteNodeProgressError) throw deleteNodeProgressError;
      
      // Set current node to the first node
      const { data: firstNode } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .order('position', { ascending: true })
        .limit(1)
        .single();
        
      if (firstNode) {
        await supabase
          .from('user_roadmaps')
          .update({ current_node_id: firstNode.id })
          .eq('id', userRoadmapId);
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
      throw error;
    }
  }

  // Get exercise for a node
  async getNodeExercise(nodeId: string): Promise<any> {
    try {
      // Get the node to find its default exercise
      const { data: node, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('default_exercise_id')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      if (!node.default_exercise_id) {
        throw new Error('No default exercise found for this node');
      }
      
      // Get the default exercise
      const { data: exercise, error: exerciseError } = await supabase
        .from('default_exercises')
        .select('*')
        .eq('id', node.default_exercise_id)
        .single();
        
      if (exerciseError) throw exerciseError;
      
      return exercise;
    } catch (error) {
      console.error('Error getting node exercise:', error);
      throw error;
    }
  }

  // Create roadmap (admin)
  async createRoadmap(roadmapData: { 
    name: string; 
    level: LanguageLevel; 
    description?: string;
  }): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('roadmaps')
        .insert({
          name: roadmapData.name,
          level: roadmapData.level,
          description: roadmapData.description || null,
          created_by: userData.user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error creating roadmap:', error);
      throw error;
    }
  }

  // Delete roadmap (admin)
  async deleteRoadmap(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('roadmaps')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting roadmap:', error);
      throw error;
    }
  }

  // Create node (admin)
  async createNode(nodeData: {
    roadmapId: string;
    title: string;
    description: string;
    position: number;
    isBonus: boolean;
    language?: Language;
    defaultExerciseId?: string;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('roadmap_nodes')
        .insert({
          roadmap_id: nodeData.roadmapId,
          title: nodeData.title,
          description: nodeData.description,
          position: nodeData.position,
          is_bonus: nodeData.isBonus,
          language: nodeData.language,
          default_exercise_id: nodeData.defaultExerciseId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error creating node:', error);
      throw error;
    }
  }

  // Delete node (admin)
  async deleteNode(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('roadmap_nodes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting node:', error);
      throw error;
    }
  }
}

export const roadmapService = new RoadmapService();
