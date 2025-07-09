
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { useIsMobile } from '@/hooks/use-mobile';

interface VocabularyMarkingExerciseProps {
  exercise: SentenceMiningExercise;
  selectedWords: string[];
  onWordSelect: (word: string) => void;
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

export const VocabularyMarkingExercise: React.FC<VocabularyMarkingExerciseProps> = ({
  exercise,
  selectedWords,
  onWordSelect,
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

  // Split sentence into words for selection
  const words = exercise.sentence.split(/\s+/).filter(word => word.length > 0);
  
  // Get target words (words that should be selected)
  const targetWords = exercise.targetWords || [];

  const handleWordClick = (word: string) => {
    if (showResult) return;
    // Clean the word of punctuation for comparison
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    onWordSelect(cleanWord);
  };

  const isWordSelected = (word: string) => {
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    return selectedWords.includes(cleanWord);
  };

  const isWordTarget = (word: string) => {
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    return targetWords.some(target => target.toLowerCase() === cleanWord);
  };

  const getWordClassName = (word: string) => {
    const isSelected = isWordSelected(word);
    const isTarget = isWordTarget(word);
    
    if (showResult) {
      if (isTarget && isSelected) {
        return 'bg-green-200 text-green-800 border-green-500'; // Correct selection
      } else if (isTarget && !isSelected) {
        return 'bg-yellow-200 text-yellow-800 border-yellow-500'; // Missed target
      } else if (!isTarget && isSelected) {
        return 'bg-red-200 text-red-800 border-red-500'; // Wrong selection
      } else {
        return 'hover:bg-gray-100'; // Normal word
      }
    } else {
      return isSelected 
        ? 'bg-primary text-primary-foreground border-primary' 
        : 'hover:bg-muted/50 border-border';
    }
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
              <span className="text-sm font-medium">Mark Words</span>
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
          {/* Instructions */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Tap on the words you don't know or want to learn:
            </p>
          </div>
          
          {/* Interactive Sentence */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex flex-wrap gap-2 text-base leading-relaxed justify-center">
              {words.map((word, index) => (
                <button
                  key={index}
                  onClick={() => handleWordClick(word)}
                  disabled={showResult}
                  className={`px-2 py-1 rounded border-2 transition-all duration-200 ${getWordClassName(word)} ${
                    showResult ? 'cursor-default' : 'cursor-pointer active:scale-95'
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Words Counter */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Selected words: {selectedWords.length}
            </p>
          </div>

          {/* Submit Button */}
          {!showResult && (
            <Button
              onClick={onSubmit}
              disabled={selectedWords.length === 0 || loading}
              className="w-full"
            >
              {loading ? 'Checking...' : 'Submit Selection'}
            </Button>
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
                      Great job!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6" />
                      Good try!
                    </>
                  )}
                </div>
              </div>

              {/* Color Legend */}
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 border border-green-500 rounded"></div>
                  <span>Correctly identified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-200 border border-yellow-500 rounded"></div>
                  <span>Target words you missed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 border border-red-500 rounded"></div>
                  <span>Incorrectly selected</span>
                </div>
              </div>

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
          <CardTitle className="text-lg">Vocabulary Marking</CardTitle>
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
          {/* Instructions */}
          <div className="text-center">
            <p className="text-base font-medium mb-4">
              Click on the words you don't know or want to learn:
            </p>
          </div>

          {/* Interactive Sentence */}
          <div className="p-4 md:p-6 bg-muted rounded-lg">
            <div className="flex flex-wrap gap-2 text-lg md:text-xl leading-relaxed justify-center">
              {words.map((word, index) => (
                <button
                  key={index}
                  onClick={() => handleWordClick(word)}
                  disabled={showResult}
                  className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 ${getWordClassName(word)} ${
                    showResult ? 'cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95'
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Words Counter */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Selected words: {selectedWords.length}
            </p>
          </div>

          {/* Translation Toggle */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTranslation}
              className="transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {showTranslation ? 'Hide' : 'Show'} Translation
            </Button>
          </div>

          {/* Translation Display */}
          {showTranslation && exercise.translation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Translation:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {exercise.translation}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {!showResult ? (
              <Button
                onClick={onSubmit}
                disabled={selectedWords.length === 0 || loading}
                size="lg"
                className="px-8 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {loading ? 'Checking...' : 'Submit Selection'}
              </Button>
            ) : (
              <div className="text-center space-y-4">
                <div className={`flex items-center justify-center gap-2 text-lg font-semibold ${
                  isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-6 w-6" />
                      Excellent selection!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6" />
                      Good effort! Check the highlighted words.
                    </>
                  )}
                </div>

                {/* Color Legend */}
                <div className="text-sm space-y-2 max-w-md mx-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-200 border border-green-500 rounded"></div>
                    <span>Correctly identified target words</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-200 border border-yellow-500 rounded"></div>
                    <span>Target words you missed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-200 border border-red-500 rounded"></div>
                    <span>Words incorrectly selected</span>
                  </div>
                </div>

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
        </div>
      </CardContent>
    </Card>
  );
};
