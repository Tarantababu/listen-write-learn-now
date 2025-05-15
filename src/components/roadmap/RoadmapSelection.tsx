
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoadmap } from '@/hooks/use-roadmap';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import LevelBadge from '@/components/LevelBadge';
import { LanguageLevel } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { RefreshButton } from '@/components/RefreshButton';

const RoadmapSelection: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel>("A1");
  const { settings } = useUserSettingsContext();
  
  const {
    roadmaps,
    initializeUserRoadmap,
    isLoading, 
    userRoadmaps,
    loadUserRoadmaps,
    refreshData
  } = useRoadmap();
  
  useEffect(() => {
    // Reload user roadmaps whenever settings change, but don't poll unnecessarily
    loadUserRoadmaps();
  }, [settings, loadUserRoadmaps]);

  const handleStartLearning = async () => {
    try {
      await initializeUserRoadmap(selectedLevel, settings.selectedLanguage);
      toast({
        title: "Learning path started",
        description: `You've successfully started a new ${selectedLevel} learning path in ${getCapitalizedLanguage(settings.selectedLanguage)}.`,
      });
    } catch (error) {
      console.error("Error initializing roadmap:", error);
      toast({
        title: "Failed to start learning path",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Get available levels for the current language
  const availableLevels = Array.from(new Set(
    roadmaps
      .filter(roadmap => roadmap.languages?.includes(settings.selectedLanguage))
      .map(roadmap => roadmap.level)
  )).sort() as LanguageLevel[];

  const getCapitalizedLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const hasExistingRoadmap = userRoadmaps.length > 0;

  // Check if selected level is available
  useEffect(() => {
    if (availableLevels.length > 0 && !availableLevels.includes(selectedLevel)) {
      setSelectedLevel(availableLevels[0]);
    }
  }, [availableLevels, selectedLevel]);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Start a New Learning Path</h2>
          <RefreshButton onRefresh={() => refreshData(settings.selectedLanguage)} isLoading={isLoading} />
        </div>
        
        <p className="text-muted-foreground">
          Select your level to begin a new learning path in {getCapitalizedLanguage(settings.selectedLanguage)}.
        </p>
        
        <div className="grid gap-2">
          <Select 
            value={selectedLevel} 
            onValueChange={(value: LanguageLevel) => setSelectedLevel(value)}
            disabled={availableLevels.length === 0 || isLoading}
          >
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
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
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
