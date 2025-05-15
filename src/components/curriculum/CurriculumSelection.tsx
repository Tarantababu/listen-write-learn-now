
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurriculum } from '@/hooks/use-curriculum';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import LevelBadge from '@/components/LevelBadge';
import { LanguageLevel } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { RefreshButton } from '@/components/RefreshButton';

export const CurriculumSelection: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel>("A1");
  const { settings } = useUserSettingsContext();
  const dataLoaded = useRef(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const { 
    curriculumPaths, 
    userCurriculumPaths, 
    initializeUserCurriculumPath, 
    loadUserCurriculumPaths, 
    isLoading 
  } = useCurriculum();

  // Get available levels for the current language
  const availableLevels = React.useMemo(() => {
    return Array.from(new Set(
      curriculumPaths
        .filter(path => path.language === settings.selectedLanguage)
        .map(path => path.level)
    )).sort() as LanguageLevel[];
  }, [curriculumPaths, settings.selectedLanguage]);

  // Load curricula when component mounts or language changes
  useEffect(() => {
    if (!dataLoaded.current) {
      dataLoaded.current = true;
      loadUserCurriculumPaths(settings.selectedLanguage);
    }
  }, [settings.selectedLanguage, loadUserCurriculumPaths]);

  // Update selected level if current selection is not available
  useEffect(() => {
    if (availableLevels.length > 0 && !availableLevels.includes(selectedLevel)) {
      setSelectedLevel(availableLevels[0]);
    }
  }, [availableLevels, selectedLevel]);

  const getCapitalizedLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Check if user already has curricula
  const hasExistingCurriculum = userCurriculumPaths.length > 0;

  // Handle the start learning process
  const handleStartLearning = async () => {
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
      
      setIsInitializing(true);
      
      await initializeUserCurriculumPath(selectedLevel, settings.selectedLanguage);
      
      toast({
        title: "Learning path started",
        description: `You've successfully started a new ${selectedLevel} learning path in ${getCapitalizedLanguage(settings.selectedLanguage)}.`,
      });
    } catch (error: any) {
      console.error("Error initializing curriculum:", error);
      
      toast({
        title: "Failed to start learning path",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Handle the refresh button click
  const handleRefresh = () => {
    dataLoaded.current = false;
    loadUserCurriculumPaths(settings.selectedLanguage);
  };

  return (
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
          disabled={isLoading || isInitializing || hasExistingCurriculum || availableLevels.length === 0}
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

        {hasExistingCurriculum && (
          <p className="text-sm text-muted-foreground text-center">
            You already have an active learning path.
          </p>
        )}

        {availableLevels.length === 0 && !isLoading && !isInitializing && (
          <p className="text-sm text-muted-foreground text-center">
            No learning paths available for {getCapitalizedLanguage(settings.selectedLanguage)}. Try a different language.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CurriculumSelection;
