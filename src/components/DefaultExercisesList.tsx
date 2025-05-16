
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, CheckCircle, PlusCircle } from 'lucide-react';
import LevelBadge from '@/components/LevelBadge';
import { useDefaultExercises, DefaultExercise } from '@/hooks/use-default-exercises';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Language, LanguageLevel } from '@/types';

const DefaultExercisesList: React.FC = () => {
  const { defaultExercises, isLoading, fetchDefaultExercises, addToMyExercises } = useDefaultExercises();
  const { settings } = useUserSettingsContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(settings.selectedLanguage);
  const [filteredExercises, setFilteredExercises] = useState<DefaultExercise[]>([]);
  const [adding, setAdding] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchDefaultExercises(selectedLanguage);
  }, [fetchDefaultExercises, selectedLanguage]);

  useEffect(() => {
    setFilteredExercises(defaultExercises.filter(ex => ex.language === selectedLanguage));
  }, [defaultExercises, selectedLanguage]);

  // Group exercises by level
  const exercisesByLevel = filteredExercises.reduce<Record<string, DefaultExercise[]>>((acc, exercise) => {
    const level = exercise.level || 'A1';
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(exercise);
    return acc;
  }, {});

  // Sort levels in order: A0, A1, A2, B1, B2, C1, C2
  const orderedLevels = Object.keys(exercisesByLevel).sort((a, b) => {
    const levelOrder = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    return levelOrder.indexOf(a) - levelOrder.indexOf(b);
  });

  const handleAddToMyExercises = async (exerciseId: string) => {
    setAdding(prev => ({ ...prev, [exerciseId]: true }));
    try {
      const result = await addToMyExercises(exerciseId);
      if (result) {
        // If it was added successfully, navigate to the exercise
        navigate(`/exercise/${result}`);
      }
    } finally {
      setAdding(prev => ({ ...prev, [exerciseId]: false }));
    }
  };

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
  };

  if (isLoading && filteredExercises.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Default Exercises</h2>
        
        <Select
          value={selectedLanguage}
          onValueChange={(value) => handleLanguageChange(value as Language)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {settings.learningLanguages.map((language) => (
              <SelectItem key={language} value={language}>
                {language.charAt(0).toUpperCase() + language.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredExercises.length === 0 ? (
        <Card className="bg-muted/40">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              No exercises available for {selectedLanguage} yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        orderedLevels.map((level) => (
          <div key={level} className="space-y-4">
            <div className="flex items-center gap-2">
              <LevelBadge level={level as LanguageLevel} />
              <h3 className="text-lg font-semibold">{level} Level</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercisesByLevel[level].map((exercise) => (
                <Card key={exercise.id} className="h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{exercise.title}</CardTitle>
                      {exercise.isCompleted && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {exercise.text.substring(0, 100)}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {exercise.tags && exercise.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {exercise.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      className="w-full" 
                      variant={exercise.isCompleted ? "outline" : "default"}
                      onClick={() => handleAddToMyExercises(exercise.id)}
                      disabled={adding[exercise.id]}
                    >
                      {adding[exercise.id] ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : exercise.isCompleted ? (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      ) : (
                        <PlusCircle className="mr-2 h-4 w-4" />
                      )}
                      {exercise.isCompleted ? "Practice Again" : "Start Exercise"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default DefaultExercisesList;
