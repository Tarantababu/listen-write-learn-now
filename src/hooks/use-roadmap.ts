
import { useRoadmap as useOldRoadmap } from "@/contexts/RoadmapContext";
import { useRoadmap as useNewRoadmap } from "@/features/roadmap/context/RoadmapContext";
import { useEffect, useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

/**
 * This hook serves as a compatibility layer between the old and new roadmap contexts.
 * It will attempt to use the new context first, and if that fails, it will use the old one.
 */
export function useRoadmap() {
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
            await context.loadUserRoadmaps();
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
  }, [context, isInitialized]);
  
  useEffect(() => {
    if (usingOldImplementation) {
      console.log("Using legacy roadmap implementation");
    } else {
      console.log("Using new roadmap implementation");
    }
  }, [usingOldImplementation]);
  
  return context;
}

// For backward compatibility, also export the specific hook versions
export const useOldRoadmapContext = useOldRoadmap;
export const useNewRoadmapContext = useNewRoadmap;
