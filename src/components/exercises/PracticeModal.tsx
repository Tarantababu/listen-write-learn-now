
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog';
import { Exercise } from '@/types';
import DictationPractice from '@/components/DictationPractice';
import VocabularyHighlighter from '@/components/VocabularyHighlighter';

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
  
  if (!exercise) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DictationPractice
          exercise={exercise}
          onComplete={handleComplete}
        />
        {showResults && (
          <VocabularyHighlighter exercise={exercise} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PracticeModal;
