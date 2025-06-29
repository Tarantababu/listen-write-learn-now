
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';

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
          requestShort: true // Request short translation
        }
      });

      if (error) throw error;

      // Extract just 1-2 key words from the definition
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
    // Remove common prefixes and extract key words
    const cleaned = fullTranslation
      .replace(/^(A |An |The |To )/i, '')
      .replace(/\(.*?\)/g, '') // Remove parentheses
      .replace(/;.*$/g, '') // Remove everything after semicolon
      .replace(/,.*$/g, '') // Remove everything after first comma
      .trim();
    
    // Get first 1-2 significant words
    const words = cleaned.split(' ').filter(word => 
      word.length > 2 && 
      !['that', 'which', 'with', 'from', 'into', 'onto', 'upon'].includes(word.toLowerCase())
    );
    
    return words.slice(0, 2).join(' ') || cleaned.split(' ').slice(0, 2).join(' ');
  };

  const renderSentenceWithBlank = (sentence: string, targetWord: string) => {
    // For cloze exercises, show the English sentence with a blank for the target language word
    const parts = sentence.split(new RegExp(`\\b${targetWord}\\b`, 'gi'));
    const result = [];
    
    parts.forEach((part, index) => {
      result.push(part);
      if (index < parts.length - 1) {
        result.push(
          <div key={index} className="inline-block relative mx-1 my-2">
            <Input
              value={userResponse}
              onChange={(e) => onResponseChange?.(e.target.value)}
              disabled={showResult}
              className={`inline-block w-32 md:w-40 text-center border-b-2 border-dashed border-primary bg-transparent text-base ${
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
          <div className="p-4 md:p-6 bg-muted rounded-lg">
            <p className="text-lg md:text-xl leading-relaxed">
              {renderSentenceWithBlank(exercise.sentence, exercise.targetWord)}
            </p>
          </div>
          
          {/* Translation hint moved to separate section */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  English hint:
                </p>
                <TranslationHint 
                  word={exercise.targetWord} 
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
            <p>Fill in the blank with the missing word in {settings.selectedLanguage}. Use the English hint above to help you.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Separate component for translation hint to manage its own state
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
