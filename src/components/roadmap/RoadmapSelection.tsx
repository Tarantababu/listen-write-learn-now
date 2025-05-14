
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
import { useRoadmap } from '@/hooks/use-roadmap';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Loader2 } from 'lucide-react';

const RoadmapSelection: React.FC = () => {
  const { initializeUserRoadmap, roadmaps, isLoading } = useRoadmap();
  const { settings } = useUserSettingsContext();
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>('');
  const [initializing, setInitializing] = useState(false);

  // Filter roadmaps to only show those for the currently selected language
  const availableRoadmapsForLanguage = roadmaps.filter(roadmap => 
    roadmap.language === settings.selectedLanguage
  );

  const handleInitializeRoadmap = async () => {
    if (!selectedRoadmapId) return;
    
    setInitializing(true);
    try {
      await initializeUserRoadmap(selectedRoadmapId);
    } finally {
      setInitializing(false);
    }
  };

  // Get the selected language with proper capitalization
  const getCapitalizedLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Choose a Learning Path</CardTitle>
        <CardDescription>
          Select a roadmap to start learning {getCapitalizedLanguage(settings.selectedLanguage)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Available Learning Paths:</label>
            <Select 
              value={selectedRoadmapId} 
              onValueChange={setSelectedRoadmapId}
              disabled={isLoading || availableRoadmapsForLanguage.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a roadmap" />
              </SelectTrigger>
              <SelectContent>
                {availableRoadmapsForLanguage.map((roadmap) => (
                  <SelectItem key={roadmap.id} value={roadmap.id}>
                    {roadmap.name} ({roadmap.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedRoadmapId && (
            <div className="p-4 bg-muted rounded-md">
              <h3 className="font-medium">About this roadmap</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {roadmaps.find(r => r.id === selectedRoadmapId)?.description || 
                 "This roadmap will guide you through a series of exercises to improve your language skills."}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleInitializeRoadmap} 
          disabled={!selectedRoadmapId || initializing}
          className="w-full"
        >
          {initializing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Start Learning
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoadmapSelection;
