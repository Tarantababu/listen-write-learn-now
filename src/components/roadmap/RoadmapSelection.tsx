
import React, { useState } from 'react';
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
import { useRoadmap } from '@/contexts/RoadmapContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { LanguageLevel } from '@/types';
import { Loader2 } from 'lucide-react';
import LevelBadge from '@/components/LevelBadge';
import LevelInfoTooltip from '@/components/LevelInfoTooltip';

const RoadmapSelection: React.FC = () => {
  const { initializeUserRoadmap, roadmaps, loading } = useRoadmap();
  const { settings } = useUserSettingsContext();
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel>('A1');
  const [initializing, setInitializing] = useState(false);

  const handleInitializeRoadmap = async () => {
    setInitializing(true);
    try {
      await initializeUserRoadmap(selectedLevel, settings.selectedLanguage);
    } finally {
      setInitializing(false);
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
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Choose Your Starting Level</CardTitle>
        <CardDescription>
          Select the language level that best matches your current proficiency in {settings.selectedLanguage}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 mb-6">
          <span className="text-sm font-medium">Language Level:</span>
          <Select value={selectedLevel} onValueChange={(value) => setSelectedLevel(value as LanguageLevel)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a level" />
            </SelectTrigger>
            <SelectContent>
              {['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                <SelectItem key={level} value={level}>
                  <div className="flex items-center space-x-2">
                    <LevelBadge level={level as LanguageLevel} />
                    <span>{level}</span>
                  </div>
                </SelectItem>
              ))}
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
            The {selectedLevel} roadmap includes {roadmaps.find(r => r.level === selectedLevel)?.name || 'exercises'} 
            designed to improve your {settings.selectedLanguage} skills through focused listening and writing practice.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleInitializeRoadmap} 
          disabled={initializing || !selectedLevel}
          className="w-full"
        >
          {initializing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Start Learning Journey
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoadmapSelection;
