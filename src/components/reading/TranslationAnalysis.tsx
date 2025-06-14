
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Loader2, Languages, ArrowRight, Zap, Timer, TrendingUp } from 'lucide-react';
import { LanguageSelectWithFlag } from '@/components/bidirectional/LanguageSelectWithFlag';
import { translationPerformanceService } from '@/services/translationPerformanceService';
import { toast } from 'sonner';

interface TranslationAnalysisProps {
  text: string;
  sourceLanguage: string;
  onClose: () => void;
}

interface WordTranslation {
  original: string;
  translation: string;
}

interface OptimizedTranslationResult {
  normalTranslation: string;
  literalTranslation: string;
  wordTranslations: WordTranslation[];
  performanceMetrics: {
    totalProcessingTime: number;
    chunkCount: number;
    averageChunkTime: number;
    parallelProcessing: boolean;
    cacheHits: number;
  };
}

export const TranslationAnalysis: React.FC<TranslationAnalysisProps> = ({
  text,
  sourceLanguage,
  onClose
}) => {
  const [targetLanguage, setTargetLanguage] = useState('english');
  const [translation, setTranslation] = useState<OptimizedTranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

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
    setProgress(0);
    setProgressStatus('Initializing...');
    
    try {
      console.log('Starting optimized translation:', {
        textLength: text.length,
        sourceLanguage,
        targetLanguage
      });

      const result = await translationPerformanceService.optimizedTranslation(
        text,
        sourceLanguage,
        targetLanguage,
        (progressValue, status) => {
          setProgress(progressValue);
          setProgressStatus(status);
        }
      );

      console.log('Optimized translation completed:', result.performanceMetrics);
      setTranslation(result);
      
      // Show performance summary
      const { performanceMetrics } = result;
      toast.success(
        `Translation completed in ${(performanceMetrics.totalProcessingTime / 1000).toFixed(1)}s` +
        ` using ${performanceMetrics.chunkCount} segments` +
        (performanceMetrics.cacheHits > 0 ? ` (${performanceMetrics.cacheHits} cache hits)` : '')
      );
      
    } catch (error) {
      console.error('Error generating optimized translation:', error);
      toast.error('Failed to generate translation');
    } finally {
      setIsLoading(false);
      setProgress(0);
      setProgressStatus('');
    }
  };

  const renderWordByWord = (wordTranslations: WordTranslation[]) => {
    if (!wordTranslations || wordTranslations.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          Word-by-word breakdown not available
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-gray-700">Word-by-word breakdown:</h4>
        <div className="flex flex-wrap gap-2">
          {wordTranslations.map((wordPair, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <div className="text-sm font-medium text-gray-900">{wordPair.original}</div>
              <div className="text-xs text-gray-600 mt-1">{wordPair.translation}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPerformanceMetrics = (metrics: OptimizedTranslationResult['performanceMetrics']) => {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-sm text-blue-800 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Performance Metrics
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Timer className="h-3 w-3 text-blue-600" />
            <span className="text-blue-700">
              {(metrics.totalProcessingTime / 1000).toFixed(1)}s total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-blue-600" />
            <span className="text-blue-700">
              {metrics.chunkCount} segments
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600">⚡</span>
            <span className="text-blue-700">
              {metrics.parallelProcessing ? 'Parallel' : 'Sequential'}
            </span>
          </div>
          {metrics.cacheHits > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-600">💾</span>
              <span className="text-blue-700">
                {metrics.cacheHits} cache hits
              </span>
            </div>
          )}
        </div>
      </Card>
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
          <h3 className="text-lg font-semibold">Enhanced Translation Analysis</h3>
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
            <>
              <Zap className="h-4 w-4 mr-2" />
              Enhanced Analysis
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      {isLoading && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{progressStatus}</span>
            <span className="text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Translation Results */}
      {translation && (
        <div className="space-y-4">
          <Separator />
          
          {/* Performance Metrics */}
          {renderPerformanceMetrics(translation.performanceMetrics)}
          
          {/* Normal Translation */}
          <Card className="p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Natural Translation:</h4>
            <p className="text-gray-900 leading-relaxed">{translation.normalTranslation}</p>
          </Card>

          {/* Word-by-word Analysis */}
          <Card className="p-4">
            {renderWordByWord(translation.wordTranslations)}
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
