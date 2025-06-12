
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowRight, CheckCircle, AlertTriangle, Volume2, RotateCcw, Eye } from 'lucide-react';
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
  const [showExpectedTranslation, setShowExpectedTranslation] = useState(false);
  const [showExpectedBackTranslation, setShowExpectedBackTranslation] = useState(false);

  React.useEffect(() => {
    if (exercise && isOpen) {
      // Always start with empty fields when modal opens for the first time
      setUserTranslation('');
      setUserBackTranslation('');
      setCurrentStep('forward');
      setTranslationComparison(null);
      setBackTranslationComparison(null);
      setShowExpectedTranslation(false);
      setShowExpectedBackTranslation(false);
    }
  }, [exercise, isOpen]);

  const handleCheckAccuracy = () => {
    if (currentStep === 'forward' && exercise?.normal_translation) {
      const comparison = compareTexts(exercise.normal_translation, userTranslation);
      setTranslationComparison(comparison);
    } else if (currentStep === 'backward' && exercise?.original_sentence) {
      const backComparison = compareTexts(exercise.original_sentence, userBackTranslation);
      setBackTranslationComparison(backComparison);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 'forward') {
      setCurrentStep('backward');
      setTranslationComparison(null);
      setShowExpectedTranslation(false);
    } else if (currentStep === 'backward') {
      setCurrentStep('complete');
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

  const handleRetry = () => {
    if (currentStep === 'forward') {
      setUserTranslation('');
      setTranslationComparison(null);
      setShowExpectedTranslation(false);
    } else if (currentStep === 'backward') {
      setUserBackTranslation('');
      setBackTranslationComparison(null);
      setShowExpectedBackTranslation(false);
    }
  };

  const renderWordFeedback = (comparison: ReturnType<typeof compareTexts>) => {
    if (!comparison) return null;
    
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Word-by-word analysis:</div>
        <div className="flex flex-wrap gap-1 p-2 bg-muted/50 rounded-md border">
          {comparison.tokenResults.map((token, index) => {
            let className = "px-1.5 py-0.5 rounded text-xs ";
            let displayText = token.userToken || `[${token.originalToken}]`;
            
            switch (token.status) {
              case 'correct':
                className += "bg-green-100 text-green-700 border border-green-200";
                break;
              case 'almost':
                className += "bg-yellow-100 text-yellow-700 border border-yellow-200";
                break;
              case 'incorrect':
                className += "bg-red-100 text-red-700 border border-red-200";
                break;
              case 'missing':
                className += "bg-gray-100 text-gray-600 border border-gray-200 line-through";
                displayText = `[${token.originalToken}]`;
                break;
              case 'extra':
                className += "bg-orange-100 text-orange-700 border border-orange-200";
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
        
        <div className="grid grid-cols-3 md:grid-cols-5 gap-1 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-xs">Correct ({comparison.correct})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-xs">Almost ({comparison.almost})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-xs">Wrong ({comparison.incorrect})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-100 border border-gray-200 rounded"></div>
            <span className="text-xs">Missing ({comparison.missing})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-100 border border-orange-200 rounded"></div>
            <span className="text-xs">Extra ({comparison.extra})</span>
          </div>
        </div>
      </div>
    );
  };

  if (!exercise) return null;

  // Create a mock exercise object for VocabularyHighlighter compatibility
  const mockExercise = {
    id: `bidirectional-${exercise.id}`,
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
    <div className={`space-y-4 ${isMobile ? 'px-2 py-2' : 'space-y-4'}`}>
      {/* Original Sentence - Always Visible at Top */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-primary">
              Original Sentence ({exercise.target_language})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-background rounded-lg border">
            <p className="text-base font-medium text-center leading-relaxed">
              {exercise.original_sentence}
            </p>
          </div>
          {/* Audio Players */}
          <div className="space-y-2">
            {exercise.original_audio_url && (
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Original Audio
                </div>
                <div className="bg-background/50 p-2 rounded-lg border">
                  <AudioPlayer audioUrl={exercise.original_audio_url} />
                </div>
              </div>
            )}
            
            {exercise.normal_translation_audio_url && (
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Translation Audio ({exercise.support_language})
                </div>
                <div className="bg-background/50 p-2 rounded-lg border">
                  <AudioPlayer audioUrl={exercise.normal_translation_audio_url} />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Progress Indicator */}
      <div className="flex items-center justify-center space-x-2 py-2">
        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${
          currentStep === 'forward' ? 'bg-primary text-primary-foreground' : 
          currentStep === 'backward' || currentStep === 'complete' ? 'bg-green-100 text-green-800' : 'bg-muted'
        }`}>
          <span className="font-medium">1</span>
          <span>Forward</span>
        </div>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${
          currentStep === 'backward' ? 'bg-primary text-primary-foreground' : 
          currentStep === 'complete' ? 'bg-green-100 text-green-800' : 'bg-muted'
        }`}>
          <span className="font-medium">2</span>
          <span>Backward</span>
        </div>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${
          currentStep === 'complete' ? 'bg-green-500 text-white' : 'bg-muted'
        }`}>
          <CheckCircle className="h-3 w-3" />
          <span>Complete</span>
        </div>
      </div>

      {/* Forward Translation Step */}
      {currentStep === 'forward' && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">1</span>
              <span>Forward Translation</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Translate from <span className="font-semibold">{exercise.target_language}</span> to <span className="font-semibold">{exercise.support_language}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium">Your translation:</label>
              <Textarea 
                value={userTranslation} 
                onChange={(e) => {
                  setUserTranslation(e.target.value);
                  setTranslationComparison(null);
                }} 
                placeholder="Enter your translation..." 
                rows={2}
                className="text-sm resize-none"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleCheckAccuracy} 
                disabled={!userTranslation.trim()} 
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Check Accuracy
              </Button>
              
              <Button 
                onClick={() => setShowExpectedTranslation(!showExpectedTranslation)} 
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                {showExpectedTranslation ? 'Hide' : 'Show'} Expected
              </Button>
              
              <Button 
                onClick={handleRetry} 
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
            
            {/* Expected Translation */}
            {showExpectedTranslation && exercise.normal_translation && (
              <div className="p-2 bg-blue-50 rounded-md border border-blue-200">
                <div className="text-xs font-medium text-blue-800 mb-1">Expected translation:</div>
                <div className="text-sm text-blue-900">{exercise.normal_translation}</div>
              </div>
            )}
            
            {/* Accuracy Feedback */}
            {translationComparison && (
              <div className={`p-3 rounded-md border ${
                translationComparison.accuracy >= 95 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {translationComparison.accuracy >= 95 ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  }
                  <span className={`font-medium text-xs ${
                    translationComparison.accuracy >= 95 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Accuracy: {translationComparison.accuracy}% 
                    {translationComparison.accuracy >= 95 ? ' - Ready to proceed!' : ' - Need 95% to continue'}
                  </span>
                </div>
                {renderWordFeedback(translationComparison)}
              </div>
            )}

            <Button 
              onClick={handleSaveAndContinue} 
              disabled={!userTranslation.trim() || isLoading || (translationComparison && translationComparison.accuracy < 95)} 
              className="w-full text-sm"
              size="sm"
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              Continue to Step 2
            </Button>
            
            {/* Vocabulary Builder */}
            <VocabularyHighlighter exercise={mockExercise} />
          </CardContent>
        </Card>
      )}

      {/* Backward Translation Step */}
      {currentStep === 'backward' && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="bg-orange-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">2</span>
              <span>Back Translation</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Translate back to <span className="font-semibold">{exercise.target_language}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Reference Translation */}
            <div className="p-2 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-xs text-blue-700 mb-1 font-medium">Your forward translation:</p>
              <p className="text-sm text-blue-900">{userTranslation}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium">Translate back to {exercise.target_language}:</label>
              <Textarea 
                value={userBackTranslation} 
                onChange={(e) => {
                  setUserBackTranslation(e.target.value);
                  setBackTranslationComparison(null);
                }} 
                placeholder="Translate back to the original language..." 
                rows={2}
                className="text-sm resize-none"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleCheckAccuracy} 
                disabled={!userBackTranslation.trim()} 
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Check Accuracy
              </Button>
              
              <Button 
                onClick={() => setShowExpectedBackTranslation(!showExpectedBackTranslation)} 
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                {showExpectedBackTranslation ? 'Hide' : 'Show'} Expected
              </Button>
              
              <Button 
                onClick={handleRetry} 
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
            
            {/* Expected Back Translation */}
            {showExpectedBackTranslation && (
              <div className="p-2 bg-blue-50 rounded-md border border-blue-200">
                <div className="text-xs font-medium text-blue-800 mb-1">Expected back translation (original):</div>
                <div className="text-sm text-blue-900">{exercise.original_sentence}</div>
              </div>
            )}
            
            {/* Accuracy Feedback */}
            {backTranslationComparison && (
              <div className={`p-3 rounded-md border ${
                backTranslationComparison.accuracy >= 95 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {backTranslationComparison.accuracy >= 95 ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  }
                  <span className={`font-medium text-xs ${
                    backTranslationComparison.accuracy >= 95 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Accuracy: {backTranslationComparison.accuracy}% 
                    {backTranslationComparison.accuracy >= 95 ? ' - Ready to complete!' : ' - Need 95% to complete'}
                  </span>
                </div>
                {renderWordFeedback(backTranslationComparison)}
              </div>
            )}
            
            <Button 
              onClick={handleSaveAndContinue} 
              disabled={!userBackTranslation.trim() || isLoading || (backTranslationComparison && backTranslationComparison.accuracy < 95)} 
              className="w-full text-sm"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete Exercise
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {currentStep === 'complete' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-green-800 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Practice Complete!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <p className="text-green-800 font-medium text-sm">
                🎉 Excellent work! This exercise is now ready for spaced repetition review.
              </p>
              <p className="text-green-700 mt-2 text-xs">
                You'll be prompted to review it using the schedule: 1 → 3 → 7 days.
              </p>
            </div>
            <Button 
              onClick={() => onClose()} 
              className="w-full bg-green-600 hover:bg-green-700 text-sm" 
              size="sm"
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
            <SheetTitle className="text-base font-bold">
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-bold">
            Bidirectional Practice
          </DialogTitle>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
};
