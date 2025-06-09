
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { BidirectionalService } from '@/services/bidirectionalService';
import type { BidirectionalExercise } from '@/types/bidirectional';
import { useToast } from '@/hooks/use-toast';
import { compareTexts } from '@/utils/textComparison';
import AudioPlayer from '@/components/AudioPlayer';

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
  const [currentStep, setCurrentStep] = useState<'forward' | 'backward' | 'complete'>('forward');
  const [isLoading, setIsLoading] = useState(false);
  const [translationAccuracy, setTranslationAccuracy] = useState<number | null>(null);

  React.useEffect(() => {
    if (exercise && isOpen) {
      setUserTranslation(exercise.user_forward_translation || '');
      setUserBackTranslation(exercise.user_back_translation || '');
      setCurrentStep('forward');
      setTranslationAccuracy(null);
    }
  }, [exercise, isOpen]);

  const handleNextStep = () => {
    switch (currentStep) {
      case 'forward':
        // Check translation accuracy before proceeding
        if (exercise?.normal_translation) {
          const comparison = compareTexts(exercise.normal_translation, userTranslation);
          setTranslationAccuracy(comparison.accuracy);
          
          if (comparison.accuracy < 95) {
            toast({
              title: "Translation Accuracy Too Low",
              description: `Your translation accuracy is ${comparison.accuracy}%. You need at least 95% accuracy to proceed.`,
              variant: "destructive"
            });
            return;
          }
        }
        setCurrentStep('backward');
        break;
      case 'backward':
        setCurrentStep('complete');
        break;
    }
  };

  const handleSaveAndContinue = async () => {
    if (!exercise) return;

    // For forward step, validate accuracy first
    if (currentStep === 'forward' && exercise.normal_translation) {
      const comparison = compareTexts(exercise.normal_translation, userTranslation);
      setTranslationAccuracy(comparison.accuracy);
      
      if (comparison.accuracy < 95) {
        toast({
          title: "Translation Accuracy Too Low",
          description: `Your translation accuracy is ${comparison.accuracy}%. You need at least 95% accuracy to proceed.`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      await BidirectionalService.updateExerciseTranslations(exercise.id, {
        user_forward_translation: userTranslation,
        user_back_translation: userBackTranslation
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
              <CardTitle className="text-lg">
                Original Sentence ({exercise.target_language})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg font-medium">{exercise.original_sentence}</p>
              {exercise.original_audio_url && (
                <div className="flex justify-center">
                  <AudioPlayer audioUrl={exercise.original_audio_url} />
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
                  onChange={(e) => {
                    setUserTranslation(e.target.value);
                    setTranslationAccuracy(null); // Reset accuracy when user types
                  }}
                  placeholder="Enter your translation..."
                  rows={3}
                />
                
                {translationAccuracy !== null && (
                  <div className={`p-3 rounded-md flex items-center gap-2 ${
                    translationAccuracy >= 95 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {translationAccuracy >= 95 ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <span>
                      Translation accuracy: {translationAccuracy}% 
                      {translationAccuracy >= 95 ? ' - You can proceed!' : ' - Need at least 95% to continue'}
                    </span>
                  </div>
                )}

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

          {/* Normal Translation Audio (shown after step 1) */}
          {currentStep !== 'forward' && exercise.normal_translation && (
            <Card>
              <CardHeader>
                <CardTitle>Expected Translation ({exercise.support_language})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg font-medium">{exercise.normal_translation}</p>
                {exercise.normal_translation_audio_url && (
                  <div className="flex justify-center">
                    <AudioPlayer audioUrl={exercise.normal_translation_audio_url} />
                  </div>
                )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Original:</p>
                    <p className="font-medium">{exercise.original_sentence}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Your back translation:</p>
                    <p className="font-medium">{userBackTranslation}</p>
                  </div>
                </div>
                <Button 
                  onClick={handleSaveAndContinue}
                  disabled={!userBackTranslation.trim() || isLoading}
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
