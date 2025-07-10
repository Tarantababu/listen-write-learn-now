
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, BookOpen } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

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
  const { settings } = useUserSettingsContext();

  // Split sentence into words for selection
  const words = exercise.sentence.split(/\s+/).filter(word => word.length > 0);

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

  const getWordClassName = (word: string) => {
    const isSelected = isWordSelected(word);
    
    if (showResult) {
      // In result mode, show selected words as marked for learning
      return isSelected 
        ? 'bg-blue-200 text-blue-800 border-blue-500' 
        : 'hover:bg-gray-100';
    } else {
      // In selection mode, show selected state
      return isSelected 
        ? 'bg-primary text-primary-foreground border-primary' 
        : 'hover:bg-muted/50 border-border';
    }
  };

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
              Tap on the {getLanguageDisplayName(settings.selectedLanguage)} words you don't know or want to learn:
            </p>
          </div>
          
          {/* Interactive Sentence in target language */}
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

          {/* English Translation Display */}
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

          {/* Submit Button */}
          {!showResult && (
            <Button
              onClick={onSubmit}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Saving...' : 'Mark Words for Learning'}
            </Button>
          )}

          {/* Result */}
          {showResult && (
            <div className="space-y-4">
              <div className="text-center text-lg font-semibold text-blue-600">
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Words marked for learning!
                </div>
              </div>

              {selectedWords.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Words marked for learning:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedWords.join(', ')}
                  </p>
                </div>
              )}

              {selectedWords.length === 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    No words selected - that's okay! You can move on to the next exercise.
                  </p>
                </div>
              )}

              {exercise.explanation && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Learning tip:
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
              Click on the {getLanguageDisplayName(settings.selectedLanguage)} words you don't know or want to learn:
            </p>
          </div>

          {/* Interactive Sentence in target language */}
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
              {showTranslation ? 'Hide' : 'Show'} English Translation
            </Button>
          </div>

          {/* English Translation Display */}
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

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {!showResult ? (
              <Button
                onClick={onSubmit}
                disabled={loading}
                size="lg"
                className="px-8 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {loading ? 'Saving...' : 'Mark Words for Learning'}
              </Button>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-lg font-semibold text-blue-600">
                  <BookOpen className="h-6 w-6" />
                  Words marked for learning!
                </div>

                {selectedWords.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-md mx-auto">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Words marked for learning:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {selectedWords.join(', ')}
                    </p>
                  </div>
                )}

                {selectedWords.length === 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      No words selected - that's okay! You can move on to the next exercise.
                    </p>
                  </div>
                )}

                {exercise.explanation && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Learning tip:
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
