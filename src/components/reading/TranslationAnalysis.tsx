
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Languages, ArrowRight } from 'lucide-react';
import { LanguageSelectWithFlag } from '@/components/bidirectional/LanguageSelectWithFlag';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TranslationAnalysisProps {
  text: string;
  sourceLanguage: string;
  onClose: () => void;
}

interface BidirectionalTranslation {
  normalTranslation: string;
  literalTranslation: string;
}

export const TranslationAnalysis: React.FC<TranslationAnalysisProps> = ({
  text,
  sourceLanguage,
  onClose
}) => {
  const [targetLanguage, setTargetLanguage] = useState('english');
  const [translation, setTranslation] = useState<BidirectionalTranslation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error('No text to analyze');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Requesting bidirectional translation:', {
        text: text.substring(0, 50) + '...',
        sourceLanguage,
        targetLanguage
      });

      const { data, error } = await supabase.functions.invoke('generate-reading-analysis', {
        body: {
          text,
          language: sourceLanguage,
          type: 'bidirectional_translation',
          supportLanguage: targetLanguage
        }
      });

      if (error) {
        console.error('Translation error:', error);
        throw new Error(error.message || 'Failed to generate translation');
      }

      if (!data) {
        throw new Error('No translation data received');
      }

      console.log('Translation response:', data);
      setTranslation(data);
    } catch (error) {
      console.error('Error generating translation:', error);
      toast.error('Failed to generate translation');
    } finally {
      setIsLoading(false);
    }
  };

  const renderWordByWord = (originalText: string, literalTranslation: string) => {
    const originalWords = originalText.split(/\s+/);
    const translatedWords = literalTranslation.split(/\s+/);
    
    // Create pairs, handling cases where word counts might differ
    const maxLength = Math.max(originalWords.length, translatedWords.length);
    const pairs = [];
    
    for (let i = 0; i < maxLength; i++) {
      pairs.push({
        original: originalWords[i] || '',
        translation: translatedWords[i] || ''
      });
    }

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-gray-700">Word-by-word breakdown:</h4>
        <div className="flex flex-wrap gap-2">
          {pairs.map((pair, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <div className="text-sm font-medium text-gray-900">{pair.original}</div>
              <div className="text-xs text-gray-600 mt-1">{pair.translation}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getLanguageLabel = (langCode: string) => {
    const option = languageOptions.find(opt => opt.value === langCode);
    return option ? option.label : langCode;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Translation Analysis</h3>
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
          onClick={handleAnalyze} 
          disabled={isLoading || !targetLanguage}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Translation'
          )}
        </Button>
      </div>

      {/* Translation Results */}
      {translation && (
        <div className="space-y-4">
          <Separator />
          
          {/* Normal Translation */}
          <Card className="p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Natural Translation:</h4>
            <p className="text-gray-900 leading-relaxed">{translation.normalTranslation}</p>
          </Card>

          {/* Word-by-word Analysis */}
          <Card className="p-4">
            {renderWordByWord(text, translation.literalTranslation)}
          </Card>

          {/* Literal Translation */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-medium text-sm text-blue-800 mb-2">Literal Translation:</h4>
            <p className="text-blue-900 leading-relaxed">{translation.literalTranslation}</p>
          </Card>
        </div>
      )}
    </div>
  );
};
