
import React, { useState, useEffect } from 'react';
import { Exercise } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DictationPractice from '@/components/DictationPractice';
import LearningOptionsMenu from '@/components/exercises/LearningOptionsMenu';

interface PracticeModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (accuracy: number) => void;
  audioProgress?: {
    isGenerating: boolean;
    progress: number;
    estimatedTimeRemaining: number;
    stage: 'initializing' | 'processing' | 'uploading' | 'finalizing' | 'complete';
    startProgress: () => void;
    completeProgress: () => void;
    resetProgress: () => void;
  };
}

const PracticeModal: React.FC<PracticeModalProps> = ({
  exercise,
  isOpen,
  onOpenChange,
  onComplete,
  audioProgress
}) => {
  const [showLearningOptions, setShowLearningOptions] = useState(true);
  const [practiceMode, setPracticeMode] = useState<'dictation' | 'reading' | null>(null);

  // Reset state when modal opens/closes or exercise changes
  useEffect(() => {
    if (isOpen && exercise) {
      setShowLearningOptions(true);
      setPracticeMode(null);
    }
  }, [isOpen, exercise]);

  const handleStartDictation = () => {
    setShowLearningOptions(false);
    setPracticeMode('dictation');
  };

  const handleStartReadingAnalysis = () => {
    setShowLearningOptions(false);
    setPracticeMode('reading');
    // For now, we'll use dictation mode as placeholder
    // In a real implementation, this would start reading analysis
    setPracticeMode('dictation');
  };

  const handleBackToMenu = () => {
    setShowLearningOptions(true);
    setPracticeMode(null);
  };

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Practice Exercise</DialogTitle>
          <DialogDescription>
            Practice your language skills with this exercise
          </DialogDescription>
        </DialogHeader>
        
        {showLearningOptions ? (
          <LearningOptionsMenu
            onStartReadingAnalysis={handleStartReadingAnalysis}
            onStartDictation={handleStartDictation}
            exerciseTitle={exercise.title}
            audioProgress={audioProgress}
          />
        ) : (
          <div className="p-6">
            <DictationPractice
              exercise={exercise}
              onComplete={onComplete}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PracticeModal;
