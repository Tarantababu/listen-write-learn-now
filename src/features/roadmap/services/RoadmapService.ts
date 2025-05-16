import { Language, LanguageLevel } from '@/types';
import { BaseService } from './BaseService';
import { 
  RoadmapServiceInterface,
  ServiceResult,
  NodeCompletionResult as ServiceNodeCompletionResult
} from '../types/service-types';
import { RoadmapItem, RoadmapNode, NodeCompletionResult } from '../types';

export class RoadmapService extends BaseService implements RoadmapServiceInterface {
  /**
   * Get all available roadmaps for a specific language
   */
  public async getRoadmapsForLanguage(language: Language): Promise<RoadmapItem[]> {
    try {
      // Normalize language to lowercase for consistent comparison
      const normalizedLanguage = language.toLowerCase();
      
      console.log(`Getting roadmaps for language: ${normalizedLanguage}`);
      
      // Call the stored procedure to get roadmaps by language
      const { data, error } = await this.supabase
        .rpc('get_roadmaps_by_language', {
          requested_language: normalizedLanguage
        });
        
      if (error) {
        console.error('Database error when fetching roadmaps:', error);
        throw error;
      }
      
      console.log(`Received ${data?.length || 0} roadmaps from database`);
      
      // If no roadmaps found, return empty array
      if (!data || data.length === 0) {
        console.log(`No roadmaps found for language: ${normalizedLanguage}`);
        return [];
      }
      
      // Get all roadmap languages to associate with the roadmaps
      const { data: languagesData, error: languagesError } = await this.supabase
        .from('roadmap_languages')
        .select('roadmap_id, language');
        
      if (languagesError) {
        console.error('Database error when fetching roadmap languages:', languagesError);
        throw languagesError;
      }
      
      console.log(`Received ${languagesData?.length || 0} language mappings from database`);
      
      // Format and return roadmaps
      const formattedRoadmaps = data.map((item: any): RoadmapItem => {
        return {
          id: item.id,
          name: item.name,
          level: item.level as LanguageLevel,
          description: item.description,
          language: language,
          nodeCount: item.node_count,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at || item.created_at)
        };
      });
      
      return formattedRoadmaps;
    } catch (error) {
      console.error(`Error in getRoadmapsForLanguage for ${language}:`, error);
      return [];
    }
  }
  
  /**
   * Get roadmaps that the current user has started for a specific language
   */
  public async getUserRoadmaps(language: Language): Promise<RoadmapItem[]> {
    try {
      // Normalize language to lowercase for consistent comparison
      const normalizedLanguage = language.toLowerCase() as Language;
      
      console.log(`Getting user roadmaps for language: ${normalizedLanguage}`);
      
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return [];
      }
      
      // Call the stored procedure to get user roadmaps by language
      const { data, error } = await this.supabase
        .rpc('get_user_roadmaps_by_language', {
          user_id_param: auth.userId,
          requested_language: normalizedLanguage
        });
        
      if (error) {
        console.error('Database error when fetching user roadmaps:', error);
        throw error;
      }
      
      console.log(`Received ${data?.length || 0} user roadmaps from database`);
      
      // If no user roadmaps, return empty array
      if (!data || data.length === 0) {
        console.log(`No user roadmaps found for language: ${normalizedLanguage}`);
        return [];
      }
      
      // Get detailed roadmap information for each user roadmap
      const roadmapIds = data.map((item: any) => item.roadmap_id);
      
      const { data: roadmapsData, error: roadmapsError } = await this.supabase
        .from('roadmaps')
        .select('*')
        .in('id', roadmapIds);
        
      if (roadmapsError) {
        console.error('Database error when fetching roadmap details:', roadmapsError);
        throw roadmapsError;
      }
      
      // Create a map of roadmap data for easy lookup
      const roadmapMap: Record<string, any> = {};
      roadmapsData.forEach(roadmap => {
        roadmapMap[roadmap.id] = roadmap;
      });
      
      // Format the user roadmap data
      const formattedRoadmaps = data.map((item: any): RoadmapItem => {
        const roadmapDetails = roadmapMap[item.roadmap_id] || {};
        
        return {
          id: item.id,
          roadmapId: item.roadmap_id,
          name: roadmapDetails.name || 'Unnamed Roadmap',
          level: roadmapDetails.level as LanguageLevel || 'A1',
          description: roadmapDetails.description,
          language: item.language.toLowerCase() as Language,
          currentNodeId: item.current_node_id,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        };
      });
      
      console.log(`Formatted ${formattedRoadmaps.length} user roadmaps for ${normalizedLanguage}`);
      return formattedRoadmaps;
    } catch (error) {
      console.error(`Error in getUserRoadmaps for ${language}:`, error);
      return [];
    }
  }
  
  /**
   * Get all nodes for a specific user roadmap with their status
   */
  public async getRoadmapNodes(userRoadmapId: string): Promise<RoadmapNode[]> {
    try {
      console.log(`Getting nodes for user roadmap: ${userRoadmapId}`);
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return [];
      }
      
      // First get the user roadmap to get the roadmap ID and language
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', userRoadmapId)
        .maybeSingle();
        
      if (userRoadmapError) {
        console.error(`Database error when fetching user roadmap: ${userRoadmapError.message}`);
        throw userRoadmapError;
      }
      
      if (!userRoadmap) {
        console.error(`User roadmap not found in database with ID: ${userRoadmapId}`);
        return [];
      }
      
      console.log(`Found user roadmap with language: ${userRoadmap.language}`);
      
      // Normalize language to lowercase for consistent comparison
      const normalizedLanguage = userRoadmap.language.toLowerCase();
      
      // Get all nodes for this roadmap
      const { data: nodes, error: nodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', normalizedLanguage)
        .order('position', { ascending: true });
        
      if (nodesError) {
        console.error('Database error when fetching roadmap nodes:', nodesError);
        throw nodesError;
      }
      
      console.log(`Found ${nodes?.length || 0} nodes for roadmap`);
      
      // If no nodes, return empty array
      if (!nodes || nodes.length === 0) {
        console.log(`No nodes found for roadmap ${userRoadmap.roadmap_id} and language ${normalizedLanguage}`);
        return [];
      }
      
      // Get progress for this user and roadmap
      const { data: progress, error: progressError } = await this.supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id);
        
      if (progressError) {
        console.error('Database error when fetching roadmap progress:', progressError);
        throw progressError;
      }
      
      // Get detailed node progress
      const { data: nodeProgress, error: nodeProgressError } = await this.supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', normalizedLanguage);
        
      if (nodeProgressError) {
        console.error('Database error when fetching node progress:', nodeProgressError);
        throw nodeProgressError;
      }
      
      // Create a map of node progress for easy lookup
      const nodeProgressMap: Record<string, any> = {};
      if (nodeProgress) {
        nodeProgress.forEach(item => {
          nodeProgressMap[item.node_id] = item;
        });
      }
      
      // Create a set of completed nodes IDs
      const completedNodeIds = new Set<string>();
      if (progress) {
        progress
          .filter(item => item.completed)
          .forEach(item => completedNodeIds.add(item.node_id));
      }
      
      // Add completed nodes from node_progress table
      if (nodeProgress) {
        nodeProgress
          .filter(item => item.is_completed)
          .forEach(item => completedNodeIds.add(item.node_id));
      }
      
      // Calculate available nodes based on completed nodes
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
        
        // Get node progress count and include it in the return object
        const progressCount = nodeProgressMap[node.id]?.completion_count || 0;
        const lastPracticedAt = nodeProgressMap[node.id]?.last_practiced_at || null;
        
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
          language: node.language.toLowerCase() as Language,
          createdAt: new Date(node.created_at),
          updatedAt: new Date(node.updated_at),
          status,
          progressCount,
          lastPracticedAt: lastPracticedAt ? new Date(lastPracticedAt) : undefined
        };
      });
      
      return formattedNodes;
    } catch (error) {
      console.error(`Error in getRoadmapNodes for roadmap ID ${userRoadmapId}:`, error);
      return [];
    }
  }
  
  /**
   * Initialize a new roadmap for the current user
   */
  public async initializeRoadmap(level: LanguageLevel, language: Language): Promise<string> {
    try {
      // Normalize language to lowercase for consistent comparison
      const normalizedLanguage = language.toLowerCase() as Language;
      
      console.log(`Initializing roadmap for level ${level} and language ${normalizedLanguage}`);
      
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        throw new Error('User must be authenticated to initialize a roadmap');
      }
      
      console.log(`User authenticated with ID: ${auth.userId}`);
      
      // Find a roadmap that matches the level and supports the language
      const { data: roadmapsData, error: roadmapsError } = await this.supabase
        .from('roadmaps')
        .select(`
          id,
          roadmap_languages!inner(language)
        `)
        .eq('level', level)
        .eq('roadmap_languages.language', normalizedLanguage);
        
      if (roadmapsError) {
        console.error('Database error when fetching matching roadmaps:', roadmapsError);
        throw roadmapsError;
      }
      
      console.log(`Found ${roadmapsData?.length || 0} matching roadmaps for ${level} ${normalizedLanguage}`);
      
      if (!roadmapsData || roadmapsData.length === 0) {
        throw new Error(`No roadmap found for level ${level} and language ${normalizedLanguage}`);
      }
      
      // Take the first matching roadmap
      const roadmapId = roadmapsData[0].id;
      console.log(`Selected roadmap ID: ${roadmapId}`);
      
      // Check if the user already has this roadmap
      const { data: existingRoadmap, error: existingError } = await this.supabase
        .from('user_roadmaps')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', roadmapId)
        .eq('language', normalizedLanguage)
        .maybeSingle();
        
      if (existingError) {
        console.error('Database error when checking existing user roadmap:', existingError);
        throw existingError;
      }
      
      // If the user already has this roadmap, return its ID
      if (existingRoadmap) {
        console.log(`User already has roadmap with ID: ${existingRoadmap.id}`);
        return existingRoadmap.id;
      }
      
      console.log('Creating new user roadmap');
      
      // Create a new user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .insert({
          user_id: auth.userId,
          roadmap_id: roadmapId,
          language: normalizedLanguage
        })
        .select()
        .single();
        
      if (userRoadmapError) {
        console.error('Database error when creating user roadmap:', userRoadmapError);
        throw userRoadmapError;
      }
      
      console.log('User roadmap created:', userRoadmap);
      
      // Find first node of the roadmap to set as current
      const { data: firstNode, error: firstNodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmapId)
        .eq('language', normalizedLanguage)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();
        
      if (firstNodeError && firstNodeError.code !== 'PGRST116') {
        // If it's not a "not found" error, throw it
        console.error('Database error when finding first node:', firstNodeError);
        throw firstNodeError;
      }
      
      console.log('First node found:', firstNode);
      
      // Update user roadmap with first node if one exists
      if (firstNode) {
        console.log(`Updating user roadmap with first node ID: ${firstNode.id}`);
        const { error: updateError } = await this.supabase
          .from('user_roadmaps')
          .update({ current_node_id: firstNode.id })
          .eq('id', userRoadmap.id);
          
        if (updateError) {
          console.error('Database error when updating user roadmap with first node:', updateError);
          throw updateError;
        }
      }
      
      console.log(`Roadmap initialization complete for user roadmap ID: ${userRoadmap.id}`);
      return userRoadmap.id;
    } catch (error) {
      console.error(`Error in initializeRoadmap for ${level} ${language}:`, error);
      throw error;
    }
  }
  
  /**
   * Get exercise content for a node
   */
  public async getNodeExerciseContent(nodeId: string): Promise<any> {
    try {
      // First check if the node has a default exercise
      const { data: nodeData, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('default_exercise_id, language')
        .eq('id', nodeId)
        .single();
        
      if (nodeError) throw nodeError;
      
      // If node has a default exercise, fetch that
      if (nodeData.default_exercise_id) {
        const { data: exerciseData, error: exerciseError } = await this.supabase
          .from('default_exercises')
          .select('*')
          .eq('id', nodeData.default_exercise_id)
          .single();
          
        if (exerciseError) throw exerciseError;
        
        if (exerciseData) {
          return {
            id: exerciseData.id,
            title: exerciseData.title,
            text: exerciseData.text,
            language: exerciseData.language,
            audio_url: exerciseData.audio_url,
            tags: exerciseData.tags || []
          };
        }
      }
      
      // If no default exercise, return null
      return null;
    } catch (error) {
      console.error('Error getting node exercise:', error);
      return null;
    }
  }
  
  /**
   * Record node completion with accuracy
   */
  public async recordNodeCompletion(nodeId: string, accuracy: number): Promise<ServiceNodeCompletionResult> {
    try {
      if (accuracy < 0 || accuracy > 100) {
        throw new Error("Accuracy must be between 0 and 100");
      }
      
      const userId = (await this.supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error("User must be authenticated");
      }
      
      // Get node info to find roadmap_id
      const { data: nodeData, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('roadmap_id, language')
        .eq('id', nodeId)
        .single();
      
      if (nodeError) throw nodeError;
      
      // Increment node completion using the database function
      const { error: incrementError } = await this.supabase
        .rpc('increment_node_completion', {
          node_id_param: nodeId,
          user_id_param: userId,
          language_param: nodeData.language,
          roadmap_id_param: nodeData.roadmap_id
        });
      
      if (incrementError) throw incrementError;
      
      // Get the updated node progress
      const { data: progressData, error: progressError } = await this.supabase
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
   * Mark a node as completed
   */
  public async markNodeCompleted(nodeId: string): Promise<void> {
    console.log(`Marking node ${nodeId} as completed`);
    
    try {
      const userId = (await this.supabase.auth.getUser()).data.user?.id;
      
      // Get node info to find roadmap_id
      const { data: nodeData, error: nodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('roadmap_id, language, position')
        .eq('id', nodeId)
        .single();
      
      if (nodeError) throw nodeError;
      
      // Mark as completed in roadmap_progress
      const { error: progressError } = await this.supabase
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
      const { error: nodesProgressError } = await this.supabase
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
      const { data: nextNodeData, error: nextNodeError } = await this.supabase
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
        const { data: userRoadmap, error: userRoadmapError } = await this.supabase
          .from('user_roadmaps')
          .select('id')
          .eq('user_id', userId)
          .eq('roadmap_id', nodeData.roadmap_id)
          .eq('language', nodeData.language)
          .single();
        
        if (userRoadmapError) throw userRoadmapError;
        
        // Update current node
        const { error: updateError } = await this.supabase
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

// Create and export singleton instance
export const roadmapService = new RoadmapService();
