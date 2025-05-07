import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Exercise } from '@/types';
import DictationPractice from '@/components/DictationPractice';
import ReadingAnalysis from '@/components/ReadingAnalysis';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { AlertTriangle, BookOpen } from 'lucide-react';

interface PracticeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: Exercise | null;
  onComplete: (accuracy: number) => void;
}

enum PracticeStage {
  PROMPT,       // Ask user if they want Reading Analysis
  READING,      // Reading Analysis mode
  DICTATION     // Dictation Practice mode
}

const PracticeModal: React.FC<PracticeModalProps> = ({
  isOpen,
  onOpenChange,
  exercise,
  onComplete
}) => {
  const [showResults, setShowResults] = useState(false);
  const [updatedExercise, setUpdatedExercise] = useState<Exercise | null>(exercise);
  const [practiceStage, setPracticeStage] = useState<PracticeStage>(PracticeStage.PROMPT);
  const [hasExistingAnalysis, setHasExistingAnalysis] = useState<boolean>(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisAllowed, setAnalysisAllowed] = useState<boolean>(true);
  
  const { settings } = useUserSettingsContext();
  const { exercises } = useExerciseContext();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  
  // Update the local exercise state immediately when the prop changes or when exercises are updated 
  useEffect(() => {
    if (exercise) {
      // If there's an exercise, find the latest version from the exercises context
      const latestExerciseData = exercises.find(ex => ex.id === exercise.id);
      setUpdatedExercise(latestExerciseData || exercise);
    } else {
      setUpdatedExercise(null);
    }
  }, [exercise, exercises]);
  
  // Check if the user has an existing reading analysis for this exercise
  useEffect(() => {
    const checkExistingAnalysis = async () => {
      if (!exercise || !user) return;
      
      try {
        // Check if user has an existing reading analysis
        const { data: analysisData, error: analysisError } = await supabase
          .from('reading_analyses')
          .select('id')
          .eq('exercise_id', exercise.id)
          .eq('user_id', user.id)
          .single();
          
        if (analysisError && analysisError.code !== 'PGRST116') {
          console.error('Error checking for analysis:', analysisError);
          return;
        }
        
        if (analysisData) {
          setHasExistingAnalysis(true);
          setAnalysisId(analysisData.id);
          // Skip prompt if user has already done reading analysis
          setPracticeStage(PracticeStage.DICTATION);
        } else {
          setHasExistingAnalysis(false);
          setAnalysisId(null);
          
          // For free users, check if they've reached their limit
          if (!subscription.isSubscribed) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('reading_analyses_count')
              .eq('id', user.id)
              .single();
              
            if (profileError) {
              console.error('Error checking profile:', profileError);
              return;
            }
            
            // Free users are limited to 5 analyses
            if (profileData.reading_analyses_count >= 5) {
              setAnalysisAllowed(false);
              toast.error('Free users are limited to 5 reading analyses. Upgrade to premium for unlimited analyses.');
              // Skip to dictation since they can't generate a reading analysis
              setPracticeStage(PracticeStage.DICTATION);
            } else {
              setPracticeStage(PracticeStage.PROMPT);
            }
          } else {
            // Premium users always start with the prompt
            setPracticeStage(PracticeStage.PROMPT);
          }
        }
      } catch (error) {
        console.error('Error in analysis check:', error);
      }
    };
    
    if (isOpen) {
      checkExistingAnalysis();
    }
  }, [exercise, user, isOpen, subscription.isSubscribed]);
  
  const handleComplete = (accuracy: number) => {
    // Update progress and show results
    onComplete(accuracy);
    setShowResults(true);
    
    // Update local exercise state to reflect progress immediately
    if (updatedExercise && accuracy >= 95) {
      const newCompletionCount = Math.min(3, updatedExercise.completionCount + 1);
      const isCompleted = newCompletionCount >= 3;
      
      setUpdatedExercise({
        ...updatedExercise,
        completionCount: newCompletionCount,
        isCompleted
      });
    }
  };
  
  // Only reset the results display when modal is closed, not when it opens
  useEffect(() => {
    if (!isOpen) {
      // Reset the state when modal is fully closed
      setShowResults(false);
      setPracticeStage(PracticeStage.PROMPT);
    } else if (exercise) {
      // Refresh exercise data when modal opens
      const latestExerciseData = exercises.find(ex => ex.id === exercise.id);
      setUpdatedExercise(latestExerciseData || exercise);
    }
  }, [isOpen, exercise, exercises]);
  
  // Safe handling of modal open state change
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Allow animation to complete before fully closing
      onOpenChange(open);
    } else {
      onOpenChange(open);
    }
  };
  
  const handleStartDictation = () => {
    setPracticeStage(PracticeStage.DICTATION);
  };
  
  const handleStartReadingAnalysis = () => {
    setPracticeStage(PracticeStage.READING);
  };
  
  const handleViewReadingAnalysis = () => {
    // If we're already in dictation mode, we need to switch to reading analysis
    if (practiceStage === PracticeStage.DICTATION) {
      setPracticeStage(PracticeStage.READING);
    }
  };
  
  // If the exercise doesn't match the selected language, don't render
  if (!updatedExercise || updatedExercise.language !== settings.selectedLanguage) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh]">
        <DialogTitle className="sr-only">{updatedExercise.title} Practice</DialogTitle>
        
        {practiceStage === PracticeStage.PROMPT && (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">Practice: {updatedExercise.title}</h2>
            <DialogDescription>
              Would you like to start with a Reading Analysis before your dictation practice?
              {hasExistingAnalysis && (
                <div className="mt-2 text-sm">
                  You have already completed a reading analysis for this exercise.
                </div>
              )}
            </DialogDescription>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <Button 
                onClick={handleStartReadingAnalysis} 
                className="h-auto py-6 px-4"
                disabled={!analysisAllowed}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <BookOpen className="h-6 w-6 mb-2" />
                  <div className="font-semibold text-base">{hasExistingAnalysis ? 'View Reading Analysis' : 'Yes, show Reading Analysis'}</div>
                  <p className="text-sm opacity-80">
                    Understand words, grammar, and sentence structures before practicing.
                  </p>
                </div>
              </Button>
              
              <Button 
                onClick={handleStartDictation} 
                variant="outline"
                className="h-auto py-6 px-4"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="font-semibold text-base">Skip to Dictation</div>
                  <p className="text-sm opacity-80">
                    Jump straight into typing what you hear in the audio.
                  </p>
                </div>
              </Button>
            </div>
            
            {!analysisAllowed && !subscription.isSubscribed && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md flex items-start mt-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Free user limit reached</p>
                  <p className="text-sm mt-1">
                    You've reached the limit of 5 reading analyses for free users. 
                    Upgrade to premium for unlimited analyses.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {practiceStage === PracticeStage.READING && (
          <ReadingAnalysis 
            exercise={updatedExercise} 
            onComplete={handleStartDictation}
            existingAnalysisId={analysisId || undefined}
          />
        )}
        
        {practiceStage === PracticeStage.DICTATION && (
          <DictationPractice
            exercise={updatedExercise}
            onComplete={handleComplete}
            showResults={showResults}
            onTryAgain={() => setShowResults(false)}
            hasReadingAnalysis={hasExistingAnalysis}
            onViewReadingAnalysis={hasExistingAnalysis ? handleViewReadingAnalysis : undefined}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PracticeModal;
