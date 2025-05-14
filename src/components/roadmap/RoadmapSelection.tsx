import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useRoadmap } from '@/hooks/use-roadmap';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { LanguageLevel } from '@/types';
import { Loader2, RefreshCw, InfoIcon } from 'lucide-react';
import LevelBadge from '@/components/LevelBadge';
import LevelInfoTooltip from '@/components/LevelInfoTooltip';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const RoadmapSelection: React.FC = () => {
  const { initializeUserRoadmap, roadmaps, isLoading, userRoadmaps, loadUserRoadmaps } = useRoadmap();
  const { settings } = useUserSettingsContext();
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel | ''>('');
  const [initializing, setInitializing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [availableLevels, setAvailableLevels] = useState<LanguageLevel[]>([]);
  const [existingLevels, setExistingLevels] = useState<LanguageLevel[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Define all possible language levels explicitly - this ensures levels are shown even when DB has no roadmaps
  const allLanguageLevels: LanguageLevel[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // Filter roadmaps to only show those for the currently selected language
  const availableRoadmapsForLanguage = roadmaps.filter(roadmap => 
    roadmap.languages?.includes(settings.selectedLanguage)
  );

  // Level descriptions mapping
  const levelDescriptions: Record<LanguageLevel, string> = {
    'A0': 'Absolute Beginner - Can recognize some basic words and phrases',
    'A1': 'Beginner - Can understand and use familiar everyday expressions',
    'A2': 'Elementary - Can communicate in simple and routine tasks',
    'B1': 'Intermediate - Can deal with most situations likely to arise',
    'B2': 'Upper Intermediate - Can interact with a degree of fluency',
    'C1': 'Advanced - Can use language effectively for social, academic and professional purposes',
    'C2': 'Mastery - Can understand with ease virtually everything heard or read'
  };

  // Check if the selected level has a roadmap available in the user's language
  // Always return true to allow all levels to be selected even when no roadmaps exist in DB
  const isLevelAvailable = (level: LanguageLevel): boolean => {
    return true; // Allow all levels to be selected regardless of DB state
  };

  // Check if the user already has a roadmap for this level and language
  const isLevelAlreadySelected = (level: LanguageLevel): boolean => {
    return existingLevels.includes(level);
  };

  // Initial data loading - with throttling to prevent excessive calls
  useEffect(() => {
    if (!dataLoaded && !isLoading) {
      const fetchData = async () => {
        try {
          await loadUserRoadmaps(settings.selectedLanguage);
          setDataLoaded(true);
        } catch (error) {
          console.error("Error loading roadmap data:", error);
        }
      };
      
      fetchData();
    }
  }, [dataLoaded, isLoading, loadUserRoadmaps, settings.selectedLanguage]);

  // Calculate available and existing levels - run only when data changes, not continuously
  useEffect(() => {
    // Get existing roadmap levels for the current language
    const userLevels = userRoadmaps
      .filter(r => r.language === settings.selectedLanguage)
      .map(r => {
        const roadmap = roadmaps.find(rm => rm.id === r.roadmapId);
        return roadmap?.level;
      })
      .filter(Boolean) as LanguageLevel[];
    
    setExistingLevels(userLevels);

    // ALWAYS show all standard levels regardless of what's in the database
    let levelsToShow: LanguageLevel[] = allLanguageLevels;
    
    setAvailableLevels(levelsToShow);
    
    // Set default selected level to first available that isn't already selected
    if (levelsToShow.length > 0) {
      const unselectedLevel = levelsToShow.find(level => !userLevels.includes(level));
      setSelectedLevel(unselectedLevel || levelsToShow[0]);
    } else {
      setSelectedLevel('');
    }
  }, [roadmaps, userRoadmaps, settings.selectedLanguage, retryCount, dataLoaded]);

  // Handle initialization with error catching and clearer messaging
  const handleInitializeRoadmap = async () => {
    if (!selectedLevel) return;
    
    setInitializing(true);
    try {
      await initializeUserRoadmap(selectedLevel, settings.selectedLanguage);
      
      toast({
        title: "Roadmap Initialized",
        description: `Your ${selectedLevel} level roadmap for ${settings.selectedLanguage} has been created.`,
      });
      
      // Reload user roadmaps to refresh the UI and set dataLoaded to false to trigger a new load
      setDataLoaded(false);
      await loadUserRoadmaps(settings.selectedLanguage);
    } catch (error) {
      console.error('Error initializing roadmap:', error);
      toast({
        variant: "destructive",
        title: "Failed to initialize roadmap",
        description: "There was an error creating your roadmap. Please try again.",
      });
    } finally {
      setInitializing(false);
    }
  };

  // Handle refresh with proper error handling and loading states
  const handleRefreshRoadmaps = async () => {
    // Prevent multiple rapid refreshes
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      setDataLoaded(false);
      await loadUserRoadmaps(settings.selectedLanguage);
      setRetryCount(count => count + 1); // Force recalculation of available levels
      
      toast({
        title: "Roadmaps Refreshed",
        description: "Available roadmaps have been refreshed.",
      });
    } catch (error) {
      console.error('Error refreshing roadmaps:', error);
      toast({
        variant: "destructive",
        title: "Failed to refresh roadmaps",
        description: "There was an error refreshing roadmaps. Please try again.",
      });
    } finally {
      // Delay turning off refreshing state to prevent rapid repeated clicks
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }
  };

  // Get the currently selected roadmap info
  const selectedRoadmapInfo = selectedLevel 
    ? availableRoadmapsForLanguage.find(r => r.level === selectedLevel) 
    : null;

  // Determine button text
  const buttonText = existingLevels.length > 0 
    ? 'Add This Roadmap' 
    : 'Start Learning Journey';

  if (isLoading && !dataLoaded) {
    // Keep loading state UI
    return (
      <Card className="w-full max-w-md mx-auto shadow-md">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-semibold">Choose Your Starting Level</CardTitle>
          <CardDescription>
            {existingLevels.length > 0 
              ? `Add another ${settings.selectedLanguage} roadmap at a different level`
              : `Select the language level that best matches your current proficiency in ${settings.selectedLanguage}`
            }
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefreshRoadmaps}
          disabled={refreshing}
          title="Refresh available roadmaps"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableLevels.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md dark:bg-amber-900/20 dark:border-amber-800">
            <div className="flex items-start">
              <InfoIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-400 text-sm">No Roadmaps Available</h4>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                  There are no roadmaps available for {settings.selectedLanguage} at the moment.
                  Please select a level to create a new roadmap.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {existingLevels.length > 0 && (
              <div className="bg-primary/5 p-4 rounded-md border border-primary/20 mb-4">
                <h4 className="font-medium text-sm mb-1">Your Current Roadmaps</h4>
                <div className="flex flex-wrap gap-2">
                  {existingLevels.map(level => (
                    <LevelBadge key={level} level={level} />
                  ))}
                </div>
              </div>
            )}
        
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-sm font-medium">Language Level:</span>
              <Select 
                value={selectedLevel} 
                onValueChange={(value) => setSelectedLevel(value as LanguageLevel)}
                disabled={availableLevels.length === 0}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a level" />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.map((level) => {
                    const isAlreadySelected = isLevelAlreadySelected(level);
                    return (
                      <SelectItem 
                        key={level} 
                        value={level}
                        disabled={isAlreadySelected}
                      >
                        <div className="flex items-center space-x-2">
                          <LevelBadge level={level} />
                          <span>{level}</span>
                          {isAlreadySelected && <span className="text-xs text-muted-foreground ml-2">(Already selected)</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <LevelInfoTooltip />
            </div>

            {selectedLevel && (
              <>
                <div className="p-4 bg-muted/50 rounded-md">
                  <h3 className="font-medium mb-2 flex items-center">
                    <LevelBadge level={selectedLevel} className="mr-2" /> 
                    {selectedLevel} Level
                  </h3>
                  <p className="text-sm text-muted-foreground">{levelDescriptions[selectedLevel]}</p>
                </div>

                <div className="bg-primary/5 p-4 rounded-md border border-primary/20">
                  <h4 className="font-medium text-sm mb-1">What will you learn?</h4>
                  <p className="text-sm text-muted-foreground">
                    The {selectedLevel} roadmap includes {selectedRoadmapInfo?.name || 'exercises'} 
                    designed to improve your {settings.selectedLanguage} skills through focused listening and writing practice.
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleInitializeRoadmap} 
          disabled={
            initializing || 
            !selectedLevel || 
            isLevelAlreadySelected(selectedLevel as LanguageLevel)
          }
          className="w-full"
        >
          {initializing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoadmapSelection;
