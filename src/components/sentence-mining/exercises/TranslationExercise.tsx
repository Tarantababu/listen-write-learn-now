
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

interface TranslationExerciseProps {
  exercise: SentenceMiningExercise;
  userResponse: string;
  onResponseChange: (response: string) => void;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  onSubmit: () => void;
  onNext: () => void;
  showTranslation: boolean;
  onToggleTranslation: () => void;
}

export const TranslationExercise: React.FC<TranslationExerciseProps> = ({
  exercise,
  userResponse,
  onResponseChange,
  showResult,
  isCorrect,
  loading,
  onPlayAudio,
  audioLoading = false,
  onSubmit,
  onNext,
  showTranslation,
  onToggleTranslation
}) => {
  const isMobile = useIsMobile();
  const { settings } = useUserSettingsContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userResponse.trim()) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showResult) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Get language display name
  const getLanguageDisplayName = (language: string) => {
    const languageNames: Record<string, string> = {
      'german': 'German',
      'spanish': 'Spanish', 
      'french': 'French',
      'english': 'English'
    };
    return languageNames[language] || language;
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
        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Sentence in target language */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-base leading-relaxed text-center">
              {exercise.sentence}
            </p>
          </div>
          
          {/* Instructions */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Translate this {getLanguageDisplayName(settings.selectedLanguage)} sentence to English:
            </p>
          </div>
          
          {/* Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={userResponse}
              onChange={(e) => onResponseChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your English translation..."
              disabled={showResult}
              className={`text-base ${showResult
                ? isCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                : ''
              }`}
              autoFocus
            />
            
            {!showResult && (
              <Button
                type="submit"
                disabled={!userResponse.trim() || loading}
                className="w-full"
              >
                {loading ? 'Checking...' : 'Submit Translation'}
              </Button>
            )}
          </form>

          {/* Result */}
          {showResult && (
            <div className="space-y-4">
              <div className={`text-center text-lg font-semibold ${
                isCorrect ? 'text-green-600' : 'text-red-600'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-6 w-6" />
                      Excellent!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6" />
                      Not quite right
                    </>
                  )}
                </div>
              </div>

              {!isCorrect && exercise.translation && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Correct English translation:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {exercise.translation}
                  </p>
                </div>
              )}

              {exercise.explanation && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Explanation:
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {exercise.explanation}
                  </p>
                </div>
              )}

              <Button onClick={onNext} className="w-full">
                Next Exercise
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg">Translation Exercise</CardTitle>
          <div className="flex items-center gap-2 justify-start md:justify-end">
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
        <div className="space-y-6">
          {/* Sentence Display in target language */}
          <div className="p-4 md:p-6 bg-muted rounded-lg">
            <p className="text-lg md:text-xl leading-relaxed text-center">
              {exercise.sentence}
            </p>
          </div>

          {/* Instructions */}
          <div className="text-center">
            <p className="text-base font-medium mb-4">
              Translate this {getLanguageDisplayName(settings.selectedLanguage)} sentence to English:
            </p>
          </div>

          {/* Translation Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={userResponse}
              onChange={(e) => onResponseChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your English translation..."
              disabled={showResult}
              className={`text-lg py-3 ${showResult
                ? isCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                : ''
              }`}
              autoFocus
            />
            
            {!showResult && (
              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={!userResponse.trim() || loading}
                  size="lg"
                  className="px-8 transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  {loading ? 'Checking...' : 'Submit Translation'}
                </Button>
              </div>
            )}
          </form>

          {/* Translation Hint Toggle */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTranslation}
              className="transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {showTranslation ? 'Hide' : 'Show'} English Hint
            </Button>
          </div>

          {/* Translation Hint - Always in English */}
          {showTranslation && exercise.translation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                English hint:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {exercise.translation}
              </p>
            </div>
          )}

          {/* Result Display */}
          {showResult && (
            <div className="text-center space-y-4">
              <div className={`flex items-center justify-center gap-2 text-lg font-semibold ${
                isCorrect ? 'text-green-600' : 'text-red-600'
              }`}>
                {isCorrect ? (
                  <>
                    <CheckCircle className="h-6 w-6" />
                    Excellent Translation!
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6" />
                    Not quite right
                  </>
                )}
              </div>

              {!isCorrect && exercise.translation && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Correct English translation:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {exercise.translation}
                  </p>
                </div>
              )}

              {exercise.explanation && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Explanation:
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {exercise.explanation}
                  </p>
                </div>
              )}
              
              <Button
                onClick={onNext}
                size="lg"
                className="px-8 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                Next Exercise
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
