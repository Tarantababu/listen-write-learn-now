
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, LanguageLevel, Roadmap, RoadmapNode, UserRoadmap, RoadmapNodeProgress } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';

interface RoadmapContextType {
  currentRoadmap: any;
  nodes: RoadmapNode[];
  currentNodeId: string;
  completedNodes: string[];
  availableNodes: string[];
  nodeProgress: any[];
  isLoading: boolean;
  roadmaps: Roadmap[];
  userRoadmaps: UserRoadmap[];
  initializeUserRoadmap: (level: LanguageLevel, language: Language) => Promise<void>;
  loadUserRoadmaps: (language: Language) => Promise<void>;
  loadRoadmaps: (language: Language) => Promise<void>;
  nodeLoading: boolean;
}

const RoadmapContext = createContext<RoadmapContextType | null>(null);

export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};

export const RoadmapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  
  const [currentRoadmap, setCurrentRoadmap] = useState<any>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [availableNodes, setAvailableNodes] = useState<string[]>([]);
  const [nodeProgress, setNodeProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<UserRoadmap[]>([]);
  const [nodeLoading, setNodeLoading] = useState(false);

  // Load roadmaps for the selected language
  const loadRoadmaps = async (language: Language) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('roadmaps')
        .select(`
          id,
          name,
          level,
          description,
          created_at,
          updated_at,
          created_by,
          roadmap_languages(language)
        `)
        .order('level', { ascending: true });
      
      if (error) throw error;
      
      // Transform the data to match our Roadmap type
      const processedRoadmaps = data.map(roadmap => ({
        id: roadmap.id,
        name: roadmap.name,
        level: roadmap.level as LanguageLevel,
        description: roadmap.description || '',
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at),
        createdBy: roadmap.created_by,
        languages: roadmap.roadmap_languages?.map((rl: any) => rl.language as Language) || []
      }));
      
      setRoadmaps(processedRoadmaps);
    } catch (error) {
      console.error('Error loading roadmaps:', error);
      toast.error('Failed to load roadmaps');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user's roadmaps
  const loadUserRoadmaps = async (language: Language) => {
    if (!user) {
      setUserRoadmaps([]);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match our UserRoadmap type
      const processedUserRoadmaps = data.map(roadmap => ({
        id: roadmap.id,
        userId: roadmap.user_id,
        roadmapId: roadmap.roadmap_id,
        language: roadmap.language as Language,
        currentNodeId: roadmap.current_node_id,
        createdAt: new Date(roadmap.created_at),
        updatedAt: new Date(roadmap.updated_at)
      }));
      
      setUserRoadmaps(processedUserRoadmaps);
    } catch (error) {
      console.error('Error loading user roadmaps:', error);
      toast.error('Failed to load your roadmaps');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize a new roadmap for the user
  const initializeUserRoadmap = async (level: LanguageLevel, language: Language) => {
    if (!user) {
      toast.error('You must be logged in to start a roadmap');
      throw new Error('User not authenticated');
    }
    
    try {
      // Find the roadmap with the specified level that supports the specified language
      const roadmap = roadmaps.find(r => 
        r.level === level && r.languages?.some(l => l.toLowerCase() === language.toLowerCase())
      );
      
      if (!roadmap) {
        throw new Error(`No roadmap found for level ${level} and language ${language}`);
      }
      
      // Check if the user already has this roadmap for this language
      const existingRoadmap = userRoadmaps.find(ur => 
        ur.roadmapId === roadmap.id && ur.language.toLowerCase() === language.toLowerCase()
      );
      
      if (existingRoadmap) {
        throw new Error('You have already started this roadmap');
      }
      
      // Get the first node of the roadmap
      const { data: nodeData, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .select('id')
        .eq('roadmap_id', roadmap.id)
        .order('position', { ascending: true })
        .limit(1);
      
      if (nodeError) throw nodeError;
      
      if (!nodeData || nodeData.length === 0) {
        throw new Error('This roadmap has no nodes');
      }
      
      const firstNodeId = nodeData[0].id;
      
      // Create the user roadmap
      const { data, error } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: user.id,
          roadmap_id: roadmap.id,
          language: language,
          current_node_id: firstNodeId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Mark the roadmap as initialized successfully
      toast.success(`${level} ${language} roadmap initialized successfully!`);
      
      // Update the state
      const newUserRoadmap = {
        id: data.id,
        userId: data.user_id,
        roadmapId: data.roadmap_id,
        language: data.language as Language,
        currentNodeId: data.current_node_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
      
      setUserRoadmaps(prev => [...prev, newUserRoadmap]);
    } catch (error: any) {
      console.error('Error initializing roadmap:', error);
      toast.error(error.message || 'Failed to initialize roadmap');
      throw error;
    }
  };

  // Value object for the context provider
  const value: RoadmapContextType = {
    currentRoadmap,
    nodes,
    currentNodeId,
    completedNodes,
    availableNodes,
    nodeProgress,
    isLoading,
    roadmaps,
    userRoadmaps,
    initializeUserRoadmap,
    loadUserRoadmaps,
    loadRoadmaps,
    nodeLoading
  };

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  );
};
