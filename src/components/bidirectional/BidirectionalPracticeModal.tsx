
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowRight, CheckCircle } from 'lucide-react';
import { BidirectionalService } from '@/services/bidirectionalService';
import type { BidirectionalExercise } from '@/types/bidirectional';
import { useToast } from '@/hooks/use-toast';

interface BidirectionalPracticeModalProps {
  exercise: BidirectionalExercise | null;
  isOpen: boolean;
  onClose: () => void;
  onExerciseUpdated: () => void;
}

export const BidirectionalPracticeModal: React.FC<BidirectionalPracticeModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onExerciseUpdated
}) => {
  const { toast } = useToast();
  const [userTranslation, setUserTranslation] = useState('');
  const [userBackTranslation, setUserBackTranslation] = useState('');
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [currentStep, setCurrentStep] = useState<'forward' | 'backward' | 'reflection' | 'complete'>('forward');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (exercise && isOpen) {
      setUserTranslation(exercise.user_forward_translation || '');
      setUserBackTranslation(exercise.user_back_translation || '');
      setReflectionNotes(exercise.reflection_notes || '');
      setCurrentStep('forward');
    }
  }, [exercise, isOpen]);

  const handlePlayAudio = () => {
    if (exercise?.original_audio_url) {
      const audio = new Audio(exercise.original_audio_url);
      audio.play().catch(console.error);
    }
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case 'forward':
        setCurrentStep('backward');
        break;
      case 'backward':
        setCurrentStep('reflection');
        break;
      case 'reflection':
        setCurrentStep('complete');
        break;
    }
  };

  const handleSaveAndContinue = async () => {
    if (!exercise) return;

    setIsLoading(true);
    try {
      await BidirectionalService.updateExerciseTranslations(exercise.id, {
        user_forward_translation: userTranslation,
        user_back_translation: userBackTranslation,
        reflection_notes: reflectionNotes
      });

      if (currentStep === 'complete') {
        await BidirectionalService.promoteToReviewing(exercise.id);
        toast({
          title: "Success",
          description: "Exercise completed! It's now ready for review."
        });
        onExerciseUpdated();
        onClose();
      } else {
        handleNextStep();
      }
    } catch (error) {
      console.error('Error saving practice:', error);
      toast({
        title: "Error",
        description: "Failed to save practice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Practice: {exercise.original_sentence}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Sentence */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Original Sentence
                {exercise.original_audio_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePlayAudio}
                    className="flex items-center gap-1"
                  >
                    <Play className="h-3 w-3" />
                    Play
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{exercise.original_sentence}</p>
              {exercise.normal_translation && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Expected Translation:</p>
                  <p>{exercise.normal_translation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Forward Translation Step */}
          {currentStep === 'forward' && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Forward Translation</CardTitle>
                <p className="text-muted-foreground">
                  Translate the sentence from {exercise.target_language} to {exercise.support_language}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={userTranslation}
                  onChange={(e) => setUserTranslation(e.target.value)}
                  placeholder="Enter your translation..."
                  rows={3}
                />
                <Button 
                  onClick={handleSaveAndContinue}
                  disabled={!userTranslation.trim() || isLoading}
                  className="w-full flex items-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Continue to Back Translation
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Backward Translation Step */}
          {currentStep === 'backward' && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Back Translation</CardTitle>
                <p className="text-muted-foreground">
                  Now translate your translation back to {exercise.target_language}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Your forward translation:</p>
                  <p>{userTranslation}</p>
                </div>
                <Textarea
                  value={userBackTranslation}
                  onChange={(e) => setUserBackTranslation(e.target.value)}
                  placeholder="Translate back to the original language..."
                  rows={3}
                />
                <Button 
                  onClick={handleSaveAndContinue}
                  disabled={!userBackTranslation.trim() || isLoading}
                  className="w-full flex items-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Continue to Reflection
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Reflection Step */}
          {currentStep === 'reflection' && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Reflection</CardTitle>
                <p className="text-muted-foreground">
                  Compare your translations and note any differences or insights
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Original:</p>
                    <p className="font-medium">{exercise.original_sentence}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Your back translation:</p>
                    <p className="font-medium">{userBackTranslation}</p>
                  </div>
                </div>
                <Textarea
                  value={reflectionNotes}
                  onChange={(e) => setReflectionNotes(e.target.value)}
                  placeholder="What differences do you notice? What did you learn?"
                  rows={4}
                />
                <Button 
                  onClick={handleSaveAndContinue}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete Practice
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Practice Complete!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Great job! This exercise is now ready for spaced repetition review.
                  You'll be prompted to review it using the schedule: 1 → 3 → 7 days.
                </p>
                <Button 
                  onClick={() => onClose()}
                  className="w-full"
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
