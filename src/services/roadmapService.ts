
import { supabase } from '@/integrations/supabase/client';
import { Roadmap, RoadmapNode, LanguageLevel, Language, RoadmapLanguage } from '@/types';

export const roadmapService = {
  async getRoadmaps(): Promise<Roadmap[]> {
    try {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;

      return data.map((roadmap: any) => ({
        id: roadmap.id,
        name: roadmap.name,
        level: roadmap.level as LanguageLevel,
        description: roadmap.description,
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at),
        createdBy: roadmap.created_by
      }));
    } catch (err) {
      console.error('Error fetching roadmaps:', err);
      return [];
    }
  },

  async getRoadmapNodes(roadmapId: string): Promise<RoadmapNode[]> {
    try {
      const { data, error } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', roadmapId)
        .order('position', { ascending: true });

      if (error) throw error;

      return data.map((node: any) => ({
        id: node.id,
        roadmapId: node.roadmap_id,
        defaultExerciseId: node.default_exercise_id,
        title: node.title,
        description: node.description,
        position: node.position,
        isBonus: node.is_bonus,
        language: node.language,
        createdAt: new Date(node.created_at),
        updatedAt: new Date(node.updated_at)
      }));
    } catch (err) {
      console.error('Error fetching roadmap nodes:', err);
      return [];
    }
  },

  async createRoadmap(roadmap: { name: string; level: LanguageLevel; description?: string }): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('roadmaps')
        .insert([{
          name: roadmap.name,
          level: roadmap.level,
          description: roadmap.description
        }])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (err) {
      console.error('Error creating roadmap:', err);
      return null;
    }
  },

  async updateRoadmap(
    id: string, 
    roadmap: { name: string; level: LanguageLevel; description?: string }
  ): Promise<boolean> {
    try {
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
      return true;
    } catch (err) {
      console.error('Error updating roadmap:', err);
      return false;
    }
  },

  async deleteRoadmap(id: string): Promise<boolean> {
    try {
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

  async getRoadmapLanguages(roadmapId: string): Promise<RoadmapLanguage[]> {
    try {
      const { data, error } = await supabase
        .from('roadmap_languages')
        .select('*')
        .eq('roadmap_id', roadmapId);

      if (error) throw error;

      return data.map((lang: any) => ({
        id: lang.id,
        roadmapId: lang.roadmap_id,
        language: lang.language as Language,
        createdAt: new Date(lang.created_at)
      }));
    } catch (err) {
      console.error('Error fetching roadmap languages:', err);
      return [];
    }
  },

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
        .insert([{
          roadmap_id: node.roadmapId,
          title: node.title,
          position: node.position,
          default_exercise_id: node.defaultExerciseId,
          description: node.description,
          is_bonus: node.isBonus,
          language: node.language
        }])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (err) {
      console.error('Error creating node:', err);
      return null;
    }
  },

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

  async deleteNode(id: string): Promise<boolean> {
    try {
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

