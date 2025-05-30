import React, { useState, useEffect, useRef } from 'react';
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
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, BookOpen, Search, Headphones } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface PracticeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: Exercise | null;
  onComplete: (accuracy: number) => void;
}

enum PracticeStage {
  PROMPT,
  READING,
  DICTATION,
}

const PracticeModal: React.FC<PracticeModalProps> = ({
  isOpen,
  onOpenChange,
  exercise,
  onComplete,
}) => {
  const [showResults, setShowResults] = useState(false);
  const [updatedExercise, setUpdatedExercise] = useState<Exercise | null>(exercise);
  const [practiceStage, setPracticeStage] = useState<PracticeStage>(PracticeStage.PROMPT);
  const [hasExistingAnalysis, setHasExistingAnalysis] = useState<boolean>(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisAllowed, setAnalysisAllowed] = useState<boolean>(true);
  const [loadingAnalysisCheck, setLoadingAnalysisCheck] = useState<boolean>(false);
  const hasInitializedRef = useRef<boolean>(false);
  const isMobile = useIsMobile();

  const { settings } = useUserSettingsContext();
  const { exercises, hasReadingAnalysis } = useExerciseContext();
  const { user } = useAuth();
  const { subscription } = useSubscription();

  useEffect(() => {
    if (exercise) {
      const latestExerciseData = exercises.find((ex) => ex.id === exercise.id);
      setUpdatedExercise(latestExerciseData || exercise);
    } else {
      setUpdatedExercise(null);
    }
  }, [exercise, exercises]);

  useEffect(() => {
    const checkExistingAnalysis = async () => {
      if (!exercise || !user || !isOpen) return;
      try {
        setLoadingAnalysisCheck(true);
        const hasAnalysis = await hasReadingAnalysis(exercise.id);
        if (hasAnalysis) {
          setHasExistingAnalysis(true);
          const { data: analysisData } = await supabase
            .from('reading_analyses')
            .select('id')
            .eq('exercise_id', exercise.id)
            .eq('user_id', user.id)
            .maybeSingle();
          if (analysisData) {
            setAnalysisId(analysisData.id);
          }
          setPracticeStage(PracticeStage.DICTATION);
        } else {
          setHasExistingAnalysis(false);
          setAnalysisId(null);
          if (!subscription.isSubscribed) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('reading_analyses_count')
              .eq('id', user.id)
              .maybeSingle();
            if (profileData && profileData.reading_analyses_count >= 5) {
              setAnalysisAllowed(false);
              toast({
                title: 'Free user limit reached',
                description: 'Free users are limited to 5 reading analyses. Upgrade to premium for unlimited analyses.',
                variant: 'destructive',
              });
            }
          }
          setPracticeStage(PracticeStage.PROMPT);
        }
      } finally {
        setLoadingAnalysisCheck(false);
      }
    };

    if (isOpen && !hasInitializedRef.current) {
      checkExistingAnalysis();
      hasInitializedRef.current = true;
    }
    if (!isOpen) {
      hasInitializedRef.current = false;
    }
  }, [exercise, user, isOpen, subscription.isSubscribed, hasReadingAnalysis]);

  const handleComplete = (accuracy: number) => {
    onComplete(accuracy);
    setShowResults(true);
    if (updatedExercise && accuracy >= 95) {
      const newCompletionCount = Math.min(3, updatedExercise.completionCount + 1);
      const isCompleted = newCompletionCount >= 3;
      setUpdatedExercise({
        ...updatedExercise,
        completionCount: newCompletionCount,
        isCompleted,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      const latestExerciseData = exercises.find((ex) => ex?.id === exercise?.id);
      setUpdatedExercise(latestExerciseData || exercise);
    } else {
      setShowResults(false);
    }
  }, [isOpen, exercise, exercises]);

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  const handleStartDictation = () => {
    setPracticeStage(PracticeStage.DICTATION);
  };

  const handleStartReadingAnalysis = () => {
    setPracticeStage(PracticeStage.READING);
  };

  const handleViewReadingAnalysis = () => {
    if (practiceStage === PracticeStage.DICTATION) {
      setPracticeStage(PracticeStage.READING);
    }
  };

  const handleTryAgain = () => {
    setShowResults(false);
  };

  if (!updatedExercise || updatedExercise.language !== settings.selectedLanguage) return null;

  useEffect(() => {
    if (isMobile) {
      const handleFocus = () => {
        document.body.classList.add('mobile-keyboard-open');
      };
      const handleBlur = () => {
        document.body.classList.remove('mobile-keyboard-open');
      };

      const inputs = document.querySelectorAll('textarea, input');
      inputs.forEach((el) => {
        el.addEventListener('focus', handleFocus);
        el.addEventListener('blur', handleBlur);
      });

      return () => {
        inputs.forEach((el) => {
          el.removeEventListener('focus', handleFocus);
          el.removeEventListener('blur', handleBlur);
        });
      };
    }
  }, [isMobile]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`
          ${isMobile
            ? 'w-[100vw] h-[100vh] max-w-none max-h-none rounded-none m-0 p-0 border-0 overflow-y-auto'
            : 'max-w-4xl max-h-[90vh]'}
          flex flex-col
        `}
      >
        <DialogTitle className="sr-only">{updatedExercise.title} Practice</DialogTitle>
        {practiceStage === PracticeStage.PROMPT && (
          <div
            className={`${isMobile ? 'px-4 py-4' : 'px-6 py-8'} space-y-4 md:space-y-6 flex-1 overflow-y-auto`}
          >
            {/* Prompt Content */}
            <DialogHeader className="mb-2 md:mb-4">
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-1 md:mb-2`}>
                {updatedExercise.title}
              </h2>
              <DialogDescription className="text-sm md:text-base">
                <p className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mb-1 md:mb-2`}>
                  Boost Your Understanding Before You Start
                </p>
                <p className={`${isMobile ? 'text-sm' : 'text-base'}`}>
                  Dive into a Reading Analysis to see how words and grammar work — or skip straight to dictation.
                </p>
                {loadingAnalysisCheck && (
                  <div className="mt-2 text-sm font-medium">
                    Checking for existing analysis...
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            {/* ...rest of the prompt UI... */}
          </div>
        )}

        {practiceStage === PracticeStage.READING && (
          <ReadingAnalysis
            exercise={updatedExercise}
            analysisId={analysisId}
            onDictationStart={handleStartDictation}
          />
        )}

        {practiceStage === PracticeStage.DICTATION && (
          <DictationPractice
            exercise={updatedExercise}
            showResults={showResults}
            onComplete={handleComplete}
            onTryAgain={handleTryAgain}
            onViewReadingAnalysis={handleViewReadingAnalysis}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PracticeModal;