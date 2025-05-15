import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoadmap } from '@/hooks/use-roadmap';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import LevelBadge from '@/components/LevelBadge';
import { LanguageLevel, RoadmapContextType, RoadmapErrorState } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { RefreshButton } from '@/components/RefreshButton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { registerOpenPopup, unregisterPopup } from '@/utils/popupStateManager';

// Define a type for the error state since it seems to be missing from RoadmapContextType
type ErrorState = {
  hasError: boolean;
  message?: string;
  suggestedLanguage?: string;
};

const RoadmapSelection: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel>("A1");
  const { settings } = useUserSettingsContext();
  const dataLoaded = useRef(false);
  const lastLanguageRef = useRef(settings.selectedLanguage);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Handle TypeScript errors by safely accessing the context properties
  const roadmapContext = useRoadmap();
  const {
    roadmaps,
    initializeUserRoadmap,
    isLoading, 
    userRoadmaps,
    loadUserRoadmaps,
  } = roadmapContext;
  
  // Access potentially undefined properties safely
  // We'll define local state to handle these if they don't exist
  const [localErrorState, setLocalErrorState] = useState<ErrorState>({
    hasError: false
  });
  
  // Safely accessing context properties that might not exist in the type
  const refreshData = (roadmapContext as any).refreshData;
  const errorState = (roadmapContext as any).errorState || localErrorState;
  const clearErrorState = (roadmapContext as any).clearErrorState;
  const tryAlternateLanguage = (roadmapContext as any).tryAlternateLanguage;
  const languageAvailability = (roadmapContext as any).languageAvailability || {};
  
  // Load roadmaps only when component mounts or language changes
  useEffect(() => {
    if (!dataLoaded.current || lastLanguageRef.current !== settings.selectedLanguage) {
      // Prevent multiple loading attempts
      dataLoaded.current = true;
      lastLanguageRef.current = settings.selectedLanguage;
      
      // Use a safe version of loadUserRoadmaps that won't cause additional renders
      // if the component unmounts during the process
      let isMounted = true;
      
      if (loadUserRoadmaps) {
        loadUserRoadmaps(settings.selectedLanguage).then(() => {
          // Only update state if the component is still mounted
          if (!isMounted) return;
        }).catch(error => {
          if (isMounted) {
            // Handle error locally if the context doesn't provide error handling
            setLocalErrorState({
              hasError: true,
              message: error?.message || "Failed to load roadmaps"
            });
          }
        });
      }
      
      return () => {
        isMounted = false;
      };
    }
  }, [settings.selectedLanguage, loadUserRoadmaps]);
  
  // Get available levels for the current language (memoized)
  const availableLevels = useMemo(() => {
    return Array.from(new Set(
      (roadmaps || [])  // Handle potential undefined roadmaps
        .filter(roadmap => roadmap.languages?.includes(settings.selectedLanguage))
        .map(roadmap => roadmap.level)
    )).sort() as LanguageLevel[];
  }, [roadmaps, settings.selectedLanguage]);

  // Check if the language has available roadmaps (memoized)
  const isLanguageAvailable = useMemo(() => {
    // First check the availability map, then check if we have roadmaps for this language
    return languageAvailability[settings.selectedLanguage] !== false || 
      (roadmaps || []).some(roadmap => roadmap.languages?.includes(settings.selectedLanguage));
  }, [languageAvailability, settings.selectedLanguage, roadmaps]);

  // Update selected level if current selection is not available
  useEffect(() => {
    if (availableLevels.length > 0 && !availableLevels.includes(selectedLevel)) {
      setSelectedLevel(availableLevels[0]);
    }
  }, [availableLevels, selectedLevel]);

  const getCapitalizedLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Check if user already has roadmaps
  const hasExistingRoadmap = (userRoadmaps || []).length > 0;

  // Handle the start learning process
  const handleStartLearning = async () => {
    // Don't do anything if we're already initializing
    if (isInitializing) return;
    
    try {
      if (!selectedLevel) {
        toast({
          title: "Level selection required",
          description: "Please select a proficiency level to continue.",
          variant: "destructive",
        });
        return;
      }
      
      // Track initialization state
      setIsInitializing(true);
      
      // Register this as an open dialog to prevent background polling during initialization
      registerOpenPopup('roadmap-initialization');
      
      // Clear any previous errors
      if (errorState?.hasError && clearErrorState) {
        clearErrorState();
      } else {
        // Clear local error state if context doesn't provide clearErrorState
        setLocalErrorState({ hasError: false });
      }
      
      if (initializeUserRoadmap) {
        await initializeUserRoadmap(selectedLevel, settings.selectedLanguage);
        toast({
          title: "Learning path started",
          description: `You've successfully started a new ${selectedLevel} learning path in ${getCapitalizedLanguage(settings.selectedLanguage)}.`,
        });
      } else {
        throw new Error("Unable to initialize user roadmap");
      }
    } catch (error: any) {
      console.error("Error initializing roadmap:", error);
      
      // Handle the special case where language is not available
      if (error?.code === 'ROADMAP_NOT_AVAILABLE_FOR_LANGUAGE' && error.suggestedLanguage) {
        // Ask user if they want to try with the suggested language
        const shouldTryAlternate = window.confirm(
          `${error.message || `No roadmap is available for ${settings.selectedLanguage}.`} Would you like to try with ${error.suggestedLanguage} instead?`
        );
        
        if (shouldTryAlternate && tryAlternateLanguage) {
          try {
            await tryAlternateLanguage(selectedLevel, settings.selectedLanguage);
            toast({
              title: "Learning path started",
              description: `You've successfully started a new ${selectedLevel} learning path in ${getCapitalizedLanguage(error.suggestedLanguage)}.`,
            });
          } catch (fallbackError) {
            toast({
              title: "Failed to start learning path",
              description: "Please try again later or try a different level.",
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "Failed to start learning path",
          description: error?.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      // Always clean up, whether successful or not
      setIsInitializing(false);
      unregisterPopup('roadmap-initialization');
    }
  };

  // Handle the refresh button click
  const handleRefresh = () => {
    // Reset the data loaded flag to force reload
    dataLoaded.current = false;
    
    // Be defensive about the refreshData function existing
    if (refreshData) {
      refreshData(settings.selectedLanguage);
    } else if (loadUserRoadmaps) {
      // Fallback to loadUserRoadmaps if refreshData doesn't exist
      loadUserRoadmaps(settings.selectedLanguage);
    }
  };

  // Handle alternate language selection
  const handleTryAlternateLanguage = () => {
    if (!tryAlternateLanguage || !errorState?.suggestedLanguage) return;
    
    tryAlternateLanguage(selectedLevel, settings.selectedLanguage);
    
    if (clearErrorState) {
      clearErrorState();
    } else {
      // Clear local error state if context doesn't provide clearErrorState
      setLocalErrorState({ hasError: false });
    }
  };

  return (
    <ErrorBoundary>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Start a New Learning Path</h2>
            <RefreshButton 
              onRefresh={handleRefresh} 
              isLoading={isLoading || isInitializing} 
            />
          </div>
          
          <p className="text-muted-foreground">
            Select your level to begin a new learning path in {getCapitalizedLanguage(settings.selectedLanguage)}.
          </p>
          
          {errorState?.hasError && (
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-700">{errorState.message}</p>
                {errorState.suggestedLanguage && (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm text-blue-600"
                    onClick={handleTryAlternateLanguage}
                  >
                    Try with {errorState.suggestedLanguage} instead
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <div className="grid gap-2">
            <Select 
              value={selectedLevel} 
              onValueChange={(value: LanguageLevel) => setSelectedLevel(value)}
              disabled={availableLevels.length === 0 || isLoading || isInitializing}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent>
                {availableLevels.length > 0 ? (
                  availableLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      <div className="flex items-center">
                        <LevelBadge level={level} className="mr-2" />
                        {level}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="A1" disabled>
                    <div className="flex items-center">
                      <LevelBadge level="A1" className="mr-2" />
                      No levels available
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleStartLearning} 
            disabled={isLoading || isInitializing || hasExistingRoadmap || availableLevels.length === 0}
            className="w-full"
          >
            {isLoading || isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isInitializing ? 'Starting...' : 'Loading...'}
              </>
            ) : (
              'Start Learning'
            )}
          </Button>

          {hasExistingRoadmap && (
            <p className="text-sm text-muted-foreground text-center">
              You already have an active learning path.
            </p>
          )}

          {availableLevels.length === 0 && !isLoading && !isInitializing && (
            <p className="text-sm text-muted-foreground text-center">
              {!isLanguageAvailable ? 
                `No learning paths available for ${getCapitalizedLanguage(settings.selectedLanguage)}. Try a different language.` : 
                `Loading available learning paths...`}
            </p>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default RoadmapSelection;
