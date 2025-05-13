
import { Language, LanguageLevel } from '@/types';
import { BaseService } from './BaseService';
import { 
  RoadmapServiceInterface,
  ServiceResult
} from '../types/service-types';
import { RoadmapItem, RoadmapNode } from '../types';

export class RoadmapService extends BaseService implements RoadmapServiceInterface {
  /**
   * Get all available roadmaps for a specific language
   */
  public async getRoadmapsByLanguage(language: Language): ServiceResult<RoadmapItem[]> {
    try {
      // Call the stored procedure to get roadmaps by language
      const { data, error } = await this.supabase
        .rpc('get_roadmaps_by_language', {
          requested_language: language
        });
        
      if (error) throw error;
      
      // Get all roadmap languages to associate with the roadmaps
      const { data: languagesData, error: languagesError } = await this.supabase
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
      
      const formattedRoadmaps = data.map((item: any): RoadmapItem => ({
        id: item.id,
        name: item.name,
        level: item.level as LanguageLevel,
        description: item.description,
        languages: languagesByRoadmap[item.id] || [],
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        createdBy: item.created_by,
      }));
      
      return this.success(formattedRoadmaps);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get roadmaps that the current user has started for a specific language
   */
  public async getUserRoadmaps(language: Language): ServiceResult<RoadmapItem[]> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to access user roadmaps');
      }
      
      // Call the stored procedure to get user roadmaps by language
      const { data, error } = await this.supabase
        .rpc('get_user_roadmaps_by_language', {
          user_id_param: auth.userId,
          requested_language: language
        });
        
      if (error) throw error;
      
      // If no user roadmaps, return empty array
      if (!data || data.length === 0) {
        console.log('No user roadmaps found for language:', language);
        return this.success([]);
      }
      
      // Get detailed roadmap information for each user roadmap
      const roadmapIds = data.map((item: any) => item.roadmap_id);
      
      const { data: roadmapsData, error: roadmapsError } = await this.supabase
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
      const formattedRoadmaps = data.map((item: any): RoadmapItem => {
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
      
      console.log('User roadmaps loaded:', formattedRoadmaps);
      return this.success(formattedRoadmaps);
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Get all nodes for a specific user roadmap with their status
   */
  public async getRoadmapNodes(userRoadmapId: string): ServiceResult<RoadmapNode[]> {
    try {
      console.log('Getting nodes for user roadmap:', userRoadmapId);
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to access roadmap nodes');
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
        return this.error(`User roadmap not found in database with ID: ${userRoadmapId}`);
      }
      
      console.log('Found user roadmap:', userRoadmap);
      
      // Get all nodes for this roadmap
      const { data: nodes, error: nodesError } = await this.supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language)
        .order('position', { ascending: true });
        
      if (nodesError) throw nodesError;
      
      console.log(`Found ${nodes?.length || 0} nodes for roadmap`);
      
      // Get progress for this user and roadmap
      const { data: progress, error: progressError } = await this.supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id);
        
      if (progressError) throw progressError;
      
      // Get detailed node progress
      const { data: nodeProgress, error: nodeProgressError } = await this.supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', userRoadmap.roadmap_id)
        .eq('language', userRoadmap.language);
        
      if (nodeProgressError) throw nodeProgressError;
      
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
          language: node.language as Language,
          createdAt: new Date(node.created_at),
          updatedAt: new Date(node.updated_at),
          status,
          progressCount
        };
      });
      
      return this.success(formattedNodes);
    } catch (error) {
      console.error(`Error in getRoadmapNodes for roadmap ID ${userRoadmapId}:`, error);
      return this.handleError(error);
    }
  }
  
  /**
   * Initialize a new roadmap for the current user
   */
  public async initializeRoadmap(level: LanguageLevel, language: Language): ServiceResult<string> {
    try {
      const auth = await this.ensureAuthenticated();
      if (!auth) {
        return this.error('User must be authenticated to initialize a roadmap');
      }
      
      // Find a roadmap that matches the level and supports the language
      const { data: roadmapsData, error: roadmapsError } = await this.supabase
        .from('roadmaps')
        .select(`
          id,
          roadmap_languages!inner(language)
        `)
        .eq('level', level)
        .eq('roadmap_languages.language', language);
        
      if (roadmapsError) throw roadmapsError;
      
      if (!roadmapsData || roadmapsData.length === 0) {
        return this.error(`No roadmap found for level ${level} and language ${language}`);
      }
      
      // Take the first matching roadmap
      const roadmapId = roadmapsData[0].id;
      
      // Check if the user already has this roadmap
      const { data: existingRoadmap, error: existingError } = await this.supabase
        .from('user_roadmaps')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .maybeSingle();
        
      if (existingError) throw existingError;
      
      // If the user already has this roadmap, return its ID
      if (existingRoadmap) {
        return this.success(existingRoadmap.id);
      }
      
      // Create a new user roadmap
      const { data: userRoadmap, error: userRoadmapError } = await this.supabase
        .from('user_roadmaps')
        .insert({
          user_id: auth.userId,
          roadmap_id: roadmapId,
          language: language
        })
        .select()
        .single();
        
      if (userRoadmapError) throw userRoadmapError;
      
      // Find first node of the roadmap to set as current
      const { data: firstNode, error: firstNodeError } = await this.supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmapId)
        .eq('language', language)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle();
        
      if (firstNodeError && firstNodeError.code !== 'PGRST116') {
        // If it's not a "not found" error, throw it
        throw firstNodeError;
      }
      
      // Update user roadmap with first node if one exists
      if (firstNode) {
        const { error: updateError } = await this.supabase
          .from('user_roadmaps')
          .update({ current_node_id: firstNode.id })
          .eq('id', userRoadmap.id);
          
        if (updateError) throw updateError;
      }
      
      return this.success(userRoadmap.id);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Create and export singleton instance
export const roadmapService = new RoadmapService();
