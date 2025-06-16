
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Languages, ArrowRight, AlertTriangle, Clock, Zap } from 'lucide-react';
import { LanguageSelectWithFlag } from '@/components/bidirectional/LanguageSelectWithFlag';
import { simpleTranslationService } from '@/services/simpleTranslationService';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

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
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleTranslate = async () => {
    if (!text.trim()) {
      toast.error('No text to translate');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranslation(null);
    setProgress(0);
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Enhanced progress steps based on text complexity
    const textLength = text.length;
    const isLongText = textLength > 400;
    const isVeryLongText = textLength > 800;
    
    const steps = isVeryLongText ? [
      { percent: 0, message: 'Analyzing text structure and preparing chunks...' },
      { percent: 15, message: 'Processing first text segment...' },
      { percent: 35, message: 'Translating additional segments...' },
      { percent: 55, message: 'Generating word-by-word breakdown...' },
      { percent: 75, message: 'Combining translation segments...' },
      { percent: 90, message: 'Finalizing comprehensive analysis...' },
    ] : isLongText ? [
      { percent: 0, message: 'Analyzing text structure...' },
      { percent: 25, message: 'Generating natural translation...' },
      { percent: 50, message: 'Creating literal breakdown...' },
      { percent: 75, message: 'Finalizing word analysis...' },
    ] : [
      { percent: 0, message: 'Analyzing text structure...' },
      { percent: 30, message: 'Generating translation...' },
      { percent: 70, message: 'Creating word breakdown...' },
    ];

    let currentStepIndex = 0;
    setProgressStep(steps[0].message);

    // Start progress animation
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const nextProgress = prev + (isVeryLongText ? 0.5 : isLongText ? 0.8 : 1.2);
        if (currentStepIndex + 1 < steps.length && nextProgress >= steps[currentStepIndex + 1].percent) {
          currentStepIndex++;
          setProgressStep(steps[currentStepIndex].message);
        }
        if (nextProgress >= 92) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return 92;
        }
        return nextProgress;
      });
    }, isVeryLongText ? 200 : isLongText ? 180 : 150);

    try {
      console.log('Starting translation:', {
        textLength: text.length,
        sourceLanguage,
        targetLanguage,
        attempt: retryCount + 1
      });

      const result = await simpleTranslationService.translateText(
        text,
        sourceLanguage,
        targetLanguage
      );

      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(100);
      setProgressStep('Translation completed successfully!');
      console.log('Translation completed successfully');
      setTranslation(result);
      setRetryCount(0); // Reset retry count on success
      
      // Enhanced success message based on text complexity
      if (isVeryLongText) {
        toast.success('Complex text translated successfully', {
          description: 'Long text was processed in segments for optimal results.'
        });
      } else if (isLongText) {
        toast.success('Translation completed successfully', {
          description: 'Text processed with enhanced analysis.'
        });
      } else {
        toast.success('Translation completed successfully');
      }
      
      setTimeout(() => setIsLoading(false), 1000);

    } catch (error) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      console.error('Translation failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      let userFriendlyMessage = errorMessage;
      let canRetry = true;
      
      // Enhanced error handling for different scenarios
      if (errorMessage.includes('timeout') || errorMessage.includes('504')) {
        userFriendlyMessage = isVeryLongText 
          ? 'Translation timed out due to text complexity. Try breaking the text into smaller sections.'
          : 'Translation request timed out. This may be due to high server load.';
      } else if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
        userFriendlyMessage = 'Translation service is temporarily unavailable. Please try again in a moment.';
      } else if (errorMessage.includes('Failed to send a request to the Edge Function')) {
        userFriendlyMessage = 'Connection to translation service failed. Please check your internet connection and try again.';
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        userFriendlyMessage = 'Too many requests. Please wait a moment before trying again.';
        canRetry = false;
        setTimeout(() => setError(null), 30000); // Clear error after 30 seconds
      }
      
      setError(userFriendlyMessage);
      setRetryCount(prev => prev + 1);
      
      if (canRetry && retryCount < 2) {
        toast.error('Translation failed - retry available', {
          description: `Attempt ${retryCount + 1}/3 failed. You can try again.`
        });
      } else {
        toast.error('Translation failed', {
          description: userFriendlyMessage
        });
      }
      
      setProgress(0);
      setProgressStep('');
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleTranslate();
  };

  const getLanguageLabel = (langCode: string) => {
    const option = languageOptions.find(opt => opt.value === langCode);
    return option ? option.label : langCode;
  };

  const getTextComplexity = (text: string) => {
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;
    
    if (charCount > 800 || wordCount > 150) return { 
      level: 'Very Complex', 
      color: 'text-red-600',
      description: 'Long text - may take longer to process'
    };
    if (charCount > 400 || wordCount > 75) return { 
      level: 'Complex', 
      color: 'text-orange-600',
      description: 'Medium length text'
    };
    if (charCount > 150 || wordCount > 25) return { 
      level: 'Medium', 
      color: 'text-yellow-600',
      description: 'Standard length text'
    };
    return { 
      level: 'Simple', 
      color: 'text-green-600',
      description: 'Short text - quick processing'
    };
  };

  const complexity = getTextComplexity(text);
  const showRetryButton = error && retryCount < 3;
  const estimatedTime = text.length > 800 ? '30-60 seconds' : text.length > 400 ? '15-30 seconds' : '5-15 seconds';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Translation Analysis</h3>
          <Badge variant="outline" className={complexity.color} title={complexity.description}>
            {complexity.level}
          </Badge>
          {text.length > 400 && (
            <Badge variant="outline" className="text-blue-600">
              <Clock className="h-3 w-3 mr-1" />
              ~{estimatedTime}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      <Separator />

      {/* Text complexity info for long texts */}
      {text.length > 600 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <p className="text-blue-800 text-sm">
              <strong>Processing long text:</strong> This text will be processed in segments for optimal results. 
              Estimated time: {estimatedTime}.
            </p>
          </AlertDescription>
        </Alert>
      )}

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
              Translating... ({Math.round(progress)}%)
            </>
          ) : (
            <>
              <Languages className="h-4 w-4 mr-2" />
              {retryCount > 0 ? `Retry Translation (${retryCount}/3)` : 'Translate'}
            </>
          )}
        </Button>
        
        {isLoading && (
          <div className="space-y-2 pt-2">
            <Progress 
              value={progress} 
              className="w-full"
              indicatorClassName={progress === 100 ? 'bg-green-500' : ''}
            />
            <p className="text-sm text-muted-foreground text-center">{progressStep}</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-red-800 font-medium">Translation Error</p>
              <p className="text-red-700 text-sm">{error}</p>
              {showRetryButton && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRetry}
                  className="mt-2"
                >
                  Try Again ({retryCount}/3)
                </Button>
              )}
              {retryCount >= 3 && (
                <p className="text-red-600 text-xs mt-1">
                  Maximum retry attempts reached. Please try with shorter text or check your connection.
                </p>
              )}
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
                Word-by-word breakdown not available for this translation
              </div>
            )}
          </Card>

          {/* Processing info for long texts */}
          {text.length > 600 && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription>
                <p className="text-green-800 text-sm">
                  ✓ Long text processed successfully using enhanced segmentation for optimal translation quality.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};
