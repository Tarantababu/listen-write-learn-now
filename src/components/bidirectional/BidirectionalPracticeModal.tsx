import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowRight, CheckCircle, AlertTriangle, Volume2 } from 'lucide-react';
import { BidirectionalService } from '@/services/bidirectionalService';
import type { BidirectionalExercise } from '@/types/bidirectional';
import type { Language } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { compareTexts } from '@/utils/textComparison';
import AudioPlayer from '@/components/AudioPlayer';
import VocabularyHighlighter from '@/components/VocabularyHighlighter';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [userTranslation, setUserTranslation] = useState('');
  const [userBackTranslation, setUserBackTranslation] = useState('');
  const [currentStep, setCurrentStep] = useState<'forward' | 'backward' | 'complete'>('forward');
  const [isLoading, setIsLoading] = useState(false);
  const [translationComparison, setTranslationComparison] = useState<ReturnType<typeof compareTexts> | null>(null);
  const [backTranslationComparison, setBackTranslationComparison] = useState<ReturnType<typeof compareTexts> | null>(null);

  React.useEffect(() => {
    if (exercise && isOpen) {
      // Always start with empty fields when modal opens for the first time
      setUserTranslation('');
      setUserBackTranslation('');
      setCurrentStep('forward');
      setTranslationComparison(null);
      setBackTranslationComparison(null);
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

    // For backward step (completion), validate back translation accuracy
    if (currentStep === 'backward' && exercise.original_sentence) {
      const backComparison = compareTexts(exercise.original_sentence, userBackTranslation);
      setBackTranslationComparison(backComparison);
      if (backComparison.accuracy < 95) {
        toast({
          title: "Back Translation Accuracy Too Low",
          description: `Your back translation accuracy is ${backComparison.accuracy}%. You need at least 95% accuracy to complete the exercise.`,
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
      
      if (currentStep === 'complete' || currentStep === 'backward') {
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

  const renderWordFeedback = (comparison: ReturnType<typeof compareTexts>) => {
    if (!comparison) return null;
    
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium">Word-by-word analysis:</div>
        <div className="flex flex-wrap gap-1 p-3 bg-muted rounded-md">
          {comparison.tokenResults.map((token, index) => {
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
            <span>Correct ({comparison.correct})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>Almost ({comparison.almost})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Wrong ({comparison.incorrect})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Missing ({comparison.missing})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
            <span>Extra ({comparison.extra})</span>
          </div>
        </div>
      </div>
    );
  };

  if (!exercise) return null;

  // Create a mock exercise object for VocabularyHighlighter compatibility
  // Note: We don't pass the exerciseId since bidirectional exercises are in a different table
  const mockExercise = {
    id: `bidirectional-${exercise.id}`, // Use a prefixed ID to distinguish from regular exercises
    text: exercise.original_sentence,
    language: exercise.target_language as Language,
    title: 'Bidirectional Exercise',
    tags: [],
    audioUrl: exercise.original_audio_url,
    directoryId: null,
    createdAt: new Date(),
    completionCount: 0,
    isCompleted: false,
    archived: false
  };

  const modalContent = (
    <div className={`space-y-4 ${isMobile ? 'px-4 py-4' : 'space-y-6'}`}>
      {/* Original Sentence - Always Visible at Top */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className={isMobile ? "pb-2" : "pb-3"}>
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} text-primary`}>
              Original Sentence ({exercise.target_language})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
          <div className={`p-3 ${isMobile ? 'p-3' : 'p-4'} bg-background rounded-lg border`}>
            <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-center leading-relaxed`}>
              {exercise.original_sentence}
            </p>
          </div>
          {/* Audio Players for Generated Sentences */}
          <div className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
            {exercise.original_audio_url && (
              <div className="flex flex-col items-center gap-2">
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>
                  Original Sentence Audio
                </div>
                <div className={`bg-background/50 ${isMobile ? 'p-2' : 'p-4'} rounded-lg border`}>
                  <AudioPlayer audioUrl={exercise.original_audio_url} />
                </div>
              </div>
            )}
            
            {exercise.normal_translation_audio_url && (
              <div className="flex flex-col items-center gap-2">
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground`}>
                  Translation Audio ({exercise.support_language})
                </div>
                <div className={`bg-background/50 ${isMobile ? 'p-2' : 'p-4'} rounded-lg border`}>
                  <AudioPlayer audioUrl={exercise.normal_translation_audio_url} />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Progress Indicator */}
      <div className={`flex items-center justify-center ${isMobile ? 'space-x-2 py-1' : 'space-x-4 py-2'}`}>
        <div className={`flex items-center ${isMobile ? 'space-x-1 px-2 py-1' : 'space-x-2 px-4 py-2'} rounded-full ${
          currentStep === 'forward' ? 'bg-primary text-primary-foreground' : 
          currentStep === 'backward' || currentStep === 'complete' ? 'bg-green-100 text-green-800' : 'bg-muted'
        }`}>
          <span className={`font-medium ${isMobile ? 'text-xs' : ''}`}>1</span>
          <span className={isMobile ? 'text-xs' : ''}>Forward Translation</span>
        </div>
        <ArrowRight className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
        <div className={`flex items-center ${isMobile ? 'space-x-1 px-2 py-1' : 'space-x-2 px-4 py-2'} rounded-full ${
          currentStep === 'backward' ? 'bg-primary text-primary-foreground' : 
          currentStep === 'complete' ? 'bg-green-100 text-green-800' : 'bg-muted'
        }`}>
          <span className={`font-medium ${isMobile ? 'text-xs' : ''}`}>2</span>
          <span className={isMobile ? 'text-xs' : ''}>Back Translation</span>
        </div>
        <ArrowRight className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
        <div className={`flex items-center ${isMobile ? 'space-x-1 px-2 py-1' : 'space-x-2 px-4 py-2'} rounded-full ${
          currentStep === 'complete' ? 'bg-green-500 text-white' : 'bg-muted'
        }`}>
          <CheckCircle className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          <span className={isMobile ? 'text-xs' : ''}>Complete</span>
        </div>
      </div>

      {/* Forward Translation Step */}
      {currentStep === 'forward' && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className={isMobile ? 'pb-2' : ''}>
            <CardTitle className="flex items-center gap-2">
              <span className={`bg-blue-500 text-white rounded-full ${isMobile ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'} flex items-center justify-center font-bold`}>1</span>
              <span className={isMobile ? 'text-base' : ''}>Forward Translation</span>
            </CardTitle>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
              Translate the sentence from <span className="font-semibold">{exercise.target_language}</span> to <span className="font-semibold">{exercise.support_language}</span>
            </p>
          </CardHeader>
          <CardContent className={`space-y-3 ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <div className="space-y-2">
              <label className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Your translation:</label>
              <Textarea 
                value={userTranslation} 
                onChange={(e) => {
                  setUserTranslation(e.target.value);
                  setTranslationComparison(null); // Reset comparison when user types
                }} 
                placeholder="Enter your translation..." 
                rows={isMobile ? 2 : 3} 
                className={isMobile ? 'text-base' : 'text-lg'} 
              />
            </div>
            
            {translationComparison && (
              <div className={`${isMobile ? 'p-3' : 'p-4'} rounded-md border ${
                translationComparison.accuracy >= 95 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {translationComparison.accuracy >= 95 ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  }
                  <span className={`font-medium ${isMobile ? 'text-sm' : ''} ${
                    translationComparison.accuracy >= 95 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Translation accuracy: {translationComparison.accuracy}% 
                    {translationComparison.accuracy >= 95 ? ' - You can proceed!' : ' - Need at least 95% to continue'}
                  </span>
                </div>
                {renderWordFeedback(translationComparison)}
                <div className={`mt-4 ${isMobile ? 'p-2' : 'p-3'} bg-blue-50 rounded-md border border-blue-200`}>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-blue-800 mb-1`}>Expected translation:</div>
                  <div className={`text-blue-900 ${isMobile ? 'text-sm' : ''}`}>{exercise.normal_translation}</div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSaveAndContinue} 
              disabled={!userTranslation.trim() || isLoading} 
              className={`w-full flex items-center gap-2 ${isMobile ? 'text-base py-3' : 'text-lg py-6'}`} 
              size={isMobile ? "default" : "lg"}
            >
              <ArrowRight className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              Continue to Back Translation
            </Button>
            
            {/* Vocabulary Builder for Step 1 */}
            <VocabularyHighlighter exercise={mockExercise} />
          </CardContent>
        </Card>
      )}

      {/* Normal Translation Audio (shown after step 1) */}
      {currentStep !== 'forward' && exercise.normal_translation && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className={isMobile ? 'pb-2' : ''}>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-green-600`} />
              <span className={isMobile ? 'text-base' : ''}>Expected Translation ({exercise.support_language})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={`space-y-3 ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <div className={`${isMobile ? 'p-3' : 'p-4'} bg-background rounded-lg border`}>
              <p className={`${isMobile ? 'text-base' : 'text-lg'} font-medium`}>{exercise.normal_translation}</p>
            </div>
            {exercise.normal_translation_audio_url && (
              <div className="flex justify-center">
                <div className={`bg-background/50 ${isMobile ? 'p-2' : 'p-4'} rounded-lg`}>
                  <AudioPlayer audioUrl={exercise.normal_translation_audio_url} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Backward Translation Step */}
      {currentStep === 'backward' && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className={isMobile ? 'pb-2' : ''}>
            <CardTitle className="flex items-center gap-2">
              <span className={`bg-orange-500 text-white rounded-full ${isMobile ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'} flex items-center justify-center font-bold`}>2</span>
              <span className={isMobile ? 'text-base' : ''}>Back Translation</span>
            </CardTitle>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
              Now translate your translation back to <span className="font-semibold">{exercise.target_language}</span>
            </p>
          </CardHeader>
          <CardContent className={`space-y-3 ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <div className={`${isMobile ? 'p-2' : 'p-3'} bg-blue-50 rounded-md border border-blue-200`}>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-700 mb-1 font-medium`}>Your forward translation:</p>
              <p className={`text-blue-900 ${isMobile ? 'text-sm' : ''}`}>{userTranslation}</p>
            </div>
            
            <div className="space-y-2">
              <label className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium`}>Translate back to {exercise.target_language}:</label>
              <Textarea 
                value={userBackTranslation} 
                onChange={(e) => {
                  setUserBackTranslation(e.target.value);
                  setBackTranslationComparison(null); // Reset comparison when user types
                }} 
                placeholder="Translate back to the original language..." 
                rows={isMobile ? 2 : 3} 
                className={isMobile ? 'text-base' : 'text-lg'} 
              />
            </div>
            
            {backTranslationComparison && (
              <div className={`${isMobile ? 'p-3' : 'p-4'} rounded-md border ${
                backTranslationComparison.accuracy >= 95 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {backTranslationComparison.accuracy >= 95 ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  }
                  <span className={`font-medium ${isMobile ? 'text-sm' : ''} ${
                    backTranslationComparison.accuracy >= 95 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Back translation accuracy: {backTranslationComparison.accuracy}% 
                    {backTranslationComparison.accuracy >= 95 ? ' - You can complete!' : ' - Need at least 95% to complete'}
                  </span>
                </div>
                {renderWordFeedback(backTranslationComparison)}
                <div className={`mt-4 ${isMobile ? 'p-2' : 'p-3'} bg-blue-50 rounded-md border border-blue-200`}>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-blue-800 mb-1`}>Expected back translation (original sentence):</div>
                  <div className={`text-blue-900 ${isMobile ? 'text-sm' : ''}`}>{exercise.original_sentence}</div>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleSaveAndContinue} 
              disabled={!userBackTranslation.trim() || isLoading} 
              className={`w-full flex items-center gap-2 ${isMobile ? 'text-base py-3' : 'text-lg py-6'}`} 
              size={isMobile ? "default" : "lg"}
            >
              <CheckCircle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              Complete Practice
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {currentStep === 'complete' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className={isMobile ? 'pb-2' : ''}>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-green-600`} />
              <span className={isMobile ? 'text-base' : ''}>Practice Complete!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className={`space-y-3 ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <div className={`${isMobile ? 'p-3' : 'p-4'} bg-green-100 rounded-lg`}>
              <p className={`text-green-800 font-medium ${isMobile ? 'text-sm' : ''}`}>
                🎉 Great job! This exercise is now ready for spaced repetition review.
              </p>
              <p className={`text-green-700 mt-2 ${isMobile ? 'text-sm' : ''}`}>
                You'll be prompted to review it using the schedule: 1 → 3 → 7 days.
              </p>
            </div>
            <Button 
              onClick={() => onClose()} 
              className={`w-full bg-green-600 hover:bg-green-700 ${isMobile ? 'text-base py-3' : 'text-lg py-6'}`} 
              size={isMobile ? "default" : "lg"}
            >
              Close and Return to Exercises
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Mobile: Use Sheet, Desktop: Use Dialog
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[95vh] flex flex-col overflow-hidden">
          <SheetHeader className="flex-shrink-0 pb-2">
            <SheetTitle className="text-lg font-bold">
              Bidirectional Practice
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {modalContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">
            Bidirectional Practice
          </DialogTitle>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
};
