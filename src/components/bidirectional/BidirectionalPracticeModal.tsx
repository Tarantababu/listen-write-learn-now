
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowRight, CheckCircle } from 'lucide-react';
import type { BidirectionalExercise } from '@/types/bidirectional';
import { BidirectionalService } from '@/services/bidirectionalService';
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
  const [step, setStep] = useState<'forward' | 'backward' | 'reflection'>('forward');
  const [forwardTranslation, setForwardTranslation] = useState('');
  const [backwardTranslation, setBackwardTranslation] = useState('');
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (exercise) {
      setForwardTranslation(exercise.user_forward_translation || '');
      setBackwardTranslation(exercise.user_back_translation || '');
      setReflectionNotes(exercise.reflection_notes || '');
      setStep('forward');
    }
  }, [exercise]);

  const handleNext = () => {
    if (step === 'forward') {
      setStep('backward');
    } else if (step === 'backward') {
      setStep('reflection');
    }
  };

  const handleFinish = async () => {
    if (!exercise) return;

    setIsLoading(true);
    try {
      await BidirectionalService.updateExerciseTranslations(exercise.id, {
        user_forward_translation: forwardTranslation,
        user_back_translation: backwardTranslation,
        reflection_notes: reflectionNotes
      });

      // Promote to reviewing status
      await BidirectionalService.promoteToReviewing(exercise.id);

      toast({
        title: "Practice Complete",
        description: "Exercise saved and promoted to reviewing phase."
      });

      onExerciseUpdated();
      onClose();
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

  const playAudio = (audioUrl?: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Practice: {exercise.original_sentence}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'forward' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Forward Translation
                </CardTitle>
                <CardDescription>
                  Translate from {exercise.target_language} to {exercise.support_language}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium">{exercise.original_sentence}</p>
                    {exercise.original_audio_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => playAudio(exercise.original_audio_url)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Original sentence</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your translation:
                  </label>
                  <Textarea
                    value={forwardTranslation}
                    onChange={(e) => setForwardTranslation(e.target.value)}
                    placeholder="Enter your translation here..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!forwardTranslation.trim()}
                  className="w-full"
                >
                  Continue to Backward Translation
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'backward' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 rotate-180" />
                  Backward Translation
                </CardTitle>
                <CardDescription>
                  Translate back from {exercise.support_language} to {exercise.target_language}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium mb-1">{forwardTranslation}</p>
                  <p className="text-sm text-muted-foreground">Your forward translation</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Translate back to {exercise.target_language}:
                  </label>
                  <Textarea
                    value={backwardTranslation}
                    onChange={(e) => setBackwardTranslation(e.target.value)}
                    placeholder="Translate back to the original language..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep('forward')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!backwardTranslation.trim()}
                    className="flex-1"
                  >
                    Continue to Reflection
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'reflection' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Reflection & Notes
                </CardTitle>
                <CardDescription>
                  Compare your translations and add notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Original:</p>
                    <p>{exercise.original_sentence}</p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm font-medium mb-1">Your Forward Translation:</p>
                    <p>{forwardTranslation}</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm font-medium mb-1">Your Backward Translation:</p>
                    <p>{backwardTranslation}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reflection Notes (Optional):
                  </label>
                  <Textarea
                    value={reflectionNotes}
                    onChange={(e) => setReflectionNotes(e.target.value)}
                    placeholder="What did you learn? Any difficult words or patterns?"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep('backward')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Saving...' : 'Complete Practice'}
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
