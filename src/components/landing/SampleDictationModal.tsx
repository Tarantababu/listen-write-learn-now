
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { convertToLanguageCode } from '@/utils/languageConverter';

// Create a stub component for DictationExercise
const DictationExercise = ({ exercise, onComplete, isSample }: any) => {
  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-medium mb-4">{exercise.title}</h3>
      <p className="mb-4">This is a placeholder for the DictationExercise component.</p>
      <p className="mb-4">{exercise.text}</p>
      <div className="flex justify-end">
        <Button onClick={() => onComplete && onComplete()}>Complete</Button>
      </div>
    </div>
  );
};

interface SampleDictationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedded?: boolean;
}

const SampleDictationModal: React.FC<SampleDictationModalProps> = ({
  open,
  onOpenChange,
  embedded = false,
}) => {
  const [exerciseText, setExerciseText] = useState(
    "Welcome to Dictation Practice! This is a sample exercise to help you understand how the app works. Listen to the audio and type what you hear. Don't worry about making mistakes - that's how we learn."
  );
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartExercise = () => {
    setIsLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      setIsStarted(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleSubmit = () => {
    const exercise = {
      id: 'sample-exercise',
      title: 'Sample Exercise',
      text: exerciseText,
      language: convertToLanguageCode('english'),
      userId: 'sample-user',
      directoryId: null,
      tags: ['sample', 'welcome'],
      createdAt: new Date().toISOString(),
      completionCount: 0,
      isCompleted: false
    };

    handleStartExercise();
  };

  const handleReset = () => {
    setIsStarted(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Try Dictation Practice</DialogTitle>
          <DialogDescription>
            Experience how dictation practice works with this sample exercise.
          </DialogDescription>
        </DialogHeader>

        {!isStarted ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="sample-text">Sample Text</Label>
              <Textarea
                id="sample-text"
                value={exerciseText}
                onChange={(e) => setExerciseText(e.target.value)}
                rows={5}
                className="mt-2"
                placeholder="Enter text for the sample exercise"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can customize this text if you'd like to try something different.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Sample Exercise
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <DictationExercise
              exercise={{
                id: 'sample-exercise',
                title: 'Sample Exercise',
                text: exerciseText,
                language: convertToLanguageCode('english'),
                tags: ['sample'],
                userId: 'sample-user',
                directoryId: null,
                createdAt: new Date().toISOString(),
                completionCount: 0,
              }}
              onComplete={() => {}}
              isSample={true}
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={handleReset}>
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SampleDictationModal;

// Also export as named export for backward compatibility
export { SampleDictationModal };
