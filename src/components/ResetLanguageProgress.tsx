
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { Language } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { deleteAssociatedCompletions } from '@/services/exerciseService';
import { useLocalExercises } from '@/hooks/useLocalExercises';

interface ResetLanguageProgressProps {
  className?: string;
}

const ResetLanguageProgress: React.FC<ResetLanguageProgressProps> = ({ 
  className 
}) => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const { exercises, markProgress } = useExerciseContext();
  const localExercises = useLocalExercises();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetProgress = async () => {
    try {
      setIsResetting(true);
      
      if (!user) {
        // Handle local storage reset for non-authenticated users
        const currentLanguage = settings.selectedLanguage;
        
        // Use the new resetLanguageProgress method for non-authenticated users
        localExercises.resetLanguageProgress(currentLanguage);
        
        // Also update the exercises in the context for immediate UI update
        const languageExercises = exercises.filter(ex => ex.language === currentLanguage);
        for (const exercise of languageExercises) {
          await markProgress(exercise.id, 0, true);
        }
        
        toast.success(`Progress for ${settings.selectedLanguage} has been reset successfully`);
      } else {
        // Reset authenticated user's progress in the database
        const currentLanguage = settings.selectedLanguage;
        
        // Get all exercise IDs for the current language to properly remove completions
        const userId = user.id;
        const { data: languageExercises, error: fetchError } = await supabase
          .from('exercises')
          .select('id')
          .eq('user_id', userId as unknown as DbId)
          .eq('language', currentLanguage as unknown as string);
          
        if (fetchError) throw fetchError;
        
        if (languageExercises && languageExercises.length > 0) {
          const exerciseIds = languageExercises.map(ex => ex.id);
          
          // Reset exercise completion counts for the selected language
          const { error: exerciseError } = await supabase
            .from('exercises')
            .update({ 
              completion_count: 0, 
              is_completed: false 
            } as any)
            .eq('user_id', userId as unknown as DbId)
            .eq('language', currentLanguage as unknown as string);
            
          if (exerciseError) throw exerciseError;
          
          // Delete all completions for these exercises
          for (const exerciseId of exerciseIds) {
            await deleteAssociatedCompletions(userId, exerciseId);
          }
          
          // Refresh the exercises in context after reset
          for (const exercise of exercises.filter(ex => ex.language === currentLanguage)) {
            await markProgress(exercise.id, 0, true);
          }
        }
        
        toast.success(`Progress for ${settings.selectedLanguage} has been reset successfully`);
      }
      
      // Close the dialog
      setIsResetDialogOpen(false);
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast.error('Failed to reset progress. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className={className}>
      <Button 
        variant="outline" 
        size="sm"
        className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
        onClick={() => setIsResetDialogOpen(true)}
      >
        <RefreshCcw className="h-4 w-4 mr-2" />
        Reset Progress for {settings.selectedLanguage}
      </Button>
      
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Language Progress</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset all your progress for <strong className="capitalize">{settings.selectedLanguage}</strong>?
              <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded-md text-sm">
                This will:
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Reset all exercise completion statuses</li>
                  <li>Remove all completion records</li>
                  <li>Cannot be undone</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleResetProgress();
              }}
              disabled={isResetting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isResetting ? 'Resetting...' : 'Reset Progress'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResetLanguageProgress;
