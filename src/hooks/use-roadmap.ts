
import { useRoadmap as useOldRoadmap } from "@/contexts/RoadmapContext";
import { useRoadmap as useNewRoadmap } from "@/features/roadmap/context/RoadmapContext";
import { useEffect, useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { useUserSettingsContext } from "@/contexts/UserSettingsContext";
import { useAuth } from "@/contexts/AuthContext";

/**
 * This hook serves as a compatibility layer between the old and new roadmap contexts.
 * It will attempt to use the new context first, and if that fails, it will use the old one.
 */
export function useRoadmap() {
  const { settings } = useUserSettingsContext();
  const { user } = useAuth();
  
  // Initialize state to track which implementation to use
  const [usingOldImplementation, setUsingOldImplementation] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasInitializationFailed, setHasInitializationFailed] = useState(false);
  
  // Try to get the contexts
  let newContext;
  let oldContext;
  
  try {
    newContext = useNewRoadmap();
  } catch (e) {
    // If the new context fails, we'll fall back to the old one
    console.warn("New roadmap context not available, falling back to old implementation");
    try {
      oldContext = useOldRoadmap();
      setUsingOldImplementation(true);
    } catch (e2) {
      console.error("No roadmap context available", e2);
      // We'll handle this case in the returned object
    }
  }

  const context = usingOldImplementation ? oldContext : newContext;
  
  // Initialize the roadmap context (load roadmaps) when component mounts
  useEffect(() => {
    if (!isInitialized && context && user) {
      const initialize = async () => {
        try {
          console.log("Initializing roadmap context...", {
            user,
            language: settings.selectedLanguage,
            isOldImplementation: usingOldImplementation
          });
          
          if (context.loadUserRoadmaps) {
            // Make sure to pass the selected language when loading roadmaps
            await context.loadUserRoadmaps(settings.selectedLanguage);
            console.log("Roadmaps loaded successfully for language:", settings.selectedLanguage);
          }
          
          setIsInitialized(true);
          setHasInitializationFailed(false);
        } catch (error) {
          console.error("Failed to initialize roadmap context:", error);
          setHasInitializationFailed(true);
          
          toast({
            variant: "destructive",
            title: "Failed to load roadmaps",
            description: "Please refresh the page or try again later."
          });
        }
      };
      
      initialize();
    }
  }, [context, isInitialized, settings.selectedLanguage, user]);
  
  // Re-initialize when language changes
  useEffect(() => {
    if (isInitialized && context && user) {
      const refreshRoadmaps = async () => {
        try {
          console.log("Language changed, refreshing roadmaps...", {
            language: settings.selectedLanguage,
            user: user?.id
          });
          
          if (context.loadUserRoadmaps) {
            await context.loadUserRoadmaps(settings.selectedLanguage);
            console.log("Roadmaps refreshed successfully for language:", settings.selectedLanguage);
          }
        } catch (error) {
          console.error("Failed to refresh roadmaps after language change:", error);
          toast({
            variant: "destructive",
            title: "Failed to refresh roadmaps",
            description: "There was an error loading roadmaps for the selected language."
          });
        }
      };
      
      refreshRoadmaps();
    }
  }, [settings.selectedLanguage, context, isInitialized, user]);
  
  // Debug logs for tracking which implementation is being used
  useEffect(() => {
    if (context) {
      if (usingOldImplementation) {
        console.log("Using legacy roadmap implementation");
      } else {
        console.log("Using new roadmap implementation");
      }
    }
  }, [usingOldImplementation, context]);
  
  // Add debug logging for roadmaps data
  useEffect(() => {
    if (context) {
      console.log("Current roadmap data:", {
        authenticated: !!user,
        userID: user?.id,
        language: settings.selectedLanguage,
        roadmapsCount: (context.roadmaps || []).length,
        userRoadmapsCount: (context.userRoadmaps || []).length,
        hasCurrentRoadmap: !!context.currentRoadmap,
        nodesCount: (context.nodes || []).length,
        loadedWithImpl: usingOldImplementation ? "legacy" : "new"
      });
    }
  }, [context?.roadmaps, context?.userRoadmaps, context?.currentRoadmap, context?.nodes, user, settings.selectedLanguage]);

  // If neither context is available, return a fallback object with empty arrays and isLoading=true
  if (!context) {
    return {
      roadmaps: [],
      userRoadmaps: [],
      currentRoadmap: null,
      nodes: [],
      isLoading: true,
      hasError: true,
      loadUserRoadmaps: async () => {
        console.error("No roadmap context available");
        return [];
      },
      selectRoadmap: async () => {
        console.error("No roadmap context available");
      },
      initializeUserRoadmap: async () => {
        console.error("No roadmap context available");
      },
      completedNodes: [],
      availableNodes: [],
    };
  }
  
  return {
    ...context,
    isLoading: context.loading || !isInitialized,
    hasError: hasInitializationFailed
  };
}

// For backward compatibility, also export the specific hook versions
export const useOldRoadmapContext = useOldRoadmap;
export const useNewRoadmapContext = useNewRoadmap;
