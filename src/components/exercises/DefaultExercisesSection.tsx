
import React, { useState, useMemo } from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Languages, Folder, ChevronDown } from 'lucide-react';
import { Language } from '@/types';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";

interface DefaultExerciseItem {
  id: string;
  title: string;
  text: string;
  language: Language;
  tags: string[];
  audio_url?: string;
  created_at: string;
}

const DefaultExercisesSection: React.FC = () => {
  const { defaultExercises, defaultExercisesLoading, copyDefaultExercise, exercises } = useExerciseContext();
  const { settings } = useUserSettingsContext();
  const [openTag, setOpenTag] = useState<string | null>(null);
  
  // Filter default exercises by the user's selected language
  const filteredExercises = defaultExercises
    .filter(ex => ex.language === settings.selectedLanguage)
    // Sort by creation date in ascending order (oldest first)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  // Check which default exercises the user already has
  const userDefaultExerciseIds = exercises.map(ex => ex.default_exercise_id).filter(Boolean);
  
  // Group exercises by tag
  const exercisesByTag = useMemo(() => {
    const tagMap: Record<string, DefaultExerciseItem[]> = {};
    
    filteredExercises.forEach(exercise => {
      if (exercise.tags && exercise.tags.length > 0) {
        exercise.tags.forEach(tag => {
          if (!tagMap[tag]) {
            tagMap[tag] = [];
          }
          tagMap[tag].push(exercise);
        });
      } else {
        // Group exercises without tags under "Uncategorized"
        if (!tagMap["Uncategorized"]) {
          tagMap["Uncategorized"] = [];
        }
        tagMap["Uncategorized"].push(exercise);
      }
    });
    
    return tagMap;
  }, [filteredExercises]);
  
  const handleCopyExercise = async (id: string) => {
    try {
      await copyDefaultExercise(id);
    } catch (error) {
      console.error('Error copying exercise:', error);
    }
  };
  
  if (defaultExercisesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Foundational {settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)} Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (filteredExercises.length === 0) {
    return null; // Don't show the section if there are no default exercises for this language
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Folder className="h-5 w-5 mr-2" />
          Foundational {settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)} Exercises
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {Object.entries(exercisesByTag).map(([tag, tagExercises]) => (
            <AccordionItem key={tag} value={tag}>
              <AccordionTrigger className="py-3 font-medium">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">{tagExercises.length}</Badge>
                  {tag}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 py-1">
                  {tagExercises.map((exercise) => {
                    const alreadyAdded = userDefaultExerciseIds.includes(exercise.id);
                    const creationDate = new Date(exercise.created_at).toLocaleDateString();
                    
                    return (
                      <Collapsible key={exercise.id} className="border rounded-md">
                        <CollapsibleTrigger className="flex justify-between w-full items-center px-4 py-2 hover:bg-muted/50 text-left">
                          <div className="font-medium">{exercise.title}</div>
                          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3 pt-1">
                          <div className="text-sm text-muted-foreground mb-3">
                            {exercise.text}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Languages className="h-3 w-3 mr-1" />
                              <span className="capitalize mr-2">{exercise.language}</span>
                              <span>Created: {creationDate}</span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant={alreadyAdded ? "outline" : "default"}
                            className="w-full"
                            onClick={() => handleCopyExercise(exercise.id)}
                            disabled={alreadyAdded}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {alreadyAdded ? 'Already Added' : 'Add to My Exercises'}
                          </Button>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default DefaultExercisesSection;
