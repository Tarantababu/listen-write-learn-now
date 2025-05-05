
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog';
import { Exercise } from '@/types';
import DictationPractice from '@/components/DictationPractice';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';

interface PracticeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: Exercise | null;
  onComplete: (accuracy: number) => void;
}

const PracticeModal: React.FC<PracticeModalProps> = ({
  isOpen,
  onOpenChange,
  exercise,
  onComplete
}) => {
  const [showResults, setShowResults] = useState(false);
  const [updatedExercise, setUpdatedExercise] = useState<Exercise | null>(exercise);
  const { settings } = useUserSettingsContext();
  const { exercises } = useExerciseContext();
  
  // Update the local exercise state when the prop changes or when exercises are updated 
  // (could happen after a progress reset)
  useEffect(() => {
    if (exercise) {
      // If there's an exercise, find the latest version from the exercises context
      const latestExerciseData = exercises.find(ex => ex.id === exercise.id);
      setUpdatedExercise(latestExerciseData || exercise);
    } else {
      setUpdatedExercise(null);
    }
  }, [exercise, exercises]);
  
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
  
  // Reset when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Modal just opened
      setShowResults(false);
    }
  }, [isOpen]);
  
  // Safe handling of modal open state change
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Allow animation to complete before fully closing
      onOpenChange(open);
    } else {
      onOpenChange(open);
    }
  };
  
  // If the exercise doesn't match the selected language, don't render
  if (!updatedExercise || updatedExercise.language !== settings.selectedLanguage) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh]">
        <DialogTitle className="sr-only">{updatedExercise.title} Practice</DialogTitle>
        <DictationPractice
          exercise={updatedExercise}
          onComplete={handleComplete}
          showResults={showResults}
          onTryAgain={() => setShowResults(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PracticeModal;
