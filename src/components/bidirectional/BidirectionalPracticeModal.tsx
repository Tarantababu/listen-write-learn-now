
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
  const [translationComparison, setTranslationComparison] = useState<ReturnType<typeof compareTexts> | null>(null);

  React.useEffect(() => {
    if (exercise && isOpen) {
      setUserTranslation(exercise.user_forward_translation || '');
      setUserBackTranslation(exercise.user_back_translation || '');
      setCurrentStep('forward');
      setTranslationComparison(null);
    }
  }, [exercise, isOpen]);

  const handleNextStep = () => {
    switch (currentStep) {
      case 'forward':
        // Check translation accuracy before proceeding
        if (exercise?.normal_translation) {
          const comparison = compareTexts(exercise.normal_translation, userTranslation);
          setTranslationComparison(comparison);
          
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
      setTranslationComparison(comparison);
      
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

  const renderWordFeedback = () => {
    if (!translationComparison) return null;

    return (
      <div className="space-y-3">
        <div className="text-sm font-medium">Word-by-word analysis:</div>
        <div className="flex flex-wrap gap-1 p-3 bg-muted rounded-md">
          {translationComparison.tokenResults.map((token, index) => {
            let className = "px-2 py-1 rounded text-sm ";
            let displayText = token.userToken || `[${token.originalToken}]`;
            
            switch (token.status) {
              case 'correct':
                className += "bg-green-100 text-green-800 border border-green-200";
                break;
              case 'almost':
                className += "bg-yellow-100 text-yellow-800 border border-yellow-200";
                break;
              case 'incorrect':
                className += "bg-red-100 text-red-800 border border-red-200";
                break;
              case 'missing':
                className += "bg-gray-100 text-gray-600 border border-gray-200 line-through";
                displayText = `[${token.originalToken}]`;
                break;
              case 'extra':
                className += "bg-orange-100 text-orange-800 border border-orange-200";
                break;
              default:
                className += "bg-gray-100 text-gray-600";
            }
            
            return (
              <span key={index} className={className}>
                {displayText}
              </span>
            );
          })}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Correct ({translationComparison.correct})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>Almost ({translationComparison.almost})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Wrong ({translationComparison.incorrect})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Missing ({translationComparison.missing})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
            <span>Extra ({translationComparison.extra})</span>
          </div>
        </div>

        {exercise?.normal_translation && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="text-sm font-medium text-blue-800 mb-1">Expected translation:</div>
            <div className="text-blue-900">{exercise.normal_translation}</div>
          </div>
        )}
      </div>
    );
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
                    setTranslationComparison(null); // Reset comparison when user types
                  }}
                  placeholder="Enter your translation..."
                  rows={3}
                />
                
                {translationComparison && (
                  <div className={`p-4 rounded-md border ${
                    translationComparison.accuracy >= 95 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      {translationComparison.accuracy >= 95 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        translationComparison.accuracy >= 95 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        Translation accuracy: {translationComparison.accuracy}% 
                        {translationComparison.accuracy >= 95 ? ' - You can proceed!' : ' - Need at least 95% to continue'}
                      </span>
                    </div>
                    {renderWordFeedback()}
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
                    {exercise.original_audio_url && (
                      <div className="mt-2">
                        <AudioPlayer audioUrl={exercise.original_audio_url} />
                      </div>
                    )}
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
