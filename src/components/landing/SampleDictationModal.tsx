import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import DictationPractice from '@/components/DictationPractice';
import { Exercise } from '@/types';

interface SampleDictationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SampleDictationModal({ open, onOpenChange }: SampleDictationModalProps) {
  const [completed, setCompleted] = useState(false);
  
  // Sample exercise data
  const sampleExercise: Exercise = {
    id: 'sample-exercise',
    title: 'Sample Dictation Exercise',
    text: 'Welcome to our dictation practice app. This is a sample exercise where you can listen to an audio clip and type what you hear. After submitting, you will see how accurate you were.',
    audioUrl: 'https://ik.imagekit.io/lrigu76hy/dictation-sample-audio.mp3',
    language: 'english',
    tags: ['sample', 'beginner'],
    completionCount: 0,
    isCompleted: false,
    createdAt: new Date(),
    directoryId: null
  };

  const handleComplete = (accuracy: number) => {
    setCompleted(true);
  };

  const handleTryAgain = () => {
    setCompleted(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Try Dictation Practice</DialogTitle>
          <DialogDescription>
            Listen to the audio and type what you hear. Submit to see your accuracy.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          <DictationPractice 
            exercise={sampleExercise} 
            onComplete={handleComplete} 
            showResults={completed}
            onTryAgain={handleTryAgain}
          />
        </div>
        
        <div className="mt-4 flex justify-between items-center p-3 border-t">
          <div className="text-sm text-muted-foreground">
            {completed ? (
              <span>Like what you see? Sign up for full access.</span>
            ) : (
              <span>Press <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Shift</span> + <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Space</span> to play/pause</span>
            )}
          </div>
          
          {completed && (
            <Button asChild>
              <a href="/signup">Sign Up Now</a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
