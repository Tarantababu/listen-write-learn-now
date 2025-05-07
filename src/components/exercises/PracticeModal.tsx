import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
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
import { AlertTriangle, BookOpen, Search, Headphones } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useModalState } from '@/hooks/useModalState';

interface PracticeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: Exercise | null;
  onComplete: (accuracy: number) => void;
}

enum PracticeStage {
  PROMPT,  // Ask user if they want Reading Analysis
  READING, // Reading Analysis mode
  DICTATION // Dictation Practice mode
}

const PracticeModal: React.FC<PracticeModalProps> = ({
  isOpen,
  onOpenChange,
  exercise,
  onComplete
}) => {
  // Use the persistent modal state hook with the parent-provided isOpen value
  const [isPracticeModalOpen, setPracticeModalOpen, handlePracticeModalOpenChange] = 
    useModalState(`practice-modal-${exercise?.id || 'default'}`, isOpen);

  // Sync the parent state with our URL-based state (bidirectional)
  useEffect(() => {
    if (isOpen !== isPracticeModalOpen) {
      setPracticeModalOpen(isOpen);
    }
  }, [isOpen, isPracticeModalOpen, setPracticeModalOpen]);

  useEffect(() => {
    // Update parent when our modal state changes
    if (onOpenChange && isPracticeModalOpen !== isOpen) {
      onOpenChange(isPracticeModalOpen);
    }
  }, [isPracticeModalOpen, isOpen, onOpenChange]);

  // Keep existing stage in URL to persist it
  const [practiceStageParam, setPracticeStageParam] = useModalState(
    `practice-stage-${exercise?.id || 'default'}`,
    false
  );
  
  // Derive practice stage from URL parameter
  const [practiceStage, setPracticeStage] = useState<PracticeStage>(() => {
    if (practiceStageParam) {
      const stageValue = new URLSearchParams(window.location.search).get(`practice-stage-${exercise?.id || 'default'}`);
      if (stageValue === 'reading') return PracticeStage.READING;
      if (stageValue === 'dictation') return PracticeStage.DICTATION;
    }
    return PracticeStage.PROMPT;
  });

  // Update URL when stage changes
  useEffect(() => {
    let paramValue = '';
    if (practiceStage === PracticeStage.READING) paramValue = 'reading';
    else if (practiceStage === PracticeStage.DICTATION) paramValue = 'dictation';
    else paramValue = 'prompt';
    
    setPracticeStageParam(!!paramValue);
    
    if (paramValue) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set(`practice-stage-${exercise?.id || 'default'}`, paramValue);
      const newRelativePathQuery = `${window.location.pathname}?${searchParams.toString()}`;
      history.replaceState(null, '', newRelativePathQuery);
    }
  }, [practiceStage, exercise?.id, setPracticeStageParam]);
  
  const [showResults, setShowResults] = useState(false);
  const [updatedExercise, setUpdatedExercise] = useState<Exercise | null>(exercise);
  const [hasExistingAnalysis, setHasExistingAnalysis] = useState<boolean>(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisAllowed, setAnalysisAllowed] = useState<boolean>(true);
  
  const {
    settings
  } = useUserSettingsContext();
  const {
    exercises
  } = useExerciseContext();
  const {
    user
  } = useAuth();
  const {
    subscription
  } = useSubscription();

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
        const {
          data: analysisData,
          error: analysisError
        } = await supabase.from('reading_analyses').select('id').eq('exercise_id', exercise.id).eq('user_id', user.id).single();
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
            const {
              data: profileData,
              error: profileError
            } = await supabase.from('profiles').select('reading_analyses_count').eq('id', user.id).single();
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
    if (isPracticeModalOpen) {
      checkExistingAnalysis();
    }
  }, [exercise, user, isPracticeModalOpen, subscription.isSubscribed]);
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
    if (!isPracticeModalOpen) {
      // Reset the state when modal is fully closed
      setShowResults(false);
      // Note: We don't reset practiceStage here since we want to persist it
    } else if (exercise) {
      // Refresh exercise data when modal opens
      const latestExerciseData = exercises.find(ex => ex.id === exercise.id);
      setUpdatedExercise(latestExerciseData || exercise);
    }
  }, [isPracticeModalOpen, exercise, exercises]);

  // Safe handling of modal open state change
  const handleOpenChange = (open: boolean) => {
    handlePracticeModalOpenChange(open);
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
  
  return <Dialog open={isPracticeModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh]">
        <DialogTitle className="sr-only">{updatedExercise.title} Practice</DialogTitle>
        
        {practiceStage === PracticeStage.PROMPT && <div className="px-6 py-8 space-y-6">
            <DialogHeader className="mb-4">
              <h2 className="text-2xl font-bold mb-2">{updatedExercise.title}</h2>
              <DialogDescription className="text-base">
                <p className="text-lg font-medium mb-2">Boost Your Understanding Before You Start</p>
                <p>Dive into a Reading Analysis to see how words and grammar work — or skip straight to dictation.</p>
                {hasExistingAnalysis && <div className="mt-2 text-sm font-medium text-primary">
                    You have already completed a reading analysis for this exercise.
                  </div>}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card className={`overflow-hidden ${hasExistingAnalysis ? 'border-primary/30 bg-primary/5' : 'border-muted'} transition-colors`}>
                <CardContent className="p-0">
                  <Button onClick={handleStartReadingAnalysis} variant="ghost" disabled={!analysisAllowed} className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="flex items-center justify-center bg-primary/10 w-12 h-12 rounded-full">
                        <Search className="h-6 w-6 text-primary" />
                      </div>
                      <div className="font-semibold text-lg">
                        {hasExistingAnalysis ? 'View Reading Analysis' : '🔍 Start with Reading Analysis'}
                      </div>
                      
                    </div>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border border-muted hover:bg-muted/5 transition-all">
                <CardContent className="p-0">
                  <Button onClick={handleStartDictation} variant="ghost" className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="flex items-center justify-center bg-muted/40 w-12 h-12 rounded-full">
                        <Headphones className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="font-semibold text-lg">🎧 Start Dictation Now</div>
                      
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {!analysisAllowed && !subscription.isSubscribed && <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md flex items-start mt-6">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Free user limit reached</p>
                  <p className="text-sm mt-1">
                    You've reached the limit of 5 reading analyses for free users. 
                    Upgrade to premium for unlimited analyses.
                  </p>
                </div>
              </div>}
          </div>}
        
        {practiceStage === PracticeStage.READING && <ReadingAnalysis exercise={updatedExercise} onComplete={handleStartDictation} existingAnalysisId={analysisId || undefined} />}
        
        {practiceStage === PracticeStage.DICTATION && <DictationPractice exercise={updatedExercise} onComplete={handleComplete} showResults={showResults} onTryAgain={() => setShowResults(false)} hasReadingAnalysis={hasExistingAnalysis} onViewReadingAnalysis={hasExistingAnalysis ? handleViewReadingAnalysis : undefined} />}
      </DialogContent>
    </Dialog>;
};
export default PracticeModal;
