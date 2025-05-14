import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoadmap } from '@/hooks/use-roadmap';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import LevelBadge from '@/components/LevelBadge';
import { LanguageLevel } from '@/types';
import { toast } from '@/components/ui/use-toast';

const RoadmapSelection: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel>('beginner');
  const { settings } = useUserSettingsContext();
  
  const {
    initializeUserRoadmap,
    roadmaps,
    isLoading, 
    userRoadmaps,
  } = useRoadmap();
  
  // Filter roadmaps based on the selected language and level
  const availableRoadmaps = roadmaps.filter(roadmap =>
    roadmap.languages?.includes(settings.selectedLanguage) && roadmap.level === selectedLevel
  );

  // Check if there are any available roadmaps for the selected language
  const hasAvailableRoadmaps = roadmaps.some(roadmap =>
    roadmap.languages?.includes(settings.selectedLanguage)
  );

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
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">
                <div className="flex items-center">
                  Beginner <LevelBadge level="beginner" className="ml-2" />
                </div>
              </SelectItem>
              <SelectItem value="intermediate">
                <div className="flex items-center">
                  Intermediate <LevelBadge level="intermediate" className="ml-2" />
                </div>
              </SelectItem>
              <SelectItem value="advanced">
                <div className="flex items-center">
                  Advanced <LevelBadge level="advanced" className="ml-2" />
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          className="w-full" 
          onClick={handleStartLearning}
          disabled={isLoading || isStartLearningDisabled}
        >
          {isLoading ? 'Loading...' : 'Start Learning'}
        </Button>
        
        {isStartLearningDisabled && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            No roadmaps available for the selected level.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RoadmapSelection;
