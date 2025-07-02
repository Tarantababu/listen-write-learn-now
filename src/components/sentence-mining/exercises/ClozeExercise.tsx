import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Volume2, CheckCircle, XCircle, Eye, ArrowRight, Loader2, Keyboard, Lightbulb } from 'lucide-react';

// Mock types for demonstration
interface SentenceMiningExercise {
  clozeSentence: string;
  sentence: string;
  targetWord: string;
  targetWordTranslation?: string;
  translation?: string;
  explanation?: string;
  difficulty: string;
}

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

// Simulated translation function - replace this with your actual OpenAI integration
const getTranslation = async (text: string, targetLang: string = 'en'): Promise<string> => {
  // This is where you would call your existing OpenAI integration
  // For demonstration, I'm providing mock translations
  const mockTranslations: { [key: string]: string } = {
    'casa': 'house',
    'perro': 'dog',
    'gato': 'cat',
    'agua': 'water',
    'comida': 'food',
  };
  
  // Return mock translation or fallback
  return mockTranslations[text.toLowerCase()] || `${text} (translation)`;
};

// Enhanced exercise processor that ensures translations are available
const processExerciseWithTranslations = async (exercise: SentenceMiningExercise): Promise<SentenceMiningExercise> => {
  const processedExercise = { ...exercise };
  
  try {
    // Get target word translation if not available
    if (!processedExercise.targetWordTranslation) {
      processedExercise.targetWordTranslation = await getTranslation(processedExercise.targetWord);
    }
    
    // Get sentence translation if not available
    if (!processedExercise.translation) {
      processedExercise.translation = await getTranslation(processedExercise.sentence);
    }
  } catch (error) {
    console.error('Translation error:', error);
    // Provide fallback translations
    processedExercise.targetWordTranslation = processedExercise.targetWordTranslation || 'translation not available';
    processedExercise.translation = processedExercise.translation || 'translation not available';
  }
  
  return processedExercise;
};

export const ClozeExercise: React.FC<ClozeExerciseProps> = ({
  exercise: rawExercise,
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
  const [exercise, setExercise] = useState<SentenceMiningExercise>(rawExercise);
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [buttonState, setButtonState] = useState<'idle' | 'processing'>('idle');
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Process exercise with translations when component mounts or exercise changes
  useEffect(() => {
    const loadTranslations = async () => {
      if (!exercise.targetWordTranslation || !exercise.translation) {
        setTranslationsLoading(true);
        try {
          const processedExercise = await processExerciseWithTranslations(rawExercise);
          setExercise(processedExercise);
        } catch (error) {
          console.error('Failed to load translations:', error);
        } finally {
          setTranslationsLoading(false);
        }
      }
    };

    loadTranslations();
  }, [rawExercise]);

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
    // Show/hide hint on Ctrl+H or Cmd+H
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
    // Create a cloze sentence by replacing the target word with a blank (5 underscores)
    let clozeSentence = exercise.clozeSentence;
    
    // If clozeSentence doesn't have the blank placeholder, create it
    if (!clozeSentence || !clozeSentence.includes('_____')) {
      // Use the regular sentence and replace the target word with blanks
      clozeSentence = exercise.sentence.replace(
        new RegExp(`\\b${exercise.targetWord}\\b`, 'gi'), 
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
            new RegExp(`\\b${exercise.targetWord}\\b`, 'gi'), 
            '_____'
          )}</p>
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
          </div>
        </div>
      </div>
    );
  };

  // Render hints separately - now shows target word translation when hint is shown
  const renderHints = () => {
    if (!showHint) return null;
    
    return (
      <div className="flex flex-col items-center gap-2 mt-3">
        {/* Show translation of the target word */}
        <div className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border border-blue-200 dark:border-blue-700 rounded-full text-xs font-medium text-blue-800 dark:text-blue-200 whitespace-nowrap shadow-sm">
          <span className="flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3" />
            Missing word: {exercise.targetWord} (English: {
              translationsLoading ? 'loading...' : (exercise.targetWordTranslation || 'translation not available')
            })
          </span>
        </div>
        
        {/* Show full sentence explanation if available */}
        {exercise.explanation && (
          <div className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 border border-amber-200 dark:border-amber-700 rounded-full text-xs font-medium text-amber-800 dark:text-amber-200 whitespace-nowrap shadow-sm max-w-xs">
            <span className="block truncate">
              💡 {exercise.explanation}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render English translation of correct answer
  const renderCorrectAnswerTranslation = () => {
    if (!showResult || isCorrect || (!exercise.translation && !translationsLoading)) return null;
    
    return (
      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg mt-3">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
          English Translation:
        </p>
        <p className="text-blue-700 dark:text-blue-300 text-sm">
          {translationsLoading ? 'Loading translation...' : (exercise.translation || 'translation not available')}
        </p>
      </div>
    );
  };

  // Render full sentence translation when toggled
  const renderSentenceTranslation = () => {
    if (!showTranslation) return null;
    
    return (
      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg mt-3">
        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
          Sentence Translation:
        </p>
        <p className="text-green-700 dark:text-green-300 text-sm">
          {translationsLoading ? 'Loading translation...' : (exercise.translation || 'translation not available')}
        </p>
      </div>
    );
  };

  // Desktop layout (simplified for demo)
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
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
              {renderHints()}
            </div>
            
            {/* Translation display */}
            {renderSentenceTranslation()}
            
            {/* Hints Section */}
            <div className="text-center space-y-3">
              {/* Always show the Extra Hint button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Lightbulb className="h-4 w-4" />
                {showHint ? 'Hide Extra Hint' : 'Show Extra Hint'}
              </Button>

              {/* Translation toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleTranslation}
                className="flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95 ml-2"
              >
                <Eye className="h-4 w-4" />
                {showTranslation ? 'Hide sentence translation' : 'Show sentence translation'}
              </Button>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Keyboard className="h-3 w-3" />
              <span>Enter: submit • Ctrl+T: translation • Ctrl+H: hint</span>
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
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {exercise.targetWord}
                  </p>
                </div>
              )}

              {/* Added English translation of correct answer */}
              {renderCorrectAnswerTranslation()}

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