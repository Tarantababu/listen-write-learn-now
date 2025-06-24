
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ShadowingExerciseCard from './ShadowingExerciseCard';
import ShadowingPracticeModal from './ShadowingPracticeModal';
import ShadowingCreateModal from './ShadowingCreateModal';

interface ShadowingExercise {
  id: string;
  title: string;
  difficulty_level: string;
  language: string;
  source_type: string;
  custom_text?: string;
  sentences: Array<{
    text: string;
    audio_url?: string;
  }>;
  archived: boolean;
  created_at: string;
  user_id: string;
}

export const ShadowingExercisesSection: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [exercises, setExercises] = useState<ShadowingExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [practiceExercise, setPracticeExercise] = useState<ShadowingExercise | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchExercises = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shadowing_exercises')
        .select('*')
        .eq('user_id', user.id)
        .eq('language', settings.selectedLanguage)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(exercise => ({
        ...exercise,
        sentences: Array.isArray(exercise.sentences) 
          ? exercise.sentences 
          : typeof exercise.sentences === 'string' 
            ? JSON.parse(exercise.sentences) 
            : []
      }));
      
      setExercises(transformedData);
    } catch (error) {
      console.error('Error fetching shadowing exercises:', error);
      toast.error('Failed to load shadowing exercises');
    } finally {
      setLoading(false);
    }
  }, [user, settings.selectedLanguage]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const handlePractice = useCallback((exercise: ShadowingExercise) => {
    setPracticeExercise(exercise);
  }, []);

  const handleEdit = useCallback((exercise: ShadowingExercise) => {
    // TODO: Implement edit functionality
    toast.info('Edit functionality coming soon');
  }, []);

  const handleDelete = useCallback(async (exercise: ShadowingExercise) => {
    try {
      const { error } = await supabase
        .from('shadowing_exercises')
        .update({ archived: true })
        .eq('id', exercise.id);

      if (error) throw error;
      
      toast.success('Exercise archived successfully');
      fetchExercises();
    } catch (error) {
      console.error('Error archiving exercise:', error);
      toast.error('Failed to archive exercise');
    }
  }, [fetchExercises]);

  const handleCreateSuccess = useCallback(() => {
    setIsCreateModalOpen(false);
    fetchExercises();
  }, [fetchExercises]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Exercise Card */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col justify-center items-center min-h-[200px]"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg mb-2">Create Shadowing Exercise</CardTitle>
            <CardDescription>
              Create a new shadowing exercise from custom text or reading exercises
            </CardDescription>
          </CardContent>
        </Card>

        {/* Exercise Cards */}
        {exercises.map((exercise) => (
          <ShadowingExerciseCard
            key={exercise.id}
            exercise={exercise}
            onPractice={handlePractice}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={true}
          />
        ))}
      </div>

      {exercises.length === 0 && !loading && (
        <div className="text-center py-12">
          <Volume2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No shadowing exercises yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first shadowing exercise to start practicing pronunciation and fluency
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Exercise
          </Button>
        </div>
      )}

      {/* Modals */}
      <ShadowingPracticeModal
        exercise={practiceExercise}
        isOpen={!!practiceExercise}
        onOpenChange={(open) => !open && setPracticeExercise(null)}
      />

      <ShadowingCreateModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};
