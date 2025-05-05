
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
  
  // Update the local exercise state immediately when the prop changes or when exercises are updated 
  // (happens after a progress reset or any other completion event)
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
      // When modal just opened, reset the results display
      setShowResults(false);
      
      // Refresh exercise data in case it was updated (e.g., after reset)
      if (exercise) {
        const latestExerciseData = exercises.find(ex => ex.id === exercise.id);
        setUpdatedExercise(latestExerciseData || exercise);
      }
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
