
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Plus, Mic, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { CreateShadowingExerciseModal } from './CreateShadowingExerciseModal';
import { ShadowingPracticeModal } from './ShadowingPracticeModal';
import { useShadowingExercises } from '@/hooks/useShadowingExercises';

export const ShadowingExercisesSection: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const { exercises, loading, createExercise, refreshExercises } = useShadowingExercises();

  const filteredExercises = exercises.filter(exercise => 
    exercise.language === settings.selectedLanguage
  );

  const handleCreateExercise = async (exerciseData: any) => {
    try {
      await createExercise(exerciseData);
      setIsCreateModalOpen(false);
      refreshExercises();
    } catch (error) {
      console.error('Failed to create shadowing exercise:', error);
    }
  };

  const handlePracticeExercise = (exercise: any) => {
    setSelectedExercise(exercise);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shadowing Exercises</h2>
          <p className="text-muted-foreground">
            Practice pronunciation and fluency through sentence-level shadowing
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Exercise
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Volume2 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">How Shadowing Works</h3>
              <p className="text-sm text-blue-800 mt-1">
                Listen to sentences and repeat them while the audio is playing. This technique helps improve pronunciation, 
                rhythm, and natural speech patterns. Start with slower sentences and gradually increase difficulty.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{exercise.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {exercise.sentences?.length || 0} sentences
                  </CardDescription>
                </div>
                <Badge 
                  variant={exercise.difficulty_level === 'beginner' ? 'secondary' : 
                          exercise.difficulty_level === 'intermediate' ? 'default' : 'destructive'}
                >
                  {exercise.difficulty_level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Mic className="h-4 w-4" />
                <span>Shadowing Practice</span>
              </div>
              <Button 
                onClick={() => handlePracticeExercise(exercise)}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Practice
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Volume2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Shadowing Exercises Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first shadowing exercise to start practicing pronunciation and fluency.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Exercise
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateShadowingExerciseModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateExercise={handleCreateExercise}
      />

      <ShadowingPracticeModal
        exercise={selectedExercise}
        isOpen={!!selectedExercise}
        onOpenChange={(open) => !open && setSelectedExercise(null)}
      />
    </div>
  );
};
