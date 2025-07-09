
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface SentenceDisplayProps {
  exercise: SentenceMiningExercise;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  userResponse?: string;
  onResponseChange?: (response: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
}

export const SentenceDisplay: React.FC<SentenceDisplayProps> = ({
  exercise,
  onPlayAudio,
  audioLoading = false,
  userResponse = '',
  onResponseChange,
  showResult = false,
  isCorrect = false,
}) => {
  const { settings } = useUserSettingsContext();
  const isMobile = useIsMobile();
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
    // Use the first target word for cloze exercises
    const targetWord = targetWords[0] || '';
    const parts = sentence.split(new RegExp(`\\b${targetWord}\\b`, 'gi'));
    const result = [];
    
    parts.forEach((part, index) => {
      result.push(part);
      if (index < parts.length - 1) {
        result.push(
          <div key={index} className={`inline-block relative mx-1 my-2 ${isMobile ? 'w-28' : 'w-32 md:w-40'}`}>
            <Input
              value={userResponse}
              onChange={(e) => onResponseChange?.(e.target.value)}
              disabled={showResult}
              className={`inline-block w-full text-center border-b-2 border-dashed border-primary bg-transparent ${isMobile ? 'text-sm' : 'text-base'} ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  : 'focus:ring-2 focus:ring-primary/20'
              }`}
              placeholder="___"
            />
          </div>
        );
      }
    });
    
    return result;
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
          {/* Sentence with blank in target language */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-base leading-relaxed text-center">
              {renderSentenceWithBlank(exercise.sentence, exercise.targetWords)}
            </p>
          </div>
          
          {/* English translation hint */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                English hint for missing word:
              </p>
              <TranslationHint 
                word={exercise.targetWords[0] || ''} 
                language={settings.selectedLanguage}
                getTranslation={getShortTranslationFromOpenAI}
              />
            </div>
          </div>
          
          {exercise.context && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                Context:
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {exercise.context}
              </p>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground text-center">
            <p>Fill in the blank with the missing word in {getLanguageDisplayName(settings.selectedLanguage)}.</p>
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
          {/* Sentence with blank in target language */}
          <div className="p-4 md:p-6 bg-muted rounded-lg">
            <p className="text-lg md:text-xl leading-relaxed">
              {renderSentenceWithBlank(exercise.sentence, exercise.targetWords)}
            </p>
          </div>
          
          {/* English hint for the missing word */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  English hint for missing word:
                </p>
                <TranslationHint 
                  word={exercise.targetWords[0] || ''} 
                  language={settings.selectedLanguage}
                  getTranslation={getShortTranslationFromOpenAI}
                />
              </div>
            </div>
          </div>
          
          {exercise.context && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                Context:
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {exercise.context}
              </p>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p>Fill in the blank with the missing word in {getLanguageDisplayName(settings.selectedLanguage)}. Use the English hint above to help you.</p>
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
