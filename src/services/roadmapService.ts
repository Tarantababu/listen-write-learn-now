
import { supabase } from '@/integrations/supabase/client';
import { 
  Roadmap, 
  RoadmapNode, 
  LanguageLevel, 
  Language, 
  RoadmapLanguage,
  UserRoadmap,
  RoadmapProgress,
  RoadmapNodeProgress
} from '@/types';

export const roadmapService = {
  // Get all roadmaps
  async getRoadmaps(): Promise<Roadmap[]> {
    try {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;

      // Get roadmap languages
      const { data: languagesData, error: languagesError } = await supabase
        .from('roadmap_languages')
        .select('*');

      if (languagesError) throw languagesError;

      // Group languages by roadmap
      const languagesByRoadmap: Record<string, Language[]> = {};
      languagesData.forEach((lang: any) => {
        if (!languagesByRoadmap[lang.roadmap_id]) {
          languagesByRoadmap[lang.roadmap_id] = [];
        }
        languagesByRoadmap[lang.roadmap_id].push(lang.language as Language);
      });

      // Format and return roadmaps with their languages
      return data.map((roadmap: any) => ({
        id: roadmap.id,
        name: roadmap.name,
        level: roadmap.level as LanguageLevel,
        description: roadmap.description,
        languages: languagesByRoadmap[roadmap.id] || [],
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at),
        createdBy: roadmap.created_by
      }));
    } catch (err) {
      console.error('Error fetching roadmaps:', err);
      return [];
    }
  },

  // Get roadmaps filtered by language
  async getRoadmapsByLanguage(language: Language): Promise<Roadmap[]> {
    try {
      // Use a direct query with a join to filter by language
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*, roadmap_languages!inner(language)')
        .eq('roadmap_languages.language', language)
        .order('level', { ascending: true });

      if (error) throw error;

      // Get roadmap languages for these roadmaps
      const roadmapIds = data.map((r: any) => r.id);
      
      const { data: languagesData, error: languagesError } = await supabase
        .from('roadmap_languages')
        .select('*')
        .in('roadmap_id', roadmapIds);

      if (languagesError) throw languagesError;

      // Group languages by roadmap
      const languagesByRoadmap: Record<string, Language[]> = {};
      languagesData.forEach((lang: any) => {
        if (!languagesByRoadmap[lang.roadmap_id]) {
          languagesByRoadmap[lang.roadmap_id] = [];
        }
        languagesByRoadmap[lang.roadmap_id].push(lang.language as Language);
      });

      // Format and return roadmaps with their languages
      return data.map((roadmap: any) => ({
        id: roadmap.id,
        name: roadmap.name,
        level: roadmap.level as LanguageLevel,
        description: roadmap.description,
        languages: languagesByRoadmap[roadmap.id] || [],
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at),
        createdBy: roadmap.created_by
      }));
    } catch (err) {
      console.error('Error fetching roadmaps by language:', err);
      return [];
    }
  },

  // Get user roadmaps
  async getUserRoadmaps(language: Language): Promise<UserRoadmap[]> {
    try {
      const { data, error } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('language', language)
        .eq('user_id', supabase.auth.getUser().then(({ data }) => data.user?.id))
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format and return user roadmaps
      return data.map((roadmap: any) => ({
        id: roadmap.id,
        userId: roadmap.user_id,
        roadmapId: roadmap.roadmap_id,
        language: roadmap.language as Language,
        currentNodeId: roadmap.current_node_id,
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at)
      }));
    } catch (err) {
      console.error('Error fetching user roadmaps:', err);
      return [];
    }
  },

  // Get a specific user roadmap
  async getUserRoadmap(userRoadmapId: string): Promise<UserRoadmap | null> {
    try {
      const { data, error } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', userRoadmapId)
        .single();

      if (error) throw error;

      // Format and return user roadmap
      return {
        id: data.id,
        userId: data.user_id,
        roadmapId: data.roadmap_id,
        language: data.language as Language,
        currentNodeId: data.current_node_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (err) {
      console.error('Error fetching user roadmap:', err);
      return null;
    }
  },

  // Get roadmap nodes
  async getRoadmapNodes(roadmapId: string): Promise<RoadmapNode[]> {
    try {
      const { data, error } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', roadmapId)
        .order('position', { ascending: true });

      if (error) throw error;

      // Format and return roadmap nodes
      return data.map((node: any) => ({
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
      }));
    } catch (err) {
      console.error('Error fetching roadmap nodes:', err);
      return [];
    }
  },

  // Get node exercise
  async getNodeExercise(nodeId: string): Promise<any | null> {
    try {
      // First get the node to find the default exercise ID
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('default_exercise_id')
        .eq('id', nodeId)
        .single();

      if (nodeError) throw nodeError;
      
      if (!nodeData.default_exercise_id) {
        return null;
      }
      
      // Get the exercise
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('default_exercises')
        .select('*')
        .eq('id', nodeData.default_exercise_id)
        .single();
        
      if (exerciseError) throw exerciseError;
      
      return exerciseData;
    } catch (err) {
      console.error('Error fetching node exercise:', err);
      return null;
    }
  },

  // Get roadmap progress
  async getRoadmapProgress(roadmapId: string): Promise<{
    progress: RoadmapProgress[];
    nodeProgress: RoadmapNodeProgress[];
  }> {
    try {
      const { user } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Get progress records
      const { data: progressData, error: progressError } = await supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('roadmap_id', roadmapId);

      if (progressError) throw progressError;

      // Get detailed node progress
      const { data: nodeProgressData, error: nodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('roadmap_id', roadmapId);

      if (nodeProgressError) throw nodeProgressError;

      // Format and return progress data
      return {
        progress: progressData.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          roadmapId: item.roadmap_id,
          nodeId: item.node_id,
          completed: item.completed,
          completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        })),
        nodeProgress: nodeProgressData.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          roadmapId: item.roadmap_id,
          nodeId: item.node_id,
          language: item.language as Language,
          completionCount: item.completion_count,
          isCompleted: item.is_completed,
          lastPracticedAt: item.last_practiced_at ? new Date(item.last_practiced_at) : undefined,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        }))
      };
    } catch (err) {
      console.error('Error fetching roadmap progress:', err);
      return { progress: [], nodeProgress: [] };
    }
  },

  // Record node completion
  async recordNodeCompletion(nodeId: string, accuracy: number): Promise<{
    isCompleted: boolean;
    completionCount: number;
    nextNodeId?: string;
    unlockedNodeIds?: string[];
  }> {
    try {
      const { user } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Get the user roadmap for this node
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id, language')
        .eq('id', nodeId)
        .single();

      if (nodeError) throw nodeError;

      // Get the user roadmap
      const { data: userRoadmapData, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .eq('roadmap_id', nodeData.roadmap_id)
        .eq('language', nodeData.language)
        .single();

      if (userRoadmapError) throw userRoadmapError;

      // Call the function to increment node completion
      const { error: incrementError } = await supabase.rpc('increment_node_completion', {
        node_id_param: nodeId,
        user_id_param: user.id,
        language_param: nodeData.language,
        roadmap_id_param: nodeData.roadmap_id
      });

      if (incrementError) throw incrementError;

      // Get updated progress
      const { data: updatedProgress, error: updatedProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('node_id', nodeId)
        .eq('language', nodeData.language)
        .single();

      if (updatedProgressError) throw updatedProgressError;

      // Get next node
      let nextNodeId: string | undefined = undefined;
      
      if (updatedProgress.is_completed) {
        // Find next node
        const { data: nextNode, error: nextNodeError } = await supabase
          .from('roadmap_nodes')
          .select('id')
          .eq('roadmap_id', nodeData.roadmap_id)
          .eq('language', nodeData.language)
          .gt('position', updatedProgress.position)
          .order('position', { ascending: true })
          .limit(1);

        if (!nextNodeError && nextNode.length > 0) {
          nextNodeId = nextNode[0].id;
        }
      }

      return {
        isCompleted: updatedProgress.is_completed,
        completionCount: updatedProgress.completion_count,
        nextNodeId
      };
    } catch (err) {
      console.error('Error recording node completion:', err);
      return { isCompleted: false, completionCount: 0 };
    }
  },

  // Mark node as completed
  async markNodeAsCompleted(nodeId: string): Promise<{
    isCompleted: boolean;
    nextNodeId?: string;
  }> {
    try {
      const { user } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Get the node
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('roadmap_id, position')
        .eq('id', nodeId)
        .single();

      if (nodeError) throw nodeError;

      // Get the user roadmap
      const { data: userRoadmapData, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .eq('roadmap_id', nodeData.roadmap_id)
        .single();

      if (userRoadmapError) throw userRoadmapError;

      // Create/update progress record
      const { error: progressError } = await supabase
        .from('roadmap_progress')
        .upsert({
          user_id: user.id,
          roadmap_id: nodeData.roadmap_id,
          node_id: nodeId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, roadmap_id, node_id' });

      if (progressError) throw progressError;

      // Get next node
      const { data: nextNodeData, error: nextNodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', nodeData.roadmap_id)
        .gt('position', nodeData.position)
        .order('position', { ascending: true })
        .limit(1);

      if (nextNodeError) throw nextNodeError;

      // Update user roadmap with next node if available
      if (nextNodeData && nextNodeData.length > 0) {
        const nextNodeId = nextNodeData[0].id;
        
        const { error: updateError } = await supabase
          .from('user_roadmaps')
          .update({ 
            current_node_id: nextNodeId,
            updated_at: new Date().toISOString()
          })
          .eq('id', userRoadmapData.id);

        if (updateError) throw updateError;
        
        return { isCompleted: true, nextNodeId };
      }

      return { isCompleted: true };
    } catch (err) {
      console.error('Error marking node as completed:', err);
      return { isCompleted: false };
    }
  },

  // Reset progress
  async resetProgress(roadmapId: string): Promise<void> {
    try {
      const { user } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Get the user roadmap
      const { data: userRoadmapData, error: userRoadmapError } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('id', roadmapId)
        .single();

      if (userRoadmapError) throw userRoadmapError;

      // Delete progress records
      const { error: progressError } = await supabase
        .from('roadmap_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('roadmap_id', userRoadmapData.roadmap_id);

      if (progressError) throw progressError;

      // Delete node progress records
      const { error: nodeProgressError } = await supabase
        .from('roadmap_nodes_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('roadmap_id', userRoadmapData.roadmap_id);

      if (nodeProgressError) throw nodeProgressError;

      // Get first node
      const { data: firstNodeData, error: firstNodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', userRoadmapData.roadmap_id)
        .order('position', { ascending: true })
        .limit(1);

      if (firstNodeError) throw firstNodeError;

      // Update user roadmap to point to first node
      const { error: updateError } = await supabase
        .from('user_roadmaps')
        .update({ 
          current_node_id: firstNodeData.length > 0 ? firstNodeData[0].id : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', roadmapId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error resetting progress:', err);
      throw err;
    }
  },

  // Initialize roadmap for a user
  async initializeRoadmap(level: LanguageLevel, language: Language): Promise<string> {
    try {
      const { user } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Find matching roadmap
      const { data: roadmapsData, error: roadmapsError } = await supabase
        .from('roadmaps')
        .select('id, roadmap_languages!inner(language)')
        .eq('level', level)
        .eq('roadmap_languages.language', language)
        .single();

      if (roadmapsError) throw roadmapsError;

      // Check if user already has this roadmap
      const { data: existingUserRoadmap, error: existingError } = await supabase
        .from('user_roadmaps')
        .select('id')
        .eq('user_id', user.id)
        .eq('roadmap_id', roadmapsData.id)
        .eq('language', language)
        .maybeSingle();

      if (existingError) throw existingError;
      
      if (existingUserRoadmap) {
        return existingUserRoadmap.id; // Return existing roadmap ID
      }

      // Create user roadmap
      const { data: userRoadmap, error: roadmapError } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: user.id,
          roadmap_id: roadmapsData.id,
          language: language
        })
        .select()
        .single();

      if (roadmapError) throw roadmapError;

      // Get first node
      const { data: firstNodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', roadmapsData.id)
        .eq('language', language)
        .order('position')
        .limit(1)
        .maybeSingle();

      if (nodeError) throw nodeError;

      // Update user roadmap with first node if available
      if (firstNodeData) {
        const { error: updateError } = await supabase
          .from('user_roadmaps')
          .update({ current_node_id: firstNodeData.id })
          .eq('id', userRoadmap.id);

        if (updateError) throw updateError;
      }

      return userRoadmap.id;
    } catch (err) {
      console.error('Error initializing roadmap:', err);
      throw err;
    }
  },

  // Create roadmap
  async createRoadmap(roadmap: { 
    name: string;
    level: LanguageLevel;
    description?: string;
    languages?: Language[];
  }): Promise<string | null> {
    try {
      // Create the roadmap
      const { data, error } = await supabase
        .from('roadmaps')
        .insert({
          name: roadmap.name,
          level: roadmap.level,
          description: roadmap.description,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Set languages if provided
      if (roadmap.languages && roadmap.languages.length > 0) {
        await this.setRoadmapLanguages(data.id, roadmap.languages);
      }

      return data.id;
    } catch (err) {
      console.error('Error creating roadmap:', err);
      return null;
    }
  },

  // Update roadmap
  async updateRoadmap(
    id: string, 
    roadmap: { 
      name: string;
      level: LanguageLevel;
      description?: string;
      languages?: Language[];
    }
  ): Promise<boolean> {
    try {
      // Update roadmap
      const { error } = await supabase
        .from('roadmaps')
        .update({
          name: roadmap.name,
          level: roadmap.level,
          description: roadmap.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Update languages if provided
      if (roadmap.languages) {
        await this.setRoadmapLanguages(id, roadmap.languages);
      }

      return true;
    } catch (err) {
      console.error('Error updating roadmap:', err);
      return false;
    }
  },

  // Delete roadmap
  async deleteRoadmap(id: string): Promise<boolean> {
    try {
      // Delete the roadmap (cascading to other tables due to foreign key constraints)
      const { error } = await supabase
        .from('roadmaps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting roadmap:', err);
      return false;
    }
  },

  // Get languages for a roadmap
  async getRoadmapLanguages(roadmapId: string): Promise<Language[]> {
    try {
      const { data, error } = await supabase
        .from('roadmap_languages')
        .select('language')
        .eq('roadmap_id', roadmapId);

      if (error) throw error;

      return data.map(item => item.language as Language);
    } catch (err) {
      console.error('Error fetching roadmap languages:', err);
      return [];
    }
  },

  // Set languages for a roadmap
  async setRoadmapLanguages(roadmapId: string, languages: Language[]): Promise<boolean> {
    try {
      // Delete existing language associations
      const { error: deleteError } = await supabase
        .from('roadmap_languages')
        .delete()
        .eq('roadmap_id', roadmapId);

      if (deleteError) throw deleteError;

      if (languages.length === 0) return true;

      // Create new language associations
      const languageEntries = languages.map(lang => ({
        roadmap_id: roadmapId,
        language: lang
      }));

      const { error: insertError } = await supabase
        .from('roadmap_languages')
        .insert(languageEntries);

      if (insertError) throw insertError;
      return true;
    } catch (err) {
      console.error('Error setting roadmap languages:', err);
      return false;
    }
  },

  // Create node
  async createNode(node: { 
    roadmapId: string; 
    title: string; 
    position: number;
    language?: Language;
    defaultExerciseId?: string;
    description?: string;
    isBonus: boolean;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('roadmap_nodes')
        .insert({
          roadmap_id: node.roadmapId,
          title: node.title,
          position: node.position,
          default_exercise_id: node.defaultExerciseId,
          description: node.description,
          is_bonus: node.isBonus,
          language: node.language
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (err) {
      console.error('Error creating node:', err);
      return null;
    }
  },

  // Update node
  async updateNode(
    id: string,
    node: { 
      title: string; 
      position: number;
      language?: Language;
      defaultExerciseId?: string;
      description?: string;
      isBonus: boolean;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('roadmap_nodes')
        .update({
          title: node.title,
          position: node.position,
          default_exercise_id: node.defaultExerciseId,
          description: node.description,
          is_bonus: node.isBonus,
          language: node.language,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating node:', err);
      return false;
    }
  },

  // Delete node
  async deleteNode(id: string): Promise<boolean> {
    try {
      // Delete the node (cascading to other tables due to foreign key constraints)
      const { error } = await supabase
        .from('roadmap_nodes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting node:', err);
      return false;
    }
  },

  // Update node position
  async updateNodePosition(id: string, position: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('roadmap_nodes')
        .update({ position })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating node position:', err);
      return false;
    }
  }
};
