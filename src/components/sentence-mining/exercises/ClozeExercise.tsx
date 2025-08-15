import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Volume2, CheckCircle, XCircle, Lightbulb, SkipForward } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { EnhancedWordFrequencyService } from '@/services/enhancedWordFrequencyService';

interface ClozeExerciseProps {
  exercise: SentenceMiningExercise;
  userResponse: string;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  onResponseChange: (response: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  onSkip?: () => void;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  language?: string;
}

export const ClozeExercise: React.FC<ClozeExerciseProps> = ({
  exercise,
  userResponse,
  showResult,
  isCorrect,
  loading,
  onPlayAudio,
  audioLoading = false,
  onResponseChange,
  onSubmit,
  onNext,
  onSkip,
  showTranslation,
  onToggleTranslation,
  language = 'english'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get the cloze sentence or create one if not provided
  const clozeSentence = exercise.clozeSentence || generateClozeSentence(exercise.sentence, exercise.targetWord || '');
  const targetWord = exercise.targetWord || '';

  // Focus input when exercise changes or component mounts
  useEffect(() => {
    if (!showResult && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [exercise.id, showResult]);

  // Add global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Enter to submit answer or move to next exercise
      if (e.key === 'Enter') {
        // Don't interfere if user is typing in input field
        if (e.target instanceof HTMLInputElement) {
          return;
        }
        
        e.preventDefault();
        if (!showResult && userResponse.trim() && !loading) {
          onSubmit();
        } else if (showResult) {
          onNext();
        }
      }
      
      // Space to toggle translation (when not focused on input)
      if (e.key === ' ' && e.target !== document.querySelector('input[type="text"]')) {
        e.preventDefault();
        onToggleTranslation();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showResult, userResponse, loading, onSubmit, onNext, onToggleTranslation]);

  // Get the hint - prefer English meaning from service, then targetWordTranslation if it looks English
  const getEnglishMeaning = () => {
    // Get English meaning from the enhanced word frequency service
    if (exercise.targetWord && language) {
      const meaning = EnhancedWordFrequencyService.getWordMeaning(language, exercise.targetWord);
      if (meaning) {
        return meaning;
      }
    }
    
    // Fallback to targetWordTranslation only if it appears to be in English
    if (exercise.targetWordTranslation) {
      // Simple check to see if it might be English (contains common English words or is short)
      const translation = exercise.targetWordTranslation.toLowerCase();
      const englishIndicators = ['the', 'a', 'an', 'to', 'of', 'and', 'or', 'is', 'are', 'was', 'were'];
      const hasEnglishIndicators = englishIndicators.some(indicator => translation.includes(indicator));
      const isShortTranslation = translation.length < 30; // Likely to be English if short
      
      if (hasEnglishIndicators || isShortTranslation) {
        return exercise.targetWordTranslation;
      }
    }
    
    // Final fallback to hints
    if (exercise.hints && exercise.hints.length > 0) {
      return exercise.hints[0];
    }
    
    return 'Think about what word fits here';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onResponseChange(value);
  };

  const handleSubmit = () => {
    if (userResponse.trim()) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult && userResponse.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

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
        <div className="space-y-6">
          {/* Instructions */}
          <div className="text-center">
            <p className="text-base font-medium mb-4">
              Fill in the missing word in the sentence below:
            </p>
          </div>

          {/* Cloze Sentence Display */}
          <div className="p-6 md:p-8 bg-muted rounded-lg">
            <div className="text-lg md:text-xl leading-relaxed text-center">
              {renderClozeSentence(clozeSentence, userResponse, showResult, isCorrect, targetWord)}
            </div>
          </div>

          {/* Hints - now showing proper English meaning */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  English meaning:
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {getEnglishMeaning()}
                </p>
              </div>
            </div>
          </div>

          {/* Input Field */}
          {!showResult && (
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <Input
                  ref={inputRef}
                  type="text"
                  value={userResponse}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer here..."
                  className="text-center text-lg py-3"
                  disabled={loading}
                />
                <div className="text-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> to check answer
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* English Translation Toggle */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTranslation}
            >
              {showTranslation ? 'Hide' : 'Show'} Full Sentence Translation
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd> to toggle
            </p>
          </div>

          {/* English Translation Display */}
          {showTranslation && exercise.translation && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Full Sentence Translation:
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {exercise.translation}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {!showResult ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={!userResponse.trim() || loading}
                  size="lg"
                  className="px-8"
                >
                  {loading ? 'Checking...' : 'Submit Answer'}
                </Button>
                
                {onSkip && (
                  <Button
                    variant="outline"
                    onClick={onSkip}
                    disabled={loading}
                    size="lg"
                    className="px-6 flex items-center gap-2"
                  >
                    <SkipForward className="h-4 w-4" />
                    Skip
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className={`flex items-center justify-center gap-2 text-lg font-semibold ${
                  isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-6 w-6" />
                      Correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6" />
                      Incorrect
                    </>
                  )}
                </div>
                
                {!isCorrect && targetWord && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Correct answer:
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {targetWord}
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Button
                    onClick={onNext}
                    size="lg"
                    className="px-8"
                  >
                    Next Exercise
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> to continue
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to generate a cloze sentence
function generateClozeSentence(sentence: string, targetWord: string): string {
  if (!targetWord || !sentence) return sentence;
  
  const words = sentence.split(' ');
  const targetIndex = words.findIndex(word => 
    word.toLowerCase().includes(targetWord.toLowerCase())
  );
  
  if (targetIndex !== -1) {
    words[targetIndex] = '___';
  }
  
  return words.join(' ');
}

function renderClozeSentence(
  clozeSentence: string, 
  userResponse: string, 
  showResult: boolean, 
  isCorrect: boolean,
  targetWord: string
) {
  if (!showResult) {
    // Before submission, show the blank
    return clozeSentence;
  }
  
  // After submission, show the user's answer with appropriate styling
  const filledSentence = clozeSentence.replace('___', userResponse || '___');
  const parts = filledSentence.split(userResponse || '___');
  
  if (parts.length === 2 && userResponse) {
    return (
      <>
        {parts[0]}
        <span className={`px-2 py-1 rounded font-semibold ${
          isCorrect 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {userResponse}
        </span>
        {parts[1]}
      </>
    );
  }
  
  return filledSentence;
}
