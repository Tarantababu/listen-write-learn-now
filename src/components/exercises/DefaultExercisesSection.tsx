
import React from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Languages, Folder } from 'lucide-react';
import { Language } from '@/types';

interface DefaultExerciseItem {
  id: string;
  title: string;
  text: string;
  language: Language;
  tags: string[];
  audio_url?: string;
}

const DefaultExercisesSection: React.FC = () => {
  const { defaultExercises, defaultExercisesLoading, copyDefaultExercise, exercises } = useExerciseContext();
  const { settings } = useUserSettingsContext();
  
  // Filter default exercises by the user's selected language
  const filteredExercises = defaultExercises.filter(
    ex => ex.language === settings.selectedLanguage
  );
  
  // Check which default exercises the user already has
  const userDefaultExerciseIds = exercises.map(ex => ex.default_exercise_id).filter(Boolean);
  
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
          <CardTitle className="text-lg">Default {settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)} Exercises</CardTitle>
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
          Default {settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)} Exercises
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExercises.map((exercise: DefaultExerciseItem) => {
            const alreadyAdded = userDefaultExerciseIds.includes(exercise.id);
            
            return (
              <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium">{exercise.title}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Languages className="h-3 w-3" />
                    <span className="capitalize">{exercise.language}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {exercise.text}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {exercise.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DefaultExercisesSection;
