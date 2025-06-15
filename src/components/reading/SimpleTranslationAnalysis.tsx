
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Languages, ArrowRight, AlertTriangle } from 'lucide-react';
import { LanguageSelectWithFlag } from '@/components/bidirectional/LanguageSelectWithFlag';
import { simpleTranslationService } from '@/services/simpleTranslationService';
import { toast } from 'sonner';

interface SimpleTranslationAnalysisProps {
  text: string;
  sourceLanguage: string;
  onClose: () => void;
}

interface WordTranslation {
  original: string;
  translation: string;
}

interface SimpleTranslationResult {
  normalTranslation: string;
  literalTranslation: string;
  wordTranslations: WordTranslation[];
}

export const SimpleTranslationAnalysis: React.FC<SimpleTranslationAnalysisProps> = ({
  text,
  sourceLanguage,
  onClose
}) => {
  const [targetLanguage, setTargetLanguage] = useState('english');
  const [translation, setTranslation] = useState<SimpleTranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'italian', label: 'Italian' },
    { value: 'portuguese', label: 'Portuguese' },
    { value: 'dutch', label: 'Dutch' },
    { value: 'turkish', label: 'Turkish' },
    { value: 'swedish', label: 'Swedish' },
    { value: 'norwegian', label: 'Norwegian' }
  ];

  const handleTranslate = async () => {
    if (!text.trim()) {
      toast.error('No text to translate');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranslation(null);
    
    try {
      console.log('Starting translation:', {
        textLength: text.length,
        sourceLanguage,
        targetLanguage
      });

      const result = await simpleTranslationService.translateText(
        text,
        sourceLanguage,
        targetLanguage
      );

      console.log('Translation completed successfully');
      setTranslation(result);
      toast.success('Translation completed successfully');
      
    } catch (error) {
      console.error('Translation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      setError(errorMessage);
      toast.error('Translation failed', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguageLabel = (langCode: string) => {
    const option = languageOptions.find(opt => opt.value === langCode);
    return option ? option.label : langCode;
  };

  const getTextComplexity = (text: string) => {
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 50) return { level: 'Simple', color: 'text-green-600' };
    if (wordCount < 150) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Complex', color: 'text-orange-600' };
  };

  const complexity = getTextComplexity(text);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Translation Analysis</h3>
          <Badge variant="outline" className={complexity.color}>
            {complexity.level}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      <Separator />

      {/* Language Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Badge variant="outline">{getLanguageLabel(sourceLanguage)}</Badge>
          <ArrowRight className="h-4 w-4" />
          <div className="flex-1">
            <LanguageSelectWithFlag
              value={targetLanguage}
              onValueChange={setTargetLanguage}
              options={languageOptions.filter(opt => opt.value !== sourceLanguage)}
              placeholder="Select target language"
              className="w-full"
            />
          </div>
        </div>

        <Button 
          onClick={handleTranslate} 
          disabled={isLoading || !targetLanguage}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Languages className="h-4 w-4 mr-2" />
              Translate
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-red-800 font-medium">Translation Error</p>
              <p className="text-red-700 text-sm">{error}</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleTranslate}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Translation Results */}
      {translation && (
        <div className="space-y-4">
          <Separator />
          
          {/* Natural Translation */}
          <Card className="p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Natural Translation:</h4>
            <p className="text-gray-900 leading-relaxed">{translation.normalTranslation}</p>
          </Card>

          {/* Literal Translation */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-medium text-sm text-blue-800 mb-2">Literal Translation:</h4>
            <p className="text-blue-900 leading-relaxed">{translation.literalTranslation}</p>
          </Card>

          {/* Word-by-word Analysis */}
          <Card className="p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-3">Word-by-word breakdown:</h4>
            {translation.wordTranslations && translation.wordTranslations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {translation.wordTranslations.map((wordPair, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                    <div className="text-sm font-medium text-gray-900">{wordPair.original}</div>
                    <div className="text-xs text-gray-600 mt-1">{wordPair.translation}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                Word-by-word breakdown not available
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
