
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoadmap } from '@/hooks/use-roadmap';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import LevelBadge from '@/components/LevelBadge';
import { LanguageLevel } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { RefreshButton } from '@/components/RefreshButton';
import ErrorBoundary from '@/components/ErrorBoundary';

const RoadmapSelection: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel>("A1");
  const { settings } = useUserSettingsContext();
  
  const {
    roadmaps,
    initializeUserRoadmap,
    isLoading, 
    userRoadmaps,
    loadUserRoadmaps,
    refreshData,
    errorState,
    clearErrorState,
    tryAlternateLanguage,
    languageAvailability
  } = useRoadmap();
  
  useEffect(() => {
    // Reload user roadmaps whenever settings change, but don't poll unnecessarily
    loadUserRoadmaps(settings.selectedLanguage);
  }, [settings, loadUserRoadmaps]);

  const handleStartLearning = async () => {
    try {
      await initializeUserRoadmap(selectedLevel, settings.selectedLanguage);
      toast({
        title: "Learning path started",
        description: `You've successfully started a new ${selectedLevel} learning path in ${getCapitalizedLanguage(settings.selectedLanguage)}.`,
      });
    } catch (error: any) {
      console.error("Error initializing roadmap:", error);
      
      // Handle the special case where language is not available
      if (error?.code === 'ROADMAP_NOT_AVAILABLE_FOR_LANGUAGE' && error.suggestedLanguage) {
        // Ask user if they want to try with the suggested language
        const shouldTryAlternate = window.confirm(
          `${error.message || `No roadmap is available for ${settings.selectedLanguage}.`} Would you like to try with ${error.suggestedLanguage} instead?`
        );
        
        if (shouldTryAlternate) {
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
    <ErrorBoundary>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Start a New Learning Path</h2>
            <RefreshButton onRefresh={() => refreshData(settings.selectedLanguage)} isLoading={isLoading} />
          </div>
          
          <p className="text-muted-foreground">
            Select your level to begin a new learning path in {getCapitalizedLanguage(settings.selectedLanguage)}.
          </p>
          
          {errorState.hasError && (
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-700">{errorState.message}</p>
                {errorState.suggestedLanguage && (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm text-blue-600"
                    onClick={() => {
                      tryAlternateLanguage(selectedLevel, settings.selectedLanguage);
                      clearErrorState();
                    }}
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
              {languageAvailability[settings.selectedLanguage] === false ? 
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
