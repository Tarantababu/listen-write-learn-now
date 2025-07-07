import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle, ArrowRight, Eye, Loader2, Keyboard } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { useIsMobile } from '@/hooks/use-mobile';
import { EnhancedAudioPlayer } from './EnhancedAudioPlayer';

interface MultipleChoiceExerciseProps {
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

export const MultipleChoiceExercise: React.FC<MultipleChoiceExerciseProps> = ({
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
  const isMobile = useIsMobile();

  // Add keyboard event listener for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) {
        e.preventDefault();
        if (!showResult && userResponse) {
          onSubmit();
        } else if (showResult) {
          onNext();
        }
      }
      // Show/hide translation on Ctrl+T or Cmd+T
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        onToggleTranslation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showResult, userResponse, loading, onSubmit, onNext, onToggleTranslation]);

  const renderSentenceWithBlank = (sentence: string, targetWord: string) => {
    const parts = sentence.split(new RegExp(`\\b${targetWord}\\b`, 'gi'));
    const result = [];
    
    parts.forEach((part, index) => {
      result.push(part);
      if (index < parts.length - 1) {
        result.push(
          <span key={index} className={`inline-block border-2 border-primary border-dashed mx-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/20 rounded text-center ${isMobile ? 'min-w-[100px]' : 'min-w-[120px]'}`}>
            {showResult && userResponse ? (
              <span className={isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {userResponse}
              </span>
            ) : (
              <span className="text-muted-foreground font-medium">
                ?
              </span>
            )}
          </span>
        );
      }
    });
    
    return result;
  };

  // Mobile-first layout
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
              <span className="text-sm font-medium">Find Missing Word</span>
            </div>
            <EnhancedAudioPlayer
              text={exercise.sentence}
              onPlayAudio={onPlayAudio}
              audioLoading={audioLoading}
              size="sm"
              className="text-xs px-3 py-2 h-8"
            />
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 flex flex-col px-4 py-4 space-y-4 pb-32">
          {/* Sentence with blank */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-lg leading-relaxed text-center">
              {renderSentenceWithBlank(exercise.sentence, exercise.targetWord)}
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Find the missing word by tapping one of the options below.
          </p>

          {/* Multiple Choice Options - Mobile Grid */}
          <div className="grid grid-cols-1 gap-3">
            {exercise.multipleChoiceOptions?.map((option, index) => (
              <Button
                key={index}
                variant={userResponse === option ? 'default' : 'outline'}
                className={`p-4 h-auto text-lg min-h-[56px] transition-all duration-200 ${
                  showResult && option === exercise.correctAnswer
                    ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-100'
                    : showResult && userResponse === option && !isCorrect
                    ? 'bg-red-100 border-red-500 text-red-700 hover:bg-red-100'
                    : ''
                }`}
                onClick={() => !showResult && onResponseChange(option)}
                disabled={showResult || loading}
              >
                {option}
              </Button>
            ))}
          </div>

          {/* Result feedback */}
          {showResult && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <Badge variant={isCorrect ? 'default' : 'destructive'} className="text-sm">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </Badge>
              </div>

              {exercise.explanation && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Explanation:
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {exercise.explanation}
                  </p>
                </div>
              )}

              {showTranslation && exercise.translation && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Translation:
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    {exercise.translation}
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
                onClick={onSubmit}
                disabled={!userResponse || loading}
                className="w-full h-12 text-base flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Checking...' : 'Submit'}
              </Button>
            ) : (
              <Button
                onClick={onNext}
                disabled={loading}
                className="w-full h-12 text-base flex items-center justify-center gap-2"
              >
                {loading ? (
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

            {/* Keyboard shortcuts hint */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Keyboard className="h-3 w-3" />
              <span>Enter: {showResult ? 'continue' : 'submit'}</span>
            </div>
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
            <CardTitle className="text-lg">Find the missing word</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {exercise.difficulty}
              </Badge>
              <EnhancedAudioPlayer
                text={exercise.sentence}
                onPlayAudio={onPlayAudio}
                audioLoading={audioLoading}
                size="sm"
                className="flex items-center gap-1"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Sentence with blank */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xl leading-relaxed text-center">
                {renderSentenceWithBlank(exercise.sentence, exercise.targetWord)}
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Find the missing word. Click any words you don't know.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Multiple Choice Options */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {exercise.multipleChoiceOptions?.map((option, index) => (
                <Button
                  key={index}
                  variant={userResponse === option ? 'default' : 'outline'}
                  className={`p-4 h-auto text-lg ${
                    showResult && option === exercise.correctAnswer
                      ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-100'
                      : showResult && userResponse === option && !isCorrect
                      ? 'bg-red-100 border-red-500 text-red-700 hover:bg-red-100'
                      : ''
                  }`}
                  onClick={() => !showResult && onResponseChange(option)}
                  disabled={showResult || loading}
                >
                  {option}
                </Button>
              ))}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleTranslation}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {showTranslation ? 'Hide Hint' : 'Hint'}
                </Button>
                <Button variant="outline" size="sm">
                  Translate
                </Button>
                <Button variant="outline" size="sm">
                  Reveal
                </Button>
              </div>
              
              {!showResult ? (
                <Button
                  onClick={onSubmit}
                  disabled={!userResponse || loading}
                  className="px-8"
                >
                  {loading ? 'Checking...' : 'Submit'}
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  className="px-8 flex items-center gap-2"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {showResult && (
              <div className="space-y-3">
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

                {exercise.explanation && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Explanation:
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {exercise.explanation}
                    </p>
                  </div>
                )}

                {showTranslation && exercise.translation && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Translation:
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      {exercise.translation}
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
