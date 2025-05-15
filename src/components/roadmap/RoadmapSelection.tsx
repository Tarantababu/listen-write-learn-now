
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurriculumPath } from '@/hooks/use-curriculum-path';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import LevelBadge from '@/components/LevelBadge';
import { LanguageLevel } from '@/types';
import { toast } from '@/components/ui/use-toast';

const CurriculumPathSelection: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel>("A1");
  const { settings } = useUserSettingsContext();
  
  const {
    initializeUserCurriculumPath,
    curriculumPaths = [], // Provide default empty array to prevent filter of undefined
    isLoading, 
    userCurriculumPaths = [], // Provide default empty array
    loadUserCurriculumPaths
  } = useCurriculumPath();
  
  useEffect(() => {
    // Reload user curriculum paths whenever settings change
    loadUserCurriculumPaths();
  }, [settings, loadUserCurriculumPaths]);

  const handleStartLearning = async () => {
    try {
      await initializeUserCurriculumPath(selectedLevel, settings.selectedLanguage);
    } catch (error) {
      console.error("Error initializing curriculum path:", error);
      toast({
        title: "Failed to start learning path",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Safely filter by providing default empty arrays
  const availableLevels = Array.from(new Set(
    (curriculumPaths || [])
      .filter(path => path.languages?.includes(settings.selectedLanguage))
      .map(path => path.level)
  )) as LanguageLevel[];

  const getCapitalizedLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const hasExistingCurriculumPath = (userCurriculumPaths || []).length > 0;

  return (
    <Card>
      <CardContent className="space-y-4">
        <h2 className="text-lg font-semibold">Start a New Learning Path</h2>
        <p className="text-muted-foreground">
          Select your level to begin a new learning path in {getCapitalizedLanguage(settings.selectedLanguage)}.
        </p>
        
        <div className="grid gap-2">
          <Select 
            value={selectedLevel} 
            onValueChange={(value: LanguageLevel) => setSelectedLevel(value)}
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
          disabled={isLoading || hasExistingCurriculumPath || availableLevels.length === 0}
          className="w-full"
        >
          {isLoading ? 'Loading...' : 'Start Learning'}
        </Button>

        {hasExistingCurriculumPath && (
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

export default CurriculumPathSelection;
