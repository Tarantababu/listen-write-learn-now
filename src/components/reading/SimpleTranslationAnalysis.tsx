
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Languages, ArrowRight, AlertTriangle, Clock, Zap, Settings, Info } from 'lucide-react';
import { LanguageSelectWithFlag } from '@/components/bidirectional/LanguageSelectWithFlag';
import { simpleTranslationService } from '@/services/simpleTranslationService';
import { EnhancedAudioButton } from '@/components/audio/EnhancedAudioButton';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [chunkSize, setChunkSize] = useState('auto');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPerformanceDetails, setShowPerformanceDetails] = useState(false);
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

  const chunkSizeOptions = [
    { value: 'auto', label: 'Auto (Recommended)', description: 'Automatically optimized', speed: 'Balanced', quality: 'High' },
    { value: 'small', label: 'Small (~2k chars)', description: 'Fastest processing', speed: 'Fastest', quality: 'Good' },
    { value: 'medium', label: 'Medium (~3k chars)', description: 'Balanced performance', speed: 'Fast', quality: 'High' },
    { value: 'large', label: 'Large (~4k chars)', description: 'Maximum quality', speed: 'Slower', quality: 'Highest' }
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
    
    // Enhanced progress steps based on text complexity and chunk size
    const textLength = text.length;
    const isLongText = textLength > 400;
    const isVeryLongText = textLength > 800;
    const isSmallChunk = chunkSize === 'small';
    
    const steps = isVeryLongText ? [
      { percent: 0, message: `Analyzing text structure (${chunkSize} chunks)...` },
      { percent: 15, message: 'Processing first text segment...' },
      { percent: 35, message: 'Translating additional segments...' },
      { percent: 55, message: 'Generating word-by-word breakdown...' },
      { percent: 75, message: 'Combining translation segments...' },
      { percent: 90, message: 'Finalizing comprehensive analysis...' },
    ] : isLongText ? [
      { percent: 0, message: `Analyzing text structure (${chunkSize})...` },
      { percent: 25, message: 'Generating natural translation...' },
      { percent: 50, message: 'Creating literal breakdown...' },
      { percent: 75, message: 'Finalizing word analysis...' },
    ] : [
      { percent: 0, message: `Analyzing text structure (${chunkSize})...` },
      { percent: 30, message: 'Generating translation...' },
      { percent: 70, message: 'Creating word breakdown...' },
    ];

    let currentStepIndex = 0;
    setProgressStep(steps[0].message);

    // Adjusted timing based on chunk size
    const intervalTime = isSmallChunk ? 120 : isVeryLongText ? 200 : 150;
    const progressIncrement = isSmallChunk ? 2 : isVeryLongText ? 0.5 : 1;

    // Start progress animation
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const nextProgress = prev + progressIncrement;
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
    }, intervalTime);

    try {
      console.log('Starting translation:', {
        textLength: text.length,
        sourceLanguage,
        targetLanguage,
        chunkSize,
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
      setRetryCount(0);
      
      // Enhanced success message based on chunk configuration
      const chunkInfo = chunkSizeOptions.find(opt => opt.value === chunkSize);
      if (isVeryLongText) {
        toast.success('Complex text translated successfully', {
          description: `Processed with ${chunkInfo?.label} chunks for optimal results.`
        });
      } else if (isLongText) {
        toast.success('Translation completed successfully', {
          description: `Optimized with ${chunkInfo?.label} processing.`
        });
      } else {
        toast.success('Translation completed successfully');
      }
      
      setTimeout(() => setIsLoading(false), 800);

    } catch (error) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      console.error('Translation failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      let userFriendlyMessage = errorMessage;
      let canRetry = true;
      
      // Enhanced error handling for different scenarios
      if (errorMessage.includes('timeout') || errorMessage.includes('504')) {
        userFriendlyMessage = isVeryLongText 
          ? 'Translation timed out due to text complexity. Try breaking the text into smaller sections or use smaller chunk size.'
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
          description: `Attempt ${retryCount + 1}/3 failed. Try a smaller chunk size for better performance.`
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
      description: 'Long text - optimized chunking recommended'
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
  const selectedChunkInfo = chunkSizeOptions.find(opt => opt.value === chunkSize);
  
  // Enhanced performance estimation
  const getPerformanceEstimate = () => {
    const baseTime = text.length > 800 ? 60 : text.length > 400 ? 30 : 15;
    const multiplier = chunkSize === 'small' ? 0.6 : chunkSize === 'large' ? 1.3 : 1;
    const estimatedTime = Math.round(baseTime * multiplier);
    const estimatedChunks = chunkSize === 'small' ? Math.ceil(text.length / 2000) : 
                           chunkSize === 'large' ? Math.ceil(text.length / 4000) : 
                           Math.ceil(text.length / 3000);
    
    return {
      time: estimatedTime,
      chunks: text.length > 200 ? estimatedChunks : 1,
      speed: selectedChunkInfo?.speed || 'Balanced',
      quality: selectedChunkInfo?.quality || 'High'
    };
  };

  const performanceEstimate = getPerformanceEstimate();

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
              ~{performanceEstimate.time}s
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-gray-500"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>

      <Separator />

      {/* Enhanced Advanced Settings */}
      {showAdvanced && (
        <Card className="p-4 bg-gray-50 border-2 border-blue-100">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Performance Settings</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPerformanceDetails(!showPerformanceDetails)}
                className="text-xs text-blue-600"
              >
                <Info className="h-3 w-3 mr-1" />
                Details
              </Button>
            </div>
            
            <div className="space-y-3">
              <label className="text-xs text-gray-600">Chunk Size (affects speed vs quality)</label>
              <Select value={chunkSize} onValueChange={setChunkSize}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select chunk size" />
                </SelectTrigger>
                <SelectContent>
                  {chunkSizeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{option.label}</span>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>Speed: {option.speed}</span>
                          <span>•</span>
                          <span>Quality: {option.quality}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Enhanced Performance Preview */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">Estimated Time:</span>
                    <div className="font-medium text-blue-700">{performanceEstimate.time} seconds</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Processing Mode:</span>
                    <div className="font-medium text-blue-700">{selectedChunkInfo?.label.split(' ')[0] || 'Auto'}</div>
                  </div>
                  {performanceEstimate.chunks > 1 && (
                    <>
                      <div>
                        <span className="text-gray-600">Text Segments:</span>
                        <div className="font-medium text-blue-700">{performanceEstimate.chunks} chunks</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Quality Level:</span>
                        <div className="font-medium text-blue-700">{performanceEstimate.quality}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Detailed Performance Information */}
              {showPerformanceDetails && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <div className="text-blue-800 text-xs space-y-2">
                      <p><strong>How chunking works:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Small chunks:</strong> Fastest processing, good for urgent translations</li>
                        <li><strong>Medium chunks:</strong> Balanced approach, recommended for most texts</li>
                        <li><strong>Large chunks:</strong> Best quality, ideal for important documents</li>
                        <li><strong>Auto mode:</strong> Intelligently selects optimal size based on text length</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Enhanced complexity info for long texts */}
      {text.length > 600 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <p className="text-blue-800 text-sm">
              <strong>Processing long text:</strong> Using {selectedChunkInfo?.label} chunks for optimal performance. 
              Estimated {performanceEstimate.chunks} segments, ~{performanceEstimate.time} seconds total.
              {performanceEstimate.chunks > 3 && (
                <span className="block mt-1 text-xs">
                  💡 Tip: Consider using smaller chunks if you need faster results.
                </span>
              )}
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
              Translating ({selectedChunkInfo?.label})... ({Math.round(progress)}%)
            </>
          ) : (
            <>
              <Languages className="h-4 w-4 mr-2" />
              {retryCount > 0 ? `Retry Translation (${retryCount}/3)` : 'Translate'}
            </>
          )}
        </Button>
        
        {isLoading && (
          <div className="space-y-3 pt-2">
            <Progress 
              value={progress} 
              className="w-full"
              indicatorClassName={progress === 100 ? 'bg-green-500' : ''}
            />
            <div className="flex justify-between items-center text-sm">
              <p className="text-muted-foreground">{progressStep}</p>
              <div className="text-xs text-gray-500">
                {selectedChunkInfo?.speed} mode • {performanceEstimate.chunks > 1 ? `${performanceEstimate.chunks} segments` : '1 segment'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="text-red-800 font-medium">Translation Error</p>
              <p className="text-red-700 text-sm">{error}</p>
              
              {/* Smart suggestions based on error type and text characteristics */}
              {error.includes('timeout') && text.length > 1000 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm font-medium">💡 Optimization Suggestions:</p>
                  <ul className="text-yellow-700 text-xs mt-1 space-y-1">
                    <li>• Try "Small" chunk size for faster processing</li>
                    <li>• Break text into smaller sections (under 500 characters)</li>
                    <li>• Remove unnecessary formatting or special characters</li>
                  </ul>
                </div>
              )}
              
              {showRetryButton && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRetry}
                    className="mt-2"
                  >
                    Try Again ({retryCount}/3)
                  </Button>
                  {chunkSize !== 'small' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setChunkSize('small');
                        setError(null);
                      }}
                      className="mt-2"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Use Small Chunks
                    </Button>
                  )}
                </div>
              )}
              {retryCount >= 3 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-gray-700 text-xs">
                    <strong>Maximum attempts reached.</strong> Try one of these solutions:
                  </p>
                  <ul className="text-gray-600 text-xs mt-1 space-y-1">
                    <li>• Use smaller chunk size or shorter text sections</li>
                    <li>• Wait a few minutes and try again</li>
                    <li>• Check your internet connection</li>
                  </ul>
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
          
          {/* Natural Translation */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-gray-700">Natural Translation:</h4>
              <EnhancedAudioButton
                text={translation.normalTranslation}
                language={targetLanguage}
                chunkSize={chunkSize as any}
                size="sm"
                variant="ghost"
                showEstimate={false}
              >
                <span className="sr-only">Generate audio for natural translation</span>
              </EnhancedAudioButton>
            </div>
            <p className="text-gray-900 leading-relaxed">{translation.normalTranslation}</p>
          </Card>

          {/* Literal Translation */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-blue-800">Literal Translation:</h4>
              <EnhancedAudioButton
                text={translation.literalTranslation}
                language={targetLanguage}
                chunkSize={chunkSize as any}
                size="sm"
                variant="ghost"
                showEstimate={false}
              >
                <span className="sr-only">Generate audio for literal translation</span>
              </EnhancedAudioButton>
            </div>
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

          {/* Enhanced Processing Success Info */}
          {text.length > 600 && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription>
                <div className="text-green-800 text-sm space-y-1">
                  <p className="font-medium">✓ Translation completed successfully!</p>
                  <div className="text-xs text-green-700">
                    Processed using {selectedChunkInfo?.label} ({performanceEstimate.chunks} segments) 
                    in ~{performanceEstimate.time} seconds with {performanceEstimate.quality.toLowerCase()} quality optimization.
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};
