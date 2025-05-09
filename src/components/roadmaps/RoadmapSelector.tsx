
import React, { useState } from 'react';
import { useRoadmapContext } from '@/contexts/RoadmapContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Roadmap } from '@/services/roadmapService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Language } from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Check } from 'lucide-react';

interface RoadmapSelectorProps {
  onRoadmapSelected?: () => void;
}

const RoadmapSelector: React.FC<RoadmapSelectorProps> = ({ onRoadmapSelected }) => {
  const { roadmaps, assignRoadmap, loadingRoadmaps } = useRoadmapContext();
  const { settings } = useUserSettingsContext();
  
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const handleRoadmapSelection = (roadmap: Roadmap) => {
    setSelectedRoadmap(roadmap);
  };
  
  const handleAssignRoadmap = async () => {
    if (!selectedRoadmap) {
      toast.error("Please select a roadmap first");
      return;
    }
    
    setIsAssigning(true);
    try {
      const success = await assignRoadmap(selectedRoadmap.id, settings.selectedLanguage);
      if (success && onRoadmapSelected) {
        onRoadmapSelected();
      }
    } finally {
      setIsAssigning(false);
    }
  };
  
  // Group roadmaps by level
  const groupedRoadmaps = roadmaps.reduce((acc, roadmap) => {
    if (!acc[roadmap.level]) {
      acc[roadmap.level] = [];
    }
    acc[roadmap.level].push(roadmap);
    return acc;
  }, {} as Record<string, Roadmap[]>);
  
  // Sort levels in ascending order: A1, A2, B1, B2, C1, C2
  const sortedLevels = Object.keys(groupedRoadmaps).sort();

  if (loadingRoadmaps) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Your Starting Level</CardTitle>
          <CardDescription>Choose a roadmap based on your language proficiency</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (roadmaps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Roadmaps Available</CardTitle>
          <CardDescription>There are no roadmaps available for your language yet</CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <p className="text-muted-foreground text-center">
            Please check back later or contact support@lwlnow.com for assistance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Your Starting Level</CardTitle>
        <CardDescription>
          Choose a roadmap based on your {settings.selectedLanguage} proficiency level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={sortedLevels[0]} className="w-full">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 mb-4">
            {sortedLevels.map(level => (
              <TabsTrigger key={level} value={level}>
                {level}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {sortedLevels.map(level => (
            <TabsContent key={level} value={level}>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-4">
                  {groupedRoadmaps[level].map(roadmap => (
                    <div 
                      key={roadmap.id} 
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${selectedRoadmap?.id === roadmap.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-primary/50'
                        }
                      `}
                      onClick={() => handleRoadmapSelection(roadmap)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{roadmap.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Level: {roadmap.level}
                          </p>
                          {roadmap.description && (
                            <p className="text-sm mt-2">{roadmap.description}</p>
                          )}
                        </div>
                        {selectedRoadmap?.id === roadmap.id && (
                          <div className="bg-primary text-primary-foreground p-1 rounded-full">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleAssignRoadmap} 
          disabled={!selectedRoadmap || isAssigning}
        >
          {isAssigning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assigning...
            </>
          ) : (
            'Start this Roadmap'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoadmapSelector;
