
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
  onWordToggle: (word: string) => void;
  showResult: boolean;
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
  onWordToggle,
  showResult,
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

  // Split sentence into words for marking
  const words = exercise.sentence.split(/(\s+|[.,!?;:])/).filter(word => word.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
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
              <span className="text-sm font-medium">Mark Unknown Words</span>
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
          {/* Sentence with clickable words */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-base leading-relaxed text-center">
              {words.map((word, index) => {
                const cleanWord = word.replace(/[.,!?;:]/g, '');
                const isPunctuation = /^[.,!?;:\s]+$/.test(word);
                const isSelected = selectedWords.includes(cleanWord);
                
                if (isPunctuation || word.trim().length === 0) {
                  return <span key={index}>{word}</span>;
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => !showResult && onWordToggle(cleanWord)}
                    disabled={showResult}
                    className={`inline-block mx-0.5 px-1 py-0.5 rounded transition-colors ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-blue-100 dark:hover:bg-blue-900'
                    } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {word}
                  </button>
                );
              })}
            </p>
          </div>
          
          {/* Instructions */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Tap on words you don't know in this {getLanguageDisplayName(settings.selectedLanguage)} sentence:
            </p>
          </div>
          
          {/* Translation toggle */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTranslation}
              className="text-xs"
            >
              {showTranslation ? 'Hide' : 'Show'} English Translation
            </Button>
          </div>

          {/* Translation display */}
          {showTranslation && exercise.translation && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                English Translation:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {exercise.translation}
              </p>
            </div>
          )}

          {/* Selected words display */}
          {selectedWords.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Words marked for learning:
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedWords.map((word, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {word}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Submit/Next button */}
          {!showResult ? (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Saving...' : 'Mark Words for Learning'}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="text-center text-lg font-semibold text-green-600">
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Words Marked for Learning!
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300 text-center">
                  These words have been added to your vocabulary for review.
                </p>
              </div>

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
          <CardTitle className="text-lg">Mark Unknown Words</CardTitle>
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
          {/* Sentence with clickable words */}
          <div className="p-4 md:p-6 bg-muted rounded-lg">
            <p className="text-lg md:text-xl leading-relaxed">
              {words.map((word, index) => {
                const cleanWord = word.replace(/[.,!?;:]/g, '');
                const isPunctuation = /^[.,!?;:\s]+$/.test(word);
                const isSelected = selectedWords.includes(cleanWord);
                
                if (isPunctuation || word.trim().length === 0) {
                  return <span key={index}>{word}</span>;
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => !showResult && onWordToggle(cleanWord)}
                    disabled={showResult}
                    className={`inline-block mx-1 px-2 py-1 rounded transition-colors ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-blue-100 dark:hover:bg-blue-900'
                    } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {word}
                  </button>
                );
              })}
            </p>
          </div>

          {/* Instructions */}
          <div className="text-center">
            <p className="text-base font-medium mb-4">
              Click on words you don't know in this {getLanguageDisplayName(settings.selectedLanguage)} sentence:
            </p>
          </div>

          {/* Translation toggle */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTranslation}
            >
              {showTranslation ? 'Hide' : 'Show'} English Translation
            </Button>
          </div>

          {/* Translation display */}
          {showTranslation && exercise.translation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                English Translation:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {exercise.translation}
              </p>
            </div>
          )}

          {/* Selected words display */}
          {selectedWords.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Words marked for learning:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedWords.map((word, index) => (
                  <Badge key={index} variant="secondary">
                    {word}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Submit/Next button */}
          {!showResult ? (
            <div className="flex justify-center">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                size="lg"
                className="px-8 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {loading ? 'Saving...' : 'Mark Words for Learning'}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold text-green-600">
                <BookOpen className="h-6 w-6" />
                Words Marked for Learning!
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  These words have been added to your vocabulary for review.
                </p>
              </div>
              
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
