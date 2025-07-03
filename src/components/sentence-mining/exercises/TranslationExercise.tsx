import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle, Eye, ArrowRight, Loader2, Keyboard } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface TranslationExerciseProps {
  exercise: SentenceMiningExercise;
  userResponse: string;
  onResponseChange: (response: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  showTranslation: boolean;
  onToggleTranslation: () => void;
}

export const TranslationExercise: React.FC<TranslationExerciseProps> = ({
  exercise,
  userResponse,
  onResponseChange,
  onSubmit,
  onNext,
  showResult,
  isCorrect,
  loading,
  onPlayAudio,
  audioLoading = false,
  showTranslation,
  onToggleTranslation,
}) => {
  const { settings } = useUserSettingsContext();
  const isMobile = useIsMobile();
  const [buttonState, setButtonState] = useState<'idle' | 'processing'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when component mounts and when moving to next exercise
  useEffect(() => {
    if (textareaRef.current && !showResult) {
      // Small delay to ensure the textarea is fully rendered
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [showResult]);

  // Also focus on component mount
  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, []);

  // Global keydown listener for Enter key
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (!showResult && userResponse.trim() && buttonState === 'idle' && !loading) {
          e.preventDefault();
          handleSubmitClick();
        } else if (showResult && buttonState === 'idle' && !loading) {
          e.preventDefault();
          handleNextClick();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showResult, userResponse, buttonState, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter key (but allow Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey && !showResult && userResponse.trim() && buttonState === 'idle' && !loading) {
      e.preventDefault();
      handleSubmitClick();
    }
    // Show/hide translation on Ctrl+T or Cmd+T
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      onToggleTranslation();
    }
  };

  const handleSubmitClick = async () => {
    if (buttonState === 'processing' || loading) return;
    
    setButtonState('processing');
    
    try {
      await onSubmit();
    } catch (error) {
      console.error('Error in submit:', error);
    } finally {
      setTimeout(() => {
        setButtonState('idle');
      }, 1000);
    }
  };

  const handleNextClick = async () => {
    if (buttonState === 'processing' || loading) return;
    
    setButtonState('processing');
    
    try {
      await onNext();
    } catch (error) {
      console.error('Error in next:', error);
    } finally {
      setTimeout(() => {
        setButtonState('idle');
      }, 500);
    }
  };

  // For translation exercises, we show English text and ask to translate to target language
  const displayText = exercise.translation || exercise.sentence; // English text to translate
  const expectedAnswer = exercise.sentence; // Target language sentence is the expected answer

  // Mobile-optimized layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Mobile Header - Fixed */}
        <div className="bg-card border-b px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {exercise.difficulty}
              </Badge>
              <span className="text-sm font-medium">Translation</span>
            </div>
            {onPlayAudio && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPlayAudio}
                disabled={audioLoading}
                className="text-xs px-2 py-1"
              >
                <Volume2 className="h-3 w-3 mr-1" />
                {audioLoading ? 'Loading' : 'Listen'}
              </Button>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 flex flex-col">
          {/* English Sentence */}
          <div className="px-4 py-6 bg-muted/50">
            <p className="text-lg font-medium text-center leading-relaxed">
              "{displayText}"
            </p>
          </div>

          {/* Translation Hint */}
          <div className="px-4 py-4 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleTranslation}
              className="w-full justify-center text-sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showTranslation ? 'Hide hint' : 'Show hint'}
            </Button>
            
            {showTranslation && expectedAnswer && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-center">
                <p className="text-blue-700 dark:text-blue-300">
                  Expected: {expectedAnswer}
                </p>
              </div>
            )}
          </div>

          {/* Response Area */}
          <div className="flex-1 flex flex-col px-4 py-4">
            <div className="mb-3">
              <p className="text-sm text-muted-foreground text-center">
                Translate:
              </p>
            </div>
            
            <Textarea
              ref={textareaRef}
              value={userResponse}
              onChange={(e) => onResponseChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your translation..."
              disabled={showResult || loading || buttonState === 'processing'}
              className={`flex-1 text-base resize-none ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  : ''
              }`}
              rows={4}
            />

            {/* Keyboard shortcuts hint */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
              <Keyboard className="h-3 w-3" />
              <span>Enter: {showResult ? 'continue' : 'submit'} • Shift+Enter: new line • Ctrl+T: translation</span>
            </div>

            {showResult && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <Badge variant={isCorrect ? 'default' : 'destructive'}>
                    {isCorrect ? 'Great translation!' : 'Needs improvement'}
                  </Badge>
                </div>

                {!isCorrect && expectedAnswer && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Correct answer:
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {expectedAnswer}
                    </p>
                  </div>
                )}

                {exercise.explanation && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Explanation:
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 text-sm">
                      {exercise.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Action Button - Fixed */}
          <div className="p-4 border-t bg-card">
            {!showResult ? (
              <Button
                onClick={handleSubmitClick}
                disabled={!userResponse.trim() || loading || buttonState === 'processing'}
                className="w-full py-3 text-base"
                size="lg"
              >
                {(buttonState === 'processing' || loading) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {buttonState === 'processing' || loading ? 'Checking...' : 'Submit Translation'}
              </Button>
            ) : (
              <Button
                onClick={handleNextClick}
                disabled={buttonState === 'processing' || loading}
                className="w-full py-3 text-base"
                size="lg"
              >
                {(buttonState === 'processing' || loading) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Translate</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {exercise.difficulty}
              </Badge>
              {onPlayAudio && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPlayAudio}
                  disabled={audioLoading}
                  className="flex items-center gap-1 transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  <Volume2 className="h-4 w-4" />
                  {audioLoading ? 'Loading...' : 'Listen'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* English sentence to translate */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xl font-medium text-center">
                "{displayText}"
              </p>
            </div>
            
            {/* Translation hint */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleTranslation}
                className="flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Eye className="h-4 w-4" />
                {showTranslation ? 'Hide hint' : 'Show hint'}
              </Button>
              
              {showTranslation && expectedAnswer && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-sm animate-fade-in">
                  <p className="text-blue-700 dark:text-blue-300">
                    Expected: {expectedAnswer}
                  </p>
                </div>
              )}
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Keyboard className="h-3 w-3" />
              <span>Enter: {showResult ? 'continue' : 'submit'} • Shift+Enter: new line • Ctrl+T: translation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Area */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Textarea
              ref={textareaRef}
              value={userResponse}
              onChange={(e) => onResponseChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your translation here..."
              disabled={showResult || loading || buttonState === 'processing'}
              className={`min-h-20 text-lg transition-all duration-200 ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  : ''
              }`}
            />
            
            <div className="flex justify-end">
              {!showResult ? (
                <Button
                  onClick={handleSubmitClick}
                  disabled={!userResponse.trim() || loading || buttonState === 'processing'}
                  className="px-8 transition-transform duration-200 hover:scale-105 active:scale-95 min-w-[140px]"
                >
                  {(buttonState === 'processing' || loading) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {buttonState === 'processing' || loading ? 'Checking...' : 'Submit Translation'}
                </Button>
              ) : (
                <Button
                  onClick={handleNextClick}
                  disabled={buttonState === 'processing' || loading}
                  className="px-8 flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95 min-w-[120px]"
                >
                  {(buttonState === 'processing' || loading) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {showResult && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <Badge variant={isCorrect ? 'default' : 'destructive'}>
                    {isCorrect ? 'Great translation!' : 'Needs improvement'}
                  </Badge>
                </div>

                {!isCorrect && expectedAnswer && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Correct answer:
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {expectedAnswer}
                    </p>
                  </div>
                )}

                {exercise.explanation && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Explanation:
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 text-sm">
                      {exercise.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};