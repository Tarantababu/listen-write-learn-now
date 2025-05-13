
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
import { Loader2, RefreshCw } from 'lucide-react';
import LevelBadge from '@/components/LevelBadge';
import LevelInfoTooltip from '@/components/LevelInfoTooltip';
import { toast } from '@/hooks/use-toast';

const RoadmapSelection: React.FC = () => {
  const { initializeUserRoadmap, roadmaps, loading, userRoadmaps, loadUserRoadmaps } = useRoadmap();
  const { settings } = useUserSettingsContext();
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel>('A1');
  const [initializing, setInitializing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter roadmaps to only show those for the currently selected language
  const availableRoadmapsForLanguage = roadmaps.filter(roadmap => 
    roadmap.languages?.includes(settings.selectedLanguage)
  );
  
  // Log available roadmaps for debugging
  console.log('Available roadmaps for language:', settings.selectedLanguage, availableRoadmapsForLanguage);

  // Get existing roadmap levels for the current language
  const existingLevels = userRoadmaps
    .filter(r => r.language === settings.selectedLanguage)
    .map(r => {
      const roadmap = roadmaps.find(rm => rm.id === r.roadmapId);
      return roadmap?.level;
    })
    .filter(Boolean) as LanguageLevel[];
    
  console.log('Existing roadmap levels:', existingLevels);

  const handleInitializeRoadmap = async () => {
    setInitializing(true);
    try {
      console.log(`Starting roadmap initialization for level ${selectedLevel} and language ${settings.selectedLanguage}`);
      
      await initializeUserRoadmap(selectedLevel, settings.selectedLanguage);
      
      console.log('Roadmap initialization complete');
      
      toast({
        title: "Roadmap Initialized",
        description: `Your ${selectedLevel} level roadmap for ${settings.selectedLanguage} has been created.`,
      });
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
      console.log('Refreshing roadmaps...');
      await loadUserRoadmaps();
      console.log('Roadmaps refreshed successfully');
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

  // Get available levels
  const getAvailableLevels = (): LanguageLevel[] => {
    const levels: LanguageLevel[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    return levels.filter(level => isLevelAvailable(level));
  };

  const availableLevels = getAvailableLevels();
  console.log('Available levels:', availableLevels);

  // Set default selected level to first available that isn't already selected
  useEffect(() => {
    if (availableLevels.length > 0) {
      const unselectedLevel = availableLevels.find(level => !isLevelAlreadySelected(level));
      if (unselectedLevel) {
        setSelectedLevel(unselectedLevel);
      } else {
        setSelectedLevel(availableLevels[0]);
      }
    }
  }, [availableLevels.join(','), existingLevels.join(',')]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading roadmaps...</p>
      </div>
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
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableLevels.length === 0 ? (
          <div className="bg-primary/5 p-4 rounded-md border border-primary/20 mb-4">
            <h4 className="font-medium text-sm mb-1">No Roadmaps Available</h4>
            <p className="text-sm text-muted-foreground">
              There are no roadmaps available for {settings.selectedLanguage} at the moment.
              Try refreshing or check back later.
            </p>
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
                          <LevelBadge level={level as LanguageLevel} />
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
                The {selectedLevel} roadmap includes {availableRoadmapsForLanguage.find(r => r.level === selectedLevel)?.name || 'exercises'} 
                designed to improve your {settings.selectedLanguage} skills through focused listening and writing practice.
              </p>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleInitializeRoadmap} 
          disabled={initializing || !selectedLevel || isLevelAlreadySelected(selectedLevel) || availableLevels.length === 0}
          className="w-full"
        >
          {initializing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {existingLevels.length > 0 ? 'Add This Roadmap' : 'Start Learning Journey'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoadmapSelection;
