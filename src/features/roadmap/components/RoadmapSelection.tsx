
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoadmap } from '@/hooks/use-roadmap';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import LevelBadge from '@/components/LevelBadge';
import { LanguageLevel } from '@/types';
import { toast } from '@/components/ui/use-toast';

const RoadmapSelection: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel>("A1");
  const { settings } = useUserSettingsContext();
  
  const {
    initializeUserRoadmap,
    roadmaps = [], // Provide default empty array to prevent filter of undefined
    isLoading, 
    userRoadmaps = [] // Provide default empty array
  } = useRoadmap();
  
  // Safely filter roadmaps with a null check
  const availableRoadmaps = roadmaps?.filter(roadmap =>
    roadmap.languages?.includes(settings.selectedLanguage) && roadmap.level === selectedLevel
  ) || [];

  // Check if there are any available roadmaps for the selected language
  const hasAvailableRoadmaps = roadmaps?.some(roadmap =>
    roadmap.languages?.includes(settings.selectedLanguage)
  ) || false;

  // Get the selected language with proper capitalization
  const getCapitalizedLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const handleStartLearning = async () => {
    try {
      await initializeUserRoadmap(selectedLevel, settings.selectedLanguage);
    } catch (error) {
      console.error("Error initializing roadmap:", error);
      toast({
        variant: "destructive",
        title: "Failed to start learning path",
        description: "Please try again later."
      });
    }
  };

  // Disable the "Start Learning" button if there are no available roadmaps
  const isStartLearningDisabled = availableRoadmaps.length === 0;
  
  // Check if the user already has an active roadmap
  const hasExistingRoadmap = userRoadmaps.length > 0;

  return (
    <Card>
      <CardContent className="space-y-4">
        <h2 className="text-lg font-semibold">Start a New Learning Path</h2>
        
        {!hasAvailableRoadmaps && !isLoading && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              No roadmaps available for {getCapitalizedLanguage(settings.selectedLanguage)} yet.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Select Level</h3>
          <Select 
            value={selectedLevel} 
            onValueChange={(value: LanguageLevel) => setSelectedLevel(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A0">
                <div className="flex items-center">
                  Beginner <LevelBadge level="A0" className="ml-2" />
                </div>
              </SelectItem>
              <SelectItem value="A1">
                <div className="flex items-center">
                  Beginner <LevelBadge level="A1" className="ml-2" />
                </div>
              </SelectItem>
              <SelectItem value="A2">
                <div className="flex items-center">
                  Elementary <LevelBadge level="A2" className="ml-2" />
                </div>
              </SelectItem>
              <SelectItem value="B1">
                <div className="flex items-center">
                  Intermediate <LevelBadge level="B1" className="ml-2" />
                </div>
              </SelectItem>
              <SelectItem value="B2">
                <div className="flex items-center">
                  Upper Intermediate <LevelBadge level="B2" className="ml-2" />
                </div>
              </SelectItem>
              <SelectItem value="C1">
                <div className="flex items-center">
                  Advanced <LevelBadge level="C1" className="ml-2" />
                </div>
              </SelectItem>
              <SelectItem value="C2">
                <div className="flex items-center">
                  Proficient <LevelBadge level="C2" className="ml-2" />
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          className="w-full" 
          onClick={handleStartLearning}
          disabled={isLoading || isStartLearningDisabled || hasExistingRoadmap}
        >
          {isLoading ? 'Loading...' : 'Start Learning'}
        </Button>
        
        {isStartLearningDisabled && !hasExistingRoadmap && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            No roadmaps available for the selected level.
          </p>
        )}

        {hasExistingRoadmap && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            You already have an active learning path.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RoadmapSelection;
