import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Volume2,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  Loader2,
  KeyboardIcon,
  Lightbulb,
} from 'lucide-react';
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
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && !showResult) {
      inputRef.current.focus();
    }
  }, [showResult]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !showResult && userResponse.trim()) {
      e.preventDefault();
      handleSubmitClick();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      onToggleTranslation();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault();
      setShowHint(!showHint);
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
      setTimeout(() => setButtonState('idle'), 1000);
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
      setTimeout(() => setButtonState('idle'), 500);
    }
  };

  const renderHint = () => (
    <div className="mt-2 space-y-1 max-w-xs text-center mx-auto">
      {exercise.translation && (
        <div className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-700 rounded-full text-xs font-medium text-blue-800 dark:text-blue-200 shadow-sm">
          <span className="flex items-center justify-center gap-1.5">
            <Lightbulb className="h-3 w-3" />
            English: {exercise.translation}
          </span>
        </div>
      )}
      {showHint && exercise.explanation && (
        <div className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 border border-amber-200 dark:border-amber-700 rounded-full text-xs font-medium text-amber-800 dark:text-amber-200 shadow-sm truncate">
          <span className="block truncate">💡 {exercise.explanation}</span>
        </div>
      )}
    </div>
  );

  const renderSentenceWithBlank = () => {
    let clozeSentence = exercise.clozeSentence;
    if (!clozeSentence || !clozeSentence.includes('_____')) {
      clozeSentence = exercise.sentence.replace(
        new RegExp(`\\b${exercise.targetWord}\\b`, 'gi'),
        '_____'
      );
    }

    const parts = clozeSentence.split('_____');
    if (parts.length >= 2) {
      return (
        <div className="text-lg leading-relaxed text-center">
          <div className="flex flex-wrap items-baseline justify-center gap-1">
            <span>{parts[0]}</span>
            <div className="relative inline-flex flex-col items-center">
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
              {renderHint()}
            </div>
            <span>{parts.slice(1).join('_____')}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="text-lg leading-relaxed space-y-4 text-center">
        <p className="mb-4">Complete the sentence by filling in the missing word:</p>
        <p className="mb-4 font-medium">
          {exercise.sentence.replace(
            new RegExp(`\\b${exercise.targetWord}\\b`, 'gi'),
            '______'
          )}
        </p>
        <div className="flex flex-col items-center gap-2">
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
          {renderHint()}
        </div>
      </div>
    );
  };

  const keyboardShortcutsHint = (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <KeyboardIcon className="h-3 w-3" />
      <span>Enter: submit • Ctrl+T: translation • Ctrl+H: hint</span>
    </div>
  );

  // Use original layout render blocks below
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
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

        <div className="flex-1 flex flex-col">
          <div className="px-4 py-6 bg-muted/50">{renderSentenceWithBlank()}</div>

          <div className="px-4 py-4 border-b space-y-3">
            {exercise.explanation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(!showHint)}
                className="w-full justify-center text-sm"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {showHint ? 'Hide extra hint' : 'Show extra hint'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleTranslation}
              className="w-full justify-center text-sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showTranslation ? 'Hide sentence translation' : 'Show sentence translation'}
            </Button>
            {showTranslation && exercise.translation && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-center">
                <p className="text-blue-700 dark:text-blue-300">
                  Full sentence translation: {exercise.translation}
                </p>
              </div>
            )}
          </div>

          <div className="px-4 py-2 bg-muted/30">{keyboardShortcutsHint}</div>

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
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {exercise.targetWord}
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
            <div className="p-4 bg-muted rounded-lg text-center">
              {renderSentenceWithBlank()}
            </div>
            <div className="text-center space-y-3">
              {exercise.explanation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  {showHint ? 'Hide extra hint' : 'Show extra hint'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleTranslation}
                className="flex items-center gap-2 ml-2"
              >
                <Eye className="h-4 w-4" />
                {showTranslation ? 'Hide sentence translation' : 'Show sentence translation'}
              </Button>
              {showTranslation && exercise.translation && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
                  <p className="text-blue-700 dark:text-blue-300">
                    Full sentence translation: {exercise.translation}
                  </p>
                </div>
              )}
            </div>
            {keyboardShortcutsHint}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            {!showResult ? (
              <Button
                onClick={handleSubmitClick}
                disabled={!userResponse.trim() || loading || buttonState === 'processing'}
                className="px-8 min-w-[140px]"
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
                className="px-8 min-w-[120px] flex items-center gap-2"
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
            <div className="space-y-3 mt-4">
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
                  <p className="text-blue-700 dark:text-blue-300 text-sm">{exercise.targetWord}</p>
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
