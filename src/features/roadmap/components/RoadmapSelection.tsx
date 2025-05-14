
import React, { useEffect, useState } from 'react';
import { roadmapService } from '../api/roadmapService';
import { RoadmapItem } from '../types';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Star } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const RoadmapSelection: React.FC = () => {
  const { settings } = useUserSettingsContext();
  const [availableRoadmaps, setAvailableRoadmaps] = useState<RoadmapItem[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  // Load available roadmaps
  useEffect(() => {
    const loadRoadmaps = async () => {
      try {
        setIsLoading(true);
        const roadmaps = await roadmapService.getRoadmapsForLanguage(settings.selectedLanguage);
        setAvailableRoadmaps(roadmaps);
        
        // Auto-select the first roadmap if available
        if (roadmaps.length > 0 && !selectedRoadmapId) {
          setSelectedRoadmapId(roadmaps[0].id);
        }
      } catch (error) {
        console.error("Error loading available roadmaps:", error);
        toast({
          variant: "destructive",
          title: "Error loading roadmaps",
          description: "Failed to load available learning paths."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRoadmaps();
  }, [settings.selectedLanguage]);

  const handleInitializeRoadmap = async () => {
    if (!selectedRoadmapId) return;
    
    setIsInitializing(true);
    try {
      await roadmapService.initializeRoadmap(selectedRoadmapId);
      
      toast({
        title: "Learning path started!",
        description: "Your new learning journey has begun!",
      });
      
      // Redirect or refresh
      window.location.href = "/roadmap";
    } catch (error) {
      console.error("Error initializing roadmap:", error);
      toast({
        variant: "destructive",
        title: "Error starting learning path",
        description: "Failed to start the selected learning path. Please try again."
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const selectedRoadmap = availableRoadmaps.find(r => r.id === selectedRoadmapId);

  return (
    <Card className="max-w-md mx-auto transition-all">
      <CardHeader>
        <CardTitle>Choose a Learning Path</CardTitle>
        <CardDescription>
          Select a roadmap for {settings.selectedLanguage}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Available Learning Paths:</label>
          <Select 
            value={selectedRoadmapId} 
            onValueChange={setSelectedRoadmapId}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a learning path" />
            </SelectTrigger>
            <SelectContent>
              {availableRoadmaps.map((roadmap) => (
                <SelectItem key={roadmap.id} value={roadmap.id}>
                  {roadmap.name} ({roadmap.level})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedRoadmap && (
          <div className="rounded-md bg-muted p-4 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{selectedRoadmap.name}</h3>
                <Badge variant="secondary">{selectedRoadmap.level}</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedRoadmap.description || 
                "This roadmap will guide you through exercises to improve your language skills."}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 mr-1 text-green-500" />
                <span>Structured learning</span>
              </div>
              <div className="flex items-center text-sm">
                <Star className="h-4 w-4 mr-1 text-amber-500" />
                <span>Bonus exercises</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleInitializeRoadmap} 
          disabled={!selectedRoadmapId || isInitializing}
          className="w-full"
        >
          {isInitializing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Start Learning Path
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoadmapSelection;
