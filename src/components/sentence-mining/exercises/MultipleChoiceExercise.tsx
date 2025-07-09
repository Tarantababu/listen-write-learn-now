
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, Check, X, ArrowRight } from 'lucide-react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface MultipleChoiceExerciseProps {
  exercise: SentenceMiningExercise;
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  showTranslation?: boolean;
  onToggleTranslation?: () => void;
  onSubmit: () => void;
  onNext: () => void;
}

export const MultipleChoiceExercise: React.FC<MultipleChoiceExerciseProps> = ({
  exercise,
  showResult,
  isCorrect,
  loading,
  onPlayAudio,
  audioLoading = false,
  showTranslation = false,
  onToggleTranslation,
  onSubmit,
  onNext
}) => {
  const { settings } = useUserSettingsContext();
  const isMobile = useIsMobile();
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [translationCache, setTranslationCache] = useState<Record<string, string>>({});
  const [loadingTranslation, setLoadingTranslation] = useState<Record<string, boolean>>({});

  const getShortTranslationFromOpenAI = async (word: string, language: string): Promise<string> => {
    const cacheKey = `${word}-${language}-short`;
    
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    if (loadingTranslation[cacheKey]) {
      return 'loading...';
    }

    try {
      setLoadingTranslation(prev => ({ ...prev, [cacheKey]: true }));
      
      const { data, error } = await supabase.functions.invoke('generate-vocabulary-info', {
        body: {
          text: word,
          language: language,
          requestShort: true
        }
      });

      if (error) throw error;

      const fullTranslation = data?.definition || 'translation unavailable';
      const shortTranslation = extractShortTranslation(fullTranslation);
      
      setTranslationCache(prev => ({ ...prev, [cacheKey]: shortTranslation }));
      
      return shortTranslation;
    } catch (error) {
      console.error('Error getting translation:', error);
      return 'translation unavailable';
    } finally {
      setLoadingTranslation(prev => ({ ...prev, [cacheKey]: false }));
    }
  };

  const extractShortTranslation = (fullTranslation: string): string => {
    const cleaned = fullTranslation
      .replace(/^(A |An |The |To )/i, '')
      .replace(/\(.*?\)/g, '')
      .replace(/;.*$/g, '')
      .replace(/,.*$/g, '')
      .trim();
    
    const words = cleaned.split(' ').filter(word => 
      word.length > 2 && 
      !['that', 'which', 'with', 'from', 'into', 'onto', 'upon'].includes(word.toLowerCase())
    );
    
    return words.slice(0, 2).join(' ') || cleaned.split(' ').slice(0, 2).join(' ');
  };

  const renderSentenceWithBlank = (sentence: string, targetWords: string[]) => {
    // Use the first target word for multiple choice exercises
    const targetWord = targetWords[0] || '';
    const parts = sentence.split(new RegExp(`\\b${targetWord}\\b`, 'gi'));
    const result = [];
    
    parts.forEach((part, index) => {
      result.push(part);
      if (index < parts.length - 1) {
        result.push(
          <span key={index} className="inline-block mx-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded text-blue-600 dark:text-blue-400 font-medium">
            ___
          </span>
        );
      }
    });
    
    return result;
  };

  const handleOptionSelect = (option: string) => {
    if (!showResult) {
      setSelectedOption(option);
    }
  };

  const handleSubmit = () => {
    if (selectedOption) {
      onSubmit();
    }
  };

  const getOptionStatus = (option: string) => {
    if (!showResult) return 'default';
    
    const correctAnswer = exercise.correctAnswer || exercise.targetWords[0];
    if (option === correctAnswer) return 'correct';
    if (option === selectedOption && option !== correctAnswer) return 'incorrect';
    return 'default';
  };

  // Mobile layout
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
              <span className="text-sm font-medium">Multiple Choice</span>
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
          {/* Sentence with blank */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-base leading-relaxed text-center">
              {renderSentenceWithBlank(exercise.sentence, exercise.targetWords)}
            </p>
          </div>

          {/* Translation hint */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                English hint:
              </p>
              <TranslationHint 
                word={exercise.targetWords[0] || ''} 
                language={settings.selectedLanguage}
                getTranslation={getShortTranslationFromOpenAI}
              />
            </div>
          </div>

          {/* Multiple Choice Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-center">Choose the correct word:</p>
            {exercise.multipleChoiceOptions?.map((option, index) => {
              const status = getOptionStatus(option);
              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  disabled={showResult}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    status === 'correct'
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                      : status === 'incorrect'
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                      : selectedOption === option
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {showResult && status === 'correct' && (
                      <Check className="h-5 w-5 text-green-600" />
                    )}
                    {showResult && status === 'incorrect' && (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Submit/Next Button */}
          <div className="pt-4">
            {!showResult ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedOption || loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Checking...' : 'Submit Answer'}
              </Button>
            ) : (
              <div className="space-y-4">
                {exercise.explanation && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>Explanation:</strong> {exercise.explanation}
                    </p>
                  </div>
                )}
                <Button onClick={onNext} className="w-full" size="lg">
                  Next Exercise <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg">Multiple Choice</CardTitle>
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
          <div className="p-4 md:p-6 bg-muted rounded-lg">
            <p className="text-lg md:text-xl leading-relaxed">
              {renderSentenceWithBlank(exercise.sentence, exercise.targetWords)}
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  English hint:
                </p>
                <TranslationHint 
                  word={exercise.targetWords[0] || ''} 
                  language={settings.selectedLanguage}
                  getTranslation={getShortTranslationFromOpenAI}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-center">Choose the correct word:</p>
            <div className="grid gap-3">
              {exercise.multipleChoiceOptions?.map((option, index) => {
                const status = getOptionStatus(option);
                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(option)}
                    disabled={showResult}
                    className={`p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      status === 'correct'
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                        : status === 'incorrect'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                        : selectedOption === option
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {showResult && status === 'correct' && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                      {showResult && status === 'incorrect' && (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4">
            {!showResult ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedOption || loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Checking...' : 'Submit Answer'}
              </Button>
            ) : (
              <div className="space-y-4">
                {exercise.explanation && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>Explanation:</strong> {exercise.explanation}
                    </p>
                  </div>
                )}
                <Button onClick={onNext} className="w-full" size="lg">
                  Next Exercise <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TranslationHint: React.FC<{
  word: string;
  language: string;
  getTranslation: (word: string, language: string) => Promise<string>;
}> = ({ word, language, getTranslation }) => {
  const [translation, setTranslation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchTranslation = async () => {
      setLoading(true);
      const result = await getTranslation(word, language);
      setTranslation(result);
      setLoading(false);
    };

    fetchTranslation();
  }, [word, language, getTranslation]);

  return (
    <div className="px-4 py-2 text-base bg-white dark:bg-blue-800/50 border border-blue-300 dark:border-blue-600 rounded-lg shadow-sm">
      <div className="text-center font-medium text-blue-800 dark:text-blue-200">
        {loading ? 'loading...' : translation || 'translation unavailable'}
      </div>
    </div>
  );
};
