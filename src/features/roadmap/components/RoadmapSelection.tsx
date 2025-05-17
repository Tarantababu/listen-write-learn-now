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
import { motion } from 'framer-motion';
import { getLanguageFlag } from '@/utils/languageUtils';

const RoadmapSelection: React.FC = () => {
  const { 
    initializeUserRoadmap, 
    roadmaps, 
    isLoading, 
    userRoadmaps, 
    loadUserRoadmaps,
    loadRoadmaps
  } = useRoadmap();
  
  const { settings } = useUserSettingsContext();
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel | ''>('');
  const [initializing, setInitializing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [availableLevels, setAvailableLevels] = useState<LanguageLevel[]>([]);
  const [existingLevels, setExistingLevels] = useState<LanguageLevel[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Normalize language for case-insensitive comparison
  const normalizedSelectedLanguage = settings.selectedLanguage.toLowerCase();
  
  // Filter roadmaps to only show those for the currently selected language (case-insensitive)
  const availableRoadmapsForLanguage = roadmaps.filter(roadmap => 
    roadmap.languages?.some(lang => lang.toLowerCase() === normalizedSelectedLanguage)
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
  const isLevelAvailable = (level: LanguageLevel): boolean => {
    return availableRoadmapsForLanguage.some(roadmap => roadmap.level === level);
  };

  // Check if the user already has a roadmap for this level and language
  const isLevelAlreadySelected = (level: LanguageLevel): boolean => {
    return existingLevels.includes(level);
  };

  // Force reload roadmaps on component mount and when language changes
  useEffect(() => {
    const loadData = async () => {
      try {
        // First load available roadmaps for the language
        await loadRoadmaps(settings.selectedLanguage);
        // Then load user roadmaps for the language
        await loadUserRoadmaps(settings.selectedLanguage);
      } catch (error) {
        console.error('Error loading roadmap data:', error);
      }
    };
    
    loadData();
  }, [settings.selectedLanguage, loadRoadmaps, loadUserRoadmaps]);

  // Calculate available and existing levels
  useEffect(() => {
    // Get existing roadmap levels for the current language
    const userLevels = userRoadmaps
      .filter(r => r.language.toLowerCase() === normalizedSelectedLanguage)
      .map(r => {
        const roadmap = roadmaps.find(rm => rm.id === r.roadmapId);
        return roadmap?.level;
      })
      .filter(Boolean) as LanguageLevel[];
    
    setExistingLevels(userLevels);

    // Get all available levels for the current language
    const levels: LanguageLevel[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const availableLevels = levels.filter(level => isLevelAvailable(level));
    setAvailableLevels(availableLevels);
    
    // Set default selected level to first available that isn't already selected
    if (availableLevels.length > 0) {
      const unselectedLevel = availableLevels.find(level => !userLevels.includes(level));
      setSelectedLevel(unselectedLevel || availableLevels[0]);
    } else {
      setSelectedLevel('');
    }
    
    // Update debug info
    setDebugInfo({
      normalizedLanguage: normalizedSelectedLanguage,
      roadmapsCount: roadmaps.length,
      availableRoadmapsCount: availableRoadmapsForLanguage.length,
      roadmapLanguages: roadmaps.map(r => r.languages),
      availableLevels,
      userLevels
    });
    
  }, [roadmaps, userRoadmaps, normalizedSelectedLanguage, retryCount]);

  const handleInitializeRoadmap = async () => {
    if (!selectedLevel) return;
    
    setInitializing(true);
    try {
      await initializeUserRoadmap(selectedLevel, settings.selectedLanguage);
      
      toast({
        title: "Roadmap Initialized",
        description: `Your ${selectedLevel} level roadmap for ${settings.selectedLanguage} has been created.`,
      });
      
      // Reload user roadmaps to refresh the UI
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

  const handleRefreshRoadmaps = async () => {
    setRefreshing(true);
    try {
      // First reload available roadmaps
      await loadRoadmaps(settings.selectedLanguage);
      // Then reload user roadmaps
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
      setRefreshing(false);
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

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Loading Roadmaps</CardTitle>
          <CardDescription>
            Please wait while we load available roadmaps for {settings.selectedLanguage}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-semibold">Choose Your Starting Level</CardTitle>
          <CardDescription className="flex items-center">
            <span className="mr-2">{getLanguageFlag(settings.selectedLanguage)}</span>
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
                  Try refreshing or check back later.
                </p>
              </div>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-3 bg-gray-800 text-gray-300 p-3 rounded text-xs overflow-auto max-h-40">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
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
            isLevelAlreadySelected(selectedLevel as LanguageLevel) || 
            availableLevels.length === 0
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
