
import { useState, useCallback } from 'react';
import { Language, LanguageLevel } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface RoadmapItem {
  id: string;
  name: string;
  description?: string;
  level: LanguageLevel;
  language?: Language;
  nodeCount?: number;
  completedNodes?: number;
  totalNodes?: number;
  roadmapId?: string;
  currentNodeId?: string;
  createdAt: Date;
  updatedAt: Date;
  languages?: Language[];
}

export function useRoadmap() {
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Load roadmaps for a specific language
  const loadRoadmaps = useCallback(async (language: Language) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Since the stored procedure doesn't exist yet, we'll use a direct query
      const { data, error } = await supabase
        .from('curricula')
        .select('id, name, description, level, language, created_at, updated_at')
        .eq('language', language)
        .eq('status', 'active');
      
      if (error) throw error;
      
      if (data) {
        const formattedRoadmaps: RoadmapItem[] = data.map(roadmap => ({
          id: roadmap.id,
          name: roadmap.name,
          description: roadmap.description || undefined,
          level: roadmap.level as LanguageLevel,
          language: roadmap.language as Language,
          languages: [roadmap.language as Language],
          createdAt: new Date(roadmap.created_at),
          updatedAt: new Date(roadmap.updated_at)
        }));
        
        setRoadmaps(formattedRoadmaps);
      }
    } catch (err) {
      console.error('Failed to load roadmaps:', err);
      setError(err instanceof Error ? err : new Error('Failed to load roadmaps'));
      
      toast({
        variant: 'destructive',
        title: 'Failed to load roadmaps',
        description: 'There was an error loading the roadmaps. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user roadmaps for a specific language
  const loadUserRoadmaps = useCallback(async (language: Language) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      
      // Since the stored procedure doesn't exist yet, we'll use a direct query
      const { data, error } = await supabase
        .from('user_curricula')
        .select(`
          id, 
          curriculum_id, 
          current_node_id, 
          completion_percentage,
          enrollment_date,
          last_activity_date,
          curricula(id, name, description, level, language, created_at, updated_at)
        `)
        .eq('user_id', userData.user.id)
        .eq('curricula.language', language);
      
      if (error) throw error;
      
      if (data) {
        const formattedUserRoadmaps: RoadmapItem[] = data.map(roadmap => ({
          id: roadmap.id,
          roadmapId: roadmap.curriculum_id,
          name: roadmap.curricula.name,
          description: roadmap.curricula.description,
          level: roadmap.curricula.level as LanguageLevel,
          language: roadmap.curricula.language as Language,
          currentNodeId: roadmap.current_node_id,
          completedNodes: Math.floor((roadmap.completion_percentage / 100) * 10), // Estimate
          totalNodes: 10, // Placeholder
          createdAt: new Date(roadmap.enrollment_date),
          updatedAt: new Date(roadmap.last_activity_date)
        }));
        
        setUserRoadmaps(formattedUserRoadmaps);
      }
    } catch (err) {
      console.error('Failed to load user roadmaps:', err);
      setError(err instanceof Error ? err : new Error('Failed to load user roadmaps'));
      
      toast({
        variant: 'destructive',
        title: 'Failed to load your roadmaps',
        description: 'There was an error loading your roadmaps. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize a new user roadmap
  const initializeUserRoadmap = useCallback(async (level: LanguageLevel, language: Language) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('User not authenticated');
      
      // Find a roadmap with the specified level and language
      const { data: roadmapData, error: roadmapError } = await supabase
        .from('curricula')
        .select('id')
        .eq('level', level)
        .eq('language', language)
        .eq('status', 'active')
        .single();
      
      if (roadmapError) throw roadmapError;
      
      if (!roadmapData) {
        throw new Error(`No roadmap found for level ${level} and language ${language}`);
      }
      
      // Create a new user roadmap
      const { data, error } = await supabase
        .from('user_curricula')
        .insert({
          user_id: userData.user.id,
          curriculum_id: roadmapData.id,
          status: 'active',
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Reload user roadmaps to reflect changes
      await loadUserRoadmaps(language);
      
      return data.id;
    } catch (err) {
      console.error('Failed to initialize roadmap:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize roadmap'));
      
      toast({
        variant: 'destructive',
        title: 'Failed to initialize roadmap',
        description: 'There was an error creating your roadmap. Please try again.',
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserRoadmaps]);

  return {
    roadmaps,
    userRoadmaps,
    isLoading,
    error,
    loadRoadmaps,
    loadUserRoadmaps,
    initializeUserRoadmap
  };
}
