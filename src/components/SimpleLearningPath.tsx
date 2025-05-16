
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import LevelBadge from '@/components/LevelBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { LanguageLevel } from '@/types';

interface SimpleLearningPathProps {
  language: string;
}

interface ExerciseItem {
  id: string;
  title: string;
  level: LanguageLevel;
  isCompleted?: boolean;
}

const SimpleLearningPath: React.FC<SimpleLearningPathProps> = ({ language }) => {
  const [exercises, setExercises] = useState<Record<LanguageLevel, ExerciseItem[]>>({} as Record<LanguageLevel, ExerciseItem[]>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch recommended exercises for each level
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        setError(null);

        const normalizedLanguage = language.toLowerCase();
        console.log(`Fetching exercises for language: ${normalizedLanguage}`);

        // Get default exercises for the selected language, grouped by level
        const { data, error } = await supabase
          .from('default_exercises')
          .select('id, title, tags')
          .eq('language', normalizedLanguage)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        // Get completion status for these exercises
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        let completionData: Record<string, boolean> = {};
        if (userId) {
          const { data: userExercises } = await supabase
            .from('exercises')
            .select('default_exercise_id, is_completed')
            .eq('user_id', userId)
            .in('default_exercise_id', data.map(ex => ex.id));

          if (userExercises) {
            completionData = userExercises.reduce((acc: Record<string, boolean>, ex) => {
              if (ex.default_exercise_id) {
                acc[ex.default_exercise_id] = !!ex.is_completed;
              }
              return acc;
            }, {});
          }
        }

        // Group exercises by level
        const levels: LanguageLevel[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const groupedExercises: Record<LanguageLevel, ExerciseItem[]> = {} as Record<LanguageLevel, ExerciseItem[]>;

        // Initialize all levels with empty arrays
        levels.forEach(level => {
          groupedExercises[level] = [];
        });

        // Organize exercises by level tags
        data.forEach(exercise => {
          const tags = exercise.tags || [];
          let exerciseLevel: LanguageLevel | null = null;
          
          // Find level tag
          for (const level of levels) {
            if (tags.includes(level)) {
              exerciseLevel = level as LanguageLevel;
              break;
            }
          }

          // Default to A1 if no level found
          exerciseLevel = exerciseLevel || 'A1';

          groupedExercises[exerciseLevel].push({
            id: exercise.id,
            title: exercise.title,
            level: exerciseLevel,
            isCompleted: completionData[exercise.id] || false
          });
        });

        setExercises(groupedExercises);
      } catch (error) {
        console.error('Error fetching exercises:', error);
        setError('Failed to load exercises. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (language) {
      fetchExercises();
    }
  }, [language]);

  const handleExerciseClick = async (exerciseId: string) => {
    try {
      // First check if user already has this exercise
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({
          title: "Authentication required",
          description: "Please log in to start exercises",
          variant: "destructive"
        });
        return;
      }

      // Check if user already has this exercise
      const { data: existingExercise, error: checkError } = await supabase
        .from('exercises')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('default_exercise_id', exerciseId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingExercise) {
        // Navigate to existing exercise
        navigate(`/dashboard/exercises/${existingExercise.id}`);
      } else {
        // Create a copy of the exercise for the user
        const { data: defaultExercise, error: fetchError } = await supabase
          .from('default_exercises')
          .select('*')
          .eq('id', exerciseId)
          .single();

        if (fetchError) throw fetchError;

        // Create user's copy
        const { data: newExercise, error: insertError } = await supabase
          .from('exercises')
          .insert({
            user_id: userData.user.id,
            title: defaultExercise.title,
            text: defaultExercise.text,
            audio_url: defaultExercise.audio_url,
            language: defaultExercise.language,
            tags: defaultExercise.tags,
            default_exercise_id: defaultExercise.id
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Navigate to the new exercise
        if (newExercise) {
          navigate(`/dashboard/exercises/${newExercise.id}`);
        }
      }
    } catch (error) {
      console.error('Error starting exercise:', error);
      toast({
        title: "Error",
        description: "Failed to start the exercise. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">Loading exercises for your learning path...</p>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
        <p>{error}</p>
        <Button variant="outline" className="mt-2" onClick={() => setLoading(true)}>
          Retry
        </Button>
      </div>
    );
  }

  const hasExercises = Object.values(exercises).some(levelExercises => levelExercises.length > 0);

  if (!hasExercises) {
    return (
      <div className="p-4 border border-amber-200 bg-amber-50 rounded-md text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
        <p>No exercises available for {language} yet. Try selecting a different language or check back later.</p>
      </div>
    );
  }

  const levels: LanguageLevel[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select an exercise below to improve your {language} skills. Start with exercises that match your level.
      </p>
      
      {levels.map((level) => {
        const levelExercises = exercises[level] || [];
        if (levelExercises.length === 0) return null;
        
        return (
          <div key={level} className="space-y-3">
            <div className="flex items-center gap-2">
              <LevelBadge level={level} />
              <h3 className="font-medium">{level} Level</h3>
              <span className="text-xs text-muted-foreground">({levelExercises.length} exercises)</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {levelExercises.slice(0, 3).map((exercise) => (
                <Card 
                  key={exercise.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                    exercise.isCompleted ? 'border-green-200 bg-green-50/30 dark:bg-green-900/10 dark:border-green-900/30' : ''
                  }`}
                  onClick={() => handleExerciseClick(exercise.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium line-clamp-1">{exercise.title}</p>
                      {exercise.isCompleted && (
                        <span className="text-xs text-green-600 dark:text-green-400">Completed</span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
              
              {levelExercises.length > 3 && (
                <Button 
                  variant="ghost" 
                  className="text-xs justify-start"
                  onClick={() => navigate('/dashboard/exercises')}
                >
                  View all {levelExercises.length} exercises for {level}...
                </Button>
              )}
            </div>
          </div>
        );
      })}
      
      <div className="flex justify-end pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/dashboard/exercises')}
        >
          Browse all exercises
        </Button>
      </div>
    </div>
  );
};

export default SimpleLearningPath;
