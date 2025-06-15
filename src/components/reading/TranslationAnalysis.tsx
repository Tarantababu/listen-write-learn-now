
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Languages, ArrowRight, Zap, Timer, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
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
    failureRate: number;
    retryCount: number;
    errorRecoveryUsed: boolean;
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
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRetryOptions, setShowRetryOptions] = useState(false);

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
    setHasError(false);
    setErrorMessage('');
    setShowRetryOptions(false);
    
    try {
      console.log('Starting enhanced translation analysis:', {
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

      console.log('Enhanced translation completed:', result.performanceMetrics);
      setTranslation(result);
      
      // Show enhanced performance summary
      const { performanceMetrics } = result;
      const summaryMessage = `Translation completed in ${(performanceMetrics.totalProcessingTime / 1000).toFixed(1)}s` +
        ` using ${performanceMetrics.chunkCount} segments` +
        (performanceMetrics.cacheHits > 0 ? ` (${performanceMetrics.cacheHits} cache hits)` : '') +
        (performanceMetrics.errorRecoveryUsed ? ' with error recovery' : '');
      
      if (performanceMetrics.errorRecoveryUsed) {
        toast.warning(summaryMessage, {
          description: 'Some segments used fallback translation due to processing issues.'
        });
      } else {
        toast.success(summaryMessage);
      }
      
    } catch (error) {
      console.error('Error generating enhanced translation:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate translation');
      setShowRetryOptions(true);
      
      toast.error('Translation analysis failed', {
        description: 'Click retry to try again or view details for more information.'
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
      setProgressStatus('');
    }
  };

  const handleRetry = () => {
    setShowRetryOptions(false);
    handleAnalyze();
  };

  const handleClearCache = () => {
    translationPerformanceService.clearCache();
    toast.success('Cache cleared. Next translation will be fresh.');
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
    const getPerformanceColor = (failureRate: number) => {
      if (failureRate === 0) return 'text-green-700 bg-green-50 border-green-200';
      if (failureRate < 0.3) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      return 'text-red-700 bg-red-50 border-red-200';
    };

    return (
      <Card className={`p-4 ${getPerformanceColor(metrics.failureRate)}`}>
        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Performance Metrics
          {metrics.errorRecoveryUsed && (
            <Badge variant="outline" className="text-xs">
              Recovery Used
            </Badge>
          )}
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Timer className="h-3 w-3" />
            <span>
              {(metrics.totalProcessingTime / 1000).toFixed(1)}s total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3" />
            <span>
              {metrics.chunkCount} segments
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">⚡</span>
            <span>
              {metrics.parallelProcessing ? 'Parallel' : 'Sequential'}
            </span>
          </div>
          {metrics.cacheHits > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs">💾</span>
              <span>
                {metrics.cacheHits} cache hits
              </span>
            </div>
          )}
          {metrics.retryCount > 0 && (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3 w-3" />
              <span>
                {metrics.retryCount} retries
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {metrics.failureRate === 0 ? (
              <CheckCircle className="h-3 w-3 text-green-600" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
            )}
            <span>
              {(metrics.failureRate * 100).toFixed(1)}% failure rate
            </span>
          </div>
        </div>
      </Card>
    );
  };

  const getLanguageLabel = (langCode: string) => {
    const option = languageOptions.find(opt => opt.value === langCode);
    return option ? option.label : langCode;
  };

  const getTextComplexity = (text: string) => {
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 100) return { level: 'Simple', color: 'text-green-600' };
    if (wordCount < 500) return { level: 'Medium', color: 'text-yellow-600' };
    if (wordCount < 1000) return { level: 'Complex', color: 'text-orange-600' };
    return { level: 'Very Complex', color: 'text-red-600' };
  };

  const complexity = getTextComplexity(text);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Enhanced Translation Analysis</h3>
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

        <div className="flex gap-2">
          <Button 
            onClick={handleAnalyze} 
            disabled={isLoading || !targetLanguage}
            className="flex-1"
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            title="Clear translation cache"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
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

      {/* Error Handling */}
      {hasError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-red-800 font-medium">Translation failed</p>
              <p className="text-red-700 text-sm">{errorMessage}</p>
              {showRetryOptions && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={handleRetry}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleClearCache}>
                    Clear Cache & Retry
                  </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
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

          {/* Quality Assessment */}
          {translation.performanceMetrics.errorRecoveryUsed && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <p className="text-yellow-800 text-sm">
                  Some parts of this translation used fallback processing due to technical issues. 
                  The translation may be less accurate for certain segments. Try again later for potentially improved results.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};
