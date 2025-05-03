
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog';
import { Exercise } from '@/types';
import DictationPractice from '@/components/DictationPractice';
import VocabularyHighlighter from '@/components/VocabularyHighlighter';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

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
  const { settings } = useUserSettingsContext();
  
  const handleComplete = (accuracy: number) => {
    onComplete(accuracy);
    setShowResults(true);
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
  if (!exercise || exercise.language !== settings.selectedLanguage) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh]">
        <DialogTitle className="sr-only">{exercise.title} Practice</DialogTitle>
        <DictationPractice
          exercise={exercise}
          onComplete={handleComplete}
          showResults={showResults}
          onTryAgain={() => setShowResults(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PracticeModal;
