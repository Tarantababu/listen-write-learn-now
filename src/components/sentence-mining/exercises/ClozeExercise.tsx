import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle, Eye, ArrowRight, Loader2, KeyboardIcon, Languages } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const { settings } = useUserSettingsContext();
  const isMobile = useIsMobile();
  const [buttonState, setButtonState] = useState<'idle' | 'processing'>('idle');
  const [showTargetWordHint, setShowTargetWordHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !showResult) {
      inputRef.current.focus();
    }
  }, [showResult]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Submit on Enter key
    if (e.key === 'Enter' && !showResult && userResponse.trim()) {
      e.preventDefault();
      handleSubmitClick();
    }
    // Show/hide translation on Ctrl+T or Cmd+T
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      onToggleTranslation();
    }
    // Show/hide target word hint on Ctrl+H or Cmd+H
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault();
      setShowTargetWordHint(!showTargetWordHint);
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

  const renderSentenceWithBlank = () => {
    // Create a cloze sentence by replacing the target word with a blank
    let clozeSentence = exercise.clozeSentence;
    
    // If clozeSentence doesn't have the blank placeholder, create it
    if (!clozeSentence || !clozeSentence.includes('_____')) {
      // Use the regular sentence and replace the target word with blanks
      clozeSentence = exercise.sentence.replace(
        new RegExp(`\\b${exercise.targetWord}\\b`, 'gi'), 
        '_____'
      );
    }
    
    console.log('Cloze sentence:', clozeSentence);
    console.log('Target word:', exercise.targetWord);
    
    // Split by the blank placeholder
    const parts = clozeSentence.split('_____');
    
    if (parts.length >= 2) {
      return (
        <div className="text-lg leading-relaxed space-y-3">
          <div className="flex flex-wrap items-baseline justify-center gap-1">
            <span>{parts[0]}</span>
            <div className="relative inline-flex flex-col items-center">
              {/* Show the blank underscores when no user input */}
              {!userResponse && !showResult && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-muted-foreground tracking-widest">
                    ______
                  </span>
                </div>
              )}
              <Input
                ref={inputRef}
                value={userResponse}
                onChange={(e) => onResponseChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={showResult || buttonState === 'processing'}
                className={`w-32 text-center ${
                  !userResponse && !showResult ? 'text-transparent' : ''
                } ${
                  showResult
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                    : ''
                }`}
                placeholder=""
              />
            </div>
            <span>{parts.slice(1).join('_____')}</span>
          </div>
          
          {/* Target word translation hint - Always visible when available */}
          {exercise.translation && (
            <div className="flex justify-center">
              <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-sm">
                  <Languages className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-700 dark:text-blue-300 font-medium">
                    English: {exercise.translation}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Additional hint button for target word */}
          {!showResult && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTargetWordHint(!showTargetWordHint)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {showTargetWordHint ? 'Hide hint' : 'Need a hint?'}
              </Button>
            </div>
          )}
          
          {/* Target word hint */}
          {showTargetWordHint && !showResult && (
            <div className="flex justify-center animate-fade-in">
              <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  First letter: <span className="font-bold">{exercise.targetWord.charAt(0).toUpperCase()}</span>
                  {exercise.targetWord.length > 1 && (
                    <span className="ml-2">
                      Length: {exercise.targetWord.length} letters
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // If we still can't create a proper cloze, show a fallback with visible blanks
    return (
      <div className="text-lg leading-relaxed space-y-4">
        <div className="text-center">
          <p className="mb-4">Complete the sentence by filling in the missing word:</p>
          <div className="mb-4 font-medium flex flex-wrap items-baseline justify-center gap-1">
            {exercise.sentence.split(new RegExp(`(\\b${exercise.targetWord}\\b)`, 'gi')).map((part, index) => {
              if (part.toLowerCase() === exercise.targetWord.toLowerCase()) {
                return (
                  <span key={index} className="inline-block relative">
                    <span className="text-2xl font-bold text-muted-foreground tracking-widest">
                      ______
                    </span>
                  </span>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Input
                ref={inputRef}
                value={userResponse}
                onChange={(e) => onResponseChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={showResult || buttonState === 'processing'}
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
            
            {/* Target word translation hint - Always visible when available */}
            {exercise.translation && (
              <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-sm">
                  <Languages className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-700 dark:text-blue-300 font-medium">
                    English: {exercise.translation}
                  </span>
                </div>
              </div>
            )}
            
            {/* Additional hint button for target word */}
            {!showResult && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTargetWordHint(!showTargetWordHint)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {showTargetWordHint ? 'Hide hint' : 'Need a hint?'}
              </Button>
            )}
            
            {/* Target word hint */}
            {showTargetWordHint && !showResult && (
              <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700 rounded-lg animate-fade-in">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  First letter: <span className="font-bold">{exercise.targetWord.charAt(0).toUpperCase()}</span>
                  {exercise.targetWord.length > 1 && (
                    <span className="ml-2">
                      Length: {exercise.targetWord.length} letters
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
              <span className="text-sm font-medium">Complete the Sentence</span>
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
          {/* Sentence with blank */}
          <div className="px-4 py-6 bg-muted/50">
            <div className="text-center">
              {renderSentenceWithBlank()}
            </div>
          </div>

          {/* Translation hint */}
          <div className="px-4 py-4 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleTranslation}
              className="w-full justify-center text-sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showTranslation ? 'Hide full translation' : 'Show full translation'}
            </Button>
            
            {showTranslation && exercise.translation && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-center">
                <p className="text-blue-700 dark:text-blue-300">
                  Full sentence translation: {exercise.translation}
                </p>
              </div>
            )}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="px-4 py-2 bg-muted/30">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <KeyboardIcon className="h-3 w-3" />
              <span>Enter: submit • Ctrl+T: translation • Ctrl+H: hint</span>
            </div>
          </div>

          {/* Results */}
          {showResult && (
            <div className="px-4 py-4 space-y-3">
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
                  <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                    {exercise.targetWord}
                  </p>
                  {exercise.translation && (
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                      Translation: {exercise.translation}
                    </p>
                  )}
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

          {/* Bottom Action Button - Fixed */}
          <div className="p-4 border-t bg-card mt-auto">
            {!showResult ? (
              <Button
                onClick={handleSubmitClick}
                disabled={!userResponse.trim() || loading || buttonState === 'processing'}
                className="w-full py-3 text-base"
                size="lg"
              >
                {buttonState === 'processing' && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {buttonState === 'processing' || loading ? 'Checking...' : 'Submit Answer'}
              </Button>
            ) : (
              <Button
                onClick={handleNextClick}
                disabled={buttonState === 'processing'}
                className="w-full py-3 text-base"
                size="lg"
              >
                {buttonState === 'processing' ? (
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
            <CardTitle className="text-lg">Complete the Sentence</CardTitle>
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
            {/* Sentence with blank */}
            <div className="p-4 bg-muted rounded-lg text-center">
              {renderSentenceWithBlank()}
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
                {showTranslation ? 'Hide full translation' : 'Show full translation'}
              </Button>
              
              {showTranslation && exercise.translation && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-sm animate-fade-in">
                  <p className="text-blue-700 dark:text-blue-300">
                    Full sentence translation: {exercise.translation}
                  </p>
                </div>
              )}
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <KeyboardIcon className="h-3 w-3" />
              <span>Enter: submit • Ctrl+T: full translation • Ctrl+H: word hint</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            {!showResult ? (
              <Button
                onClick={handleSubmitClick}
                disabled={!userResponse.trim() || loading || buttonState === 'processing'}
                className="px-8 transition-transform duration-200 hover:scale-105 active:scale-95 min-w-[140px]"
              >
                {buttonState === 'processing' && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {buttonState === 'processing' || loading ? 'Checking...' : 'Submit Answer'}
              </Button>
            ) : (
              <Button
                onClick={handleNextClick}
                disabled={buttonState === 'processing'}
                className="px-8 flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95 min-w-[120px]"
              >
                {buttonState === 'processing' ? (
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
            <div className="space-y-3 mt-4 animate-fade-in">
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
                  <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                    {exercise.targetWord}
                  </p>
                  {exercise.translation && (
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                      Translation: {exercise.translation}
                    </p>
                  )}
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
        </CardContent>
      </Card>
    </div>
  );
};