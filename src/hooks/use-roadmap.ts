
import { useRoadmap as useOldRoadmap } from "@/contexts/RoadmapContext";
import { useRoadmap as useNewRoadmap } from "@/features/roadmap/context/RoadmapContext";
import { useEffect, useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { useUserSettingsContext } from "@/contexts/UserSettingsContext";

/**
 * This hook serves as a compatibility layer between the old and new roadmap contexts.
 * It will attempt to use the new context first, and if that fails, it will use the old one.
 */
export function useRoadmap() {
  const { settings } = useUserSettingsContext();
  // Initialize state to track which implementation to use
  const [usingOldImplementation, setUsingOldImplementation] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
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
      console.error("No roadmap context available");
      throw new Error("Roadmap context not available: " + e2);
    }
  }

  const context = usingOldImplementation ? oldContext : newContext;
  
  // Initialize the roadmap context (load roadmaps) when component mounts
  useEffect(() => {
    if (!isInitialized && context) {
      const initialize = async () => {
        try {
          console.log("Initializing roadmap context...");
          if (context.loadUserRoadmaps) {
            // Make sure to pass the selected language when loading roadmaps
            await context.loadUserRoadmaps(settings.selectedLanguage);
          }
          setIsInitialized(true);
        } catch (error) {
          console.error("Failed to initialize roadmap context:", error);
          toast({
            variant: "destructive",
            title: "Failed to load roadmaps",
            description: "Please refresh the page and try again."
          });
        }
      };
      
      initialize();
    }
  }, [context, isInitialized, settings.selectedLanguage]);
  
  // Re-initialize when language changes
  useEffect(() => {
    if (isInitialized && context) {
      const refreshRoadmaps = async () => {
        try {
          console.log("Language changed, refreshing roadmaps...");
          if (context.loadUserRoadmaps) {
            await context.loadUserRoadmaps(settings.selectedLanguage);
          }
        } catch (error) {
          console.error("Failed to refresh roadmaps after language change:", error);
        }
      };
      
      refreshRoadmaps();
    }
  }, [settings.selectedLanguage, context, isInitialized]);
  
  // Debug logs for tracking which implementation is being used
  useEffect(() => {
    if (usingOldImplementation) {
      console.log("Using legacy roadmap implementation");
    } else {
      console.log("Using new roadmap implementation");
    }
  }, [usingOldImplementation]);
  
  // Add debug logging for roadmaps data
  useEffect(() => {
    if (context) {
      console.log("Current roadmap data:", {
        roadmaps: context.roadmaps || [],
        userRoadmaps: context.userRoadmaps || [],
        currentRoadmap: context.currentRoadmap,
        nodes: context.nodes || [],
      });
    }
  }, [context?.roadmaps, context?.userRoadmaps, context?.currentRoadmap, context?.nodes]);
  
  return context;
}

// For backward compatibility, also export the specific hook versions
export const useOldRoadmapContext = useOldRoadmap;
export const useNewRoadmapContext = useNewRoadmap;
