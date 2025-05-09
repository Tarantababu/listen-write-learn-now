
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import {
  fetchRoadmaps,
  fetchUserRoadmaps,
  assignRoadmapToUser,
  updateUserProgress,
  Roadmap,
  UserRoadmap,
  RoadmapNode,
} from '@/services/roadmapService';

interface RoadmapContextProps {
  roadmaps: Roadmap[];
  userRoadmaps: UserRoadmap[];
  loadingRoadmaps: boolean;
  loadingUserRoadmaps: boolean;
  selectedRoadmapId: string | null;
  selectRoadmap: (id: string | null) => void;
  assignRoadmap: (roadmapId: string, language: string) => Promise<boolean>;
  markNodeComplete: (nodeId: string, completed: boolean) => Promise<void>;
  currentLanguageRoadmap: UserRoadmap | null;
  refreshUserRoadmaps: () => Promise<void>;
}

const RoadmapContext = createContext<RoadmapContextProps | undefined>(undefined);

export const useRoadmapContext = () => {
  const context = useContext(RoadmapContext);
  if (!context) {
    throw new Error('useRoadmapContext must be used within a RoadmapProvider');
  }
  return context;
};

export const RoadmapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<UserRoadmap[]>([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(true);
  const [loadingUserRoadmaps, setLoadingUserRoadmaps] = useState(true);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);

  // Get the roadmap for the current selected language
  const currentLanguageRoadmap = userRoadmaps.find(
    ur => ur.language === settings.selectedLanguage
  ) || null;

  // Load all available roadmaps
  useEffect(() => {
    const loadRoadmaps = async () => {
      setLoadingRoadmaps(true);
      try {
        const data = await fetchRoadmaps();
        setRoadmaps(data);
      } catch (error) {
        console.error("Failed to load roadmaps", error);
      } finally {
        setLoadingRoadmaps(false);
      }
    };
    
    loadRoadmaps();
  }, []);

  // Load user's assigned roadmaps
  useEffect(() => {
    if (user) {
      loadUserRoadmaps();
    } else {
      setUserRoadmaps([]);
      setLoadingUserRoadmaps(false);
    }
  }, [user]);

  // Set the selected roadmap to the current language roadmap when available
  useEffect(() => {
    if (currentLanguageRoadmap && !selectedRoadmapId) {
      setSelectedRoadmapId(currentLanguageRoadmap.roadmap_id);
    }
  }, [currentLanguageRoadmap, selectedRoadmapId]);

  const loadUserRoadmaps = async () => {
    if (!user) return;
    
    setLoadingUserRoadmaps(true);
    try {
      const data = await fetchUserRoadmaps(user.id);
      setUserRoadmaps(data);
    } catch (error) {
      console.error("Failed to load user roadmaps", error);
    } finally {
      setLoadingUserRoadmaps(false);
    }
  };

  const selectRoadmap = (id: string | null) => {
    setSelectedRoadmapId(id);
  };

  const assignRoadmap = async (roadmapId: string, language: string) => {
    if (!user) {
      toast.error("You need to be logged in to use roadmaps");
      return false;
    }

    try {
      // Check if user already has a roadmap for this language
      const existingRoadmap = userRoadmaps.find(ur => ur.language === language);
      if (existingRoadmap) {
        toast.info("You already have a roadmap for this language");
        return false;
      }

      await assignRoadmapToUser(roadmapId, user.id, language);
      await loadUserRoadmaps();
      toast.success("Roadmap assigned successfully");
      return true;
    } catch (error) {
      console.error("Failed to assign roadmap", error);
      toast.error("Failed to assign roadmap");
      return false;
    }
  };

  const markNodeComplete = async (nodeId: string, completed: boolean = true) => {
    if (!user) {
      toast.error("You need to be logged in to track progress");
      return;
    }

    try {
      await updateUserProgress(user.id, nodeId, completed);
      await loadUserRoadmaps();
    } catch (error) {
      console.error("Failed to update progress", error);
      toast.error("Failed to update progress");
    }
  };

  const refreshUserRoadmaps = async () => {
    await loadUserRoadmaps();
  };

  const value = {
    roadmaps,
    userRoadmaps,
    loadingRoadmaps,
    loadingUserRoadmaps,
    selectedRoadmapId,
    selectRoadmap,
    assignRoadmap,
    markNodeComplete,
    currentLanguageRoadmap,
    refreshUserRoadmaps,
  };

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  );
};
