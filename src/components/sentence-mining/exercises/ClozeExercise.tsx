
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle, Eye, ArrowRight, Loader2, Keyboard, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { SentenceMiningExercise } from '@/types/sentence-mining';

interface ClozeExerciseProps {
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

export const ClozeExercise: React.FC<ClozeExerciseProps> = ({
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
  const [wordTranslation, setWordTranslation] = useState<string>('');
  const [translationLoading, setTranslationLoading] = useState(false);
  const [sentenceTranslation, setSentenceTranslation] = useState<string>('');
  const [sentenceTranslationLoading, setSentenceTranslationLoading] = useState(false);
  const [buttonState, setButtonState] = useState<'idle' | 'processing'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const { settings } = useUserSettingsContext();
  const isMobile = useIsMobile();

  // Get the first target word for this exercise
  const targetWord = exercise.targetWords?.[0] || '';

  // Fetch translation for the target word
  useEffect(() => {
    const fetchTranslation = async () => {
      if (!targetWord) return;

      setTranslationLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-vocabulary-info', {
          body: {
            text: targetWord,
            language: settings.selectedLanguage,
            requestShort: true
          }
        });

        if (error) throw error;

        if (data?.definition) {
          setWordTranslation(data.definition);
        } else {
          setWordTranslation('translation unavailable');
        }
      } catch (error) {
        console.error('Error fetching translation:', error);
        setWordTranslation('translation unavailable');
      } finally {
        setTranslationLoading(false);
      }
    };

    fetchTranslation();
  }, [targetWord, settings.selectedLanguage]);

  // Fetch translation for the full sentence
  useEffect(() => {
    const fetchSentenceTranslation = async () => {
      if (exercise.translation) {
        setSentenceTranslation(exercise.translation);
        return;
      }

      setSentenceTranslationLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-vocabulary-info', {
          body: {
            text: exercise.sentence,
            language: settings.selectedLanguage,
            requestShort: true
          }
        });

        if (error) throw error;

        if (data?.definition) {
          setSentenceTranslation(data.definition);
        } else {
          setSentenceTranslation('Translation unavailable');
        }
      } catch (error) {
        console.error('Error fetching sentence translation:', error);
        setSentenceTranslation('Translation unavailable');
      } finally {
        setSentenceTranslationLoading(false);
      }
    };

    fetchSentenceTranslation();
  }, [exercise.sentence, exercise.translation, settings.selectedLanguage]);

  // Auto-focus input when component mounts and on mobile
  useEffect(() => {
    if (inputRef.current && !showResult) {
      // Small delay to ensure proper focus on mobile
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showResult, exercise]);

  const handleSubmitClick = async () => {
    if (buttonState === 'processing' || loading) return;
    
    setButtonState('processing');
    
    try {
      await onSubmit();
    } catch (error) {
      console.error('Error in submit:', error);
    } finally {
      // Reset button state after a short delay
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key for both submit and continue
    if (e.key === 'Enter' && !loading && buttonState === 'idle') {
      e.preventDefault();
      if (!showResult && userResponse.trim()) {
        // Submit answer
        handleSubmitClick();
      } else if (showResult) {
        // Continue to next
        handleNextClick();
      }
    }
    // Show/hide translation on Ctrl+T or Cmd+T
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      onToggleTranslation();
    }
  };

  // Handle global Enter key press when result is shown
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && showResult && !loading && buttonState === 'idle') {
        e.preventDefault();
        handleNextClick();
      }
    };

    if (showResult) {
      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [showResult, loading, buttonState]);

  const renderSentenceWithBlank = () => {
    // Create a cloze sentence by replacing the target word with a blank (5 underscores)
    let clozeSentence = exercise.clozeSentence;
    
    // If clozeSentence doesn't have the blank placeholder, create it
    if (!clozeSentence || !clozeSentence.includes('_____')) {
      // Use the regular sentence and replace the target word with blanks
      clozeSentence = exercise.sentence.replace(
        new RegExp(`\\b${targetWord}\\b`, 'gi'), 
        '_____'
      );
    }
    
    // Split by the blank placeholder
    const parts = clozeSentence.split('_____');
    
    if (parts.length >= 2) {
      return (
        <div className="text-lg leading-relaxed">
          <div className="flex flex-wrap items-baseline justify-center gap-1">
            <span>{parts[0]}</span>
            <div className="relative inline-flex">
              <Input
                ref={inputRef}
                value={userResponse}
                onChange={(e) => onResponseChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={showResult || loading || buttonState === 'processing'}
                className={`w-32 text-center ${
                  showResult
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                    : ''
                }`}
                placeholder="Type here..."
              />
            </div>
            <span>{parts.slice(1).join('_____')}</span>
          </div>
        </div>
      );
    }
    
    // If we still can't create a proper cloze, show a fallback
    return (
      <div className="text-lg leading-relaxed space-y-4">
        <div className="text-center">
          <p className="mb-4">Complete the sentence by filling in the missing word:</p>
          <p className="mb-4 font-medium">{exercise.sentence.replace(
            new RegExp(`\\b${targetWord}\\b`, 'gi'), 
            '_____'
          )}</p>
          <div className="flex flex-col items-center gap-2">
            <Input
              ref={inputRef}
              value={userResponse}
              onChange={(e) => onResponseChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={showResult || loading || buttonState === 'processing'}
              className={`w-32 text-center ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  : ''
              }`}
              placeholder="Type here..."
            />
          </div>
        </div>
      </div>
    );
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Mobile Header - Sticky */}
        <div className="sticky top-0 z-10 bg-card border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">
                {exercise.difficulty}
              </Badge>
              <span className="text-sm font-medium">Fill in the Blank</span>
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

        {/* Content */}
        <div className="flex-1 flex flex-col px-4 py-4 space-y-4 pb-24">
          <div className="p-4 bg-muted rounded-lg">
            {renderSentenceWithBlank()}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Keyboard className="h-3 w-3" />
            <span>Enter: {showResult ? 'continue' : 'submit'}</span>
          </div>

          {/* Show hint and result */}
          {showTranslation && wordTranslation && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Hint (English):
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {translationLoading ? 'Loading...' : wordTranslation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {showResult && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <Badge variant={isCorrect ? 'default' : 'destructive'}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </Badge>
              </div>

              {!isCorrect && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Correct answer:
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm font-semibold">
                    {targetWord}
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

        {/* Mobile Bottom Actions - Fixed */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t px-4 py-4 safe-area-bottom">
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTranslation}
              className="w-full h-10 flex items-center justify-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showTranslation ? 'Hide Hint' : 'Show Hint'}
            </Button>
            
            {!showResult ? (
              <Button
                onClick={handleSubmitClick}
                disabled={!userResponse.trim() || loading || buttonState === 'processing'}
                className="w-full h-12 text-base relative overflow-hidden"
              >
                {(buttonState === 'processing' || loading) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary">
                    <div className="flex items-center gap-2 text-primary-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Checking...</span>
                    </div>
                  </div>
                )}
                {(buttonState === 'processing' || loading) ? '' : 'Submit'}
              </Button>
            ) : (
              <Button
                onClick={handleNextClick}
                disabled={buttonState === 'processing' || loading}
                className="w-full h-12 text-base relative overflow-hidden"
              >
                {(buttonState === 'processing' || loading) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary">
                    <div className="flex items-center gap-2 text-primary-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </div>
                )}
                {(buttonState === 'processing' || loading) ? '' : (
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
            <CardTitle className="text-lg">Fill in the missing word</CardTitle>
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
                  className="flex items-center gap-1"
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
            <div className="p-4 bg-muted rounded-lg">
              {renderSentenceWithBlank()}
            </div>
            
            {/* Keyboard shortcuts hint */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Keyboard className="h-3 w-3" />
              <span>Enter: {showResult ? 'continue' : 'submit'} • Ctrl+T: hint</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show hint */}
      {showTranslation && wordTranslation && (
        <Card>
          <CardContent className="pt-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Hint (English):
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {translationLoading ? 'Loading...' : wordTranslation}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions and results */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleTranslation}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showTranslation ? 'Hide Hint' : 'Show Hint'}
              </Button>
              
              {!showResult ? (
                <Button
                  onClick={handleSubmitClick}
                  disabled={!userResponse.trim() || loading || buttonState === 'processing'}
                  className="px-8 min-w-[140px]"
                >
                  {(buttonState === 'processing' || loading) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {(buttonState === 'processing' || loading) ? 'Checking...' : 'Submit'}
                </Button>
              ) : (
                <Button
                  onClick={handleNextClick}
                  disabled={buttonState === 'processing' || loading}
                  className="px-8 flex items-center gap-2 min-w-[120px]"
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
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </Badge>
                </div>

                {!isCorrect && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Correct answer:
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 font-semibold">
                      {targetWord}
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
