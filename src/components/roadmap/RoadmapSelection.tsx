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
    loadUserRoadmaps
  } = useRoadmap();
  
  useEffect(() => {
    // Reload user roadmaps whenever settings change
    loadUserRoadmaps();
  }, [settings, loadUserRoadmaps]);

  const handleStartLearning = async () => {
    try {
      await initializeUserRoadmap(selectedLevel, settings.selectedLanguage);
    } catch (error) {
      console.error("Error initializing roadmap:", error);
      toast({
        title: "Failed to start learning path",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const availableLevels = Array.from(new Set(
    roadmaps
      .filter(roadmap => roadmap.languages?.includes(settings.selectedLanguage))
      .map(roadmap => roadmap.level)
  ));

  const getCapitalizedLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const hasExistingRoadmap = userRoadmaps.length > 0;

  return (
    <Card>
      <CardContent className="space-y-4">
        <h2 className="text-lg font-semibold">Start a New Learning Path</h2>
        <p className="text-muted-foreground">
          Select your level to begin a new learning path in {getCapitalizedLanguage(settings.selectedLanguage)}.
        </p>
        
        <div className="grid gap-2">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your level" />
            </SelectTrigger>
            <SelectContent>
              {availableLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  <div className="flex items-center">
                    <LevelBadge level={level} className="mr-2" />
                    {level}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleStartLearning} 
          disabled={isLoading || hasExistingRoadmap || availableLevels.length === 0}
          className="w-full"
        >
          {isLoading ? 'Loading...' : 'Start Learning'}
        </Button>

        {hasExistingRoadmap && (
          <p className="text-sm text-muted-foreground text-center">
            You already have an active learning path.
          </p>
        )}

        {availableLevels.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center">
            No learning paths available for {getCapitalizedLanguage(settings.selectedLanguage)} at the moment.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RoadmapSelection;
