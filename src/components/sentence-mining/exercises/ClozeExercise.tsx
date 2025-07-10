
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { compareTexts } from '@/utils/textComparison';

interface ClozeExerciseProps {
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

export const ClozeExercise: React.FC<ClozeExerciseProps> = ({
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
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  // Get target words for the blank
  const targetWords = exercise.targetWords || [];
  const targetWord = targetWords[0] || '';

  // Create cloze sentence by replacing target word with blank
  const createClozeSentence = (sentence: string, word: string) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return sentence.replace(regex, '___');
  };

  const clozeSentence = createClozeSentence(exercise.sentence, targetWord);

  // Enhanced answer checking with fuzzy matching
  useEffect(() => {
    if (showResult && userResponse) {
      const result = compareTexts(targetWord, userResponse);
      setComparisonResult(result);
    }
  }, [showResult, userResponse, targetWord]);

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
              <span className="text-sm font-medium">Complete Sentence</span>
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
          {/* Cloze sentence */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-base leading-relaxed text-center font-medium">
              {clozeSentence}
            </p>
          </div>
          
          {/* Instructions */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Fill in the blank with the missing {getLanguageDisplayName(settings.selectedLanguage)} word:
            </p>
          </div>
          
          {/* Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={userResponse}
              onChange={(e) => onResponseChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter the missing word..."
              disabled={showResult}
              className={`text-base text-center ${showResult
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
                {loading ? 'Checking...' : 'Submit Answer'}
              </Button>
            )}
          </form>

          {/* Translation Toggle */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTranslation}
              className="transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {showTranslation ? 'Hide' : 'Show'} English Translation
            </Button>
          </div>

          {/* Translation Display */}
          {showTranslation && exercise.translation && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                English translation:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {exercise.translation}
              </p>
            </div>
          )}

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

              {/* Enhanced feedback with comparison details */}
              {comparisonResult && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Correct answer:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                      {targetWord}
                    </p>
                  </div>

                  {comparisonResult.accuracy < 100 && comparisonResult.accuracy > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Your answer was {comparisonResult.accuracy}% similar
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Keep practicing! You're getting close.
                      </p>
                    </div>
                  )}
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
          <CardTitle className="text-lg">Complete the Sentence</CardTitle>
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
          {/* Cloze Sentence Display */}
          <div className="p-4 md:p-6 bg-muted rounded-lg">
            <p className="text-lg md:text-xl leading-relaxed text-center font-medium">
              {clozeSentence}
            </p>
          </div>

          {/* Instructions */}
          <div className="text-center">
            <p className="text-base font-medium mb-4">
              Fill in the blank with the missing {getLanguageDisplayName(settings.selectedLanguage)} word:
            </p>
          </div>

          {/* Answer Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={userResponse}
              onChange={(e) => onResponseChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter the missing word..."
              disabled={showResult}
              className={`text-lg py-3 text-center ${showResult
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
                  {loading ? 'Checking...' : 'Submit Answer'}
                </Button>
              </div>
            )}
          </form>

          {/* Translation Toggle */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTranslation}
              className="transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {showTranslation ? 'Hide' : 'Show'} English Translation
            </Button>
          </div>

          {/* Translation Display */}
          {showTranslation && exercise.translation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                English translation:
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
                    Perfect!
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6" />
                    Not quite right
                  </>
                )}
              </div>

              {/* Enhanced feedback */}
              {comparisonResult && (
                <div className="space-y-3 max-w-md mx-auto">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Correct answer:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                      {targetWord}
                    </p>
                  </div>

                  {comparisonResult.accuracy < 100 && comparisonResult.accuracy > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                        Your answer was {comparisonResult.accuracy}% similar
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Keep practicing! You're getting close.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {exercise.explanation && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg max-w-md mx-auto">
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
