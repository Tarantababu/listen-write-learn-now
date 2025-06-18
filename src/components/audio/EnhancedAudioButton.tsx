
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  Loader2, 
  Clock, 
  Zap, 
  Download,
  Play,
  CheckCircle
} from 'lucide-react';
import { TtsProgressModal } from './TtsProgressModal';
import { enhancedTtsService, TtsProgress, TtsGenerationOptions } from '@/services/enhancedTtsService';
import { toast } from 'sonner';

interface EnhancedAudioButtonProps {
  text: string;
  language: string;
  chunkSize?: 'small' | 'medium' | 'large' | 'auto';
  onAudioGenerated?: (audioUrl: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showEstimate?: boolean;
  autoPlay?: boolean;
  children?: React.ReactNode;
}

export const EnhancedAudioButton: React.FC<EnhancedAudioButtonProps> = ({
  text,
  language,
  chunkSize = 'auto',
  onAudioGenerated,
  onError,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  showEstimate = true,
  autoPlay = false,
  children
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState<TtsProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Estimate generation parameters
  const estimate = enhancedTtsService.estimateGenerationTime(text, chunkSize);

  const handleGenerate = async () => {
    if (isGenerating || disabled) return;

    // Reset state
    setError(null);
    setIsComplete(false);
    setIsCancelled(false);
    setProgress(null);
    setGeneratedAudioUrl(null);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    setIsGenerating(true);
    setShowProgress(true);

    const options: TtsGenerationOptions = {
      text,
      language,
      chunkSize,
      onProgress: setProgress,
      signal: abortControllerRef.current.signal
    };

    try {
      const result = await enhancedTtsService.generateAudio(options);
      
      setGeneratedAudioUrl(result.audioUrl);
      setIsComplete(true);
      
      // Show success message
      if (result.cached) {
        toast.success('Audio retrieved from cache!');
      } else {
        toast.success(`Audio generated successfully!${result.chunksProcessed ? ` (${result.chunksProcessed} segments)` : ''}`);
      }
      
      // Call callback
      if (onAudioGenerated) {
        onAudioGenerated(result.audioUrl);
      }
      
      // Auto-play if enabled
      if (autoPlay && result.audioUrl) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = result.audioUrl;
            audioRef.current.play().catch(console.error);
          }
        }, 500);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Audio generation failed';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      if (!errorMessage.includes('cancelled')) {
        toast.error(errorMessage);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsCancelled(true);
      setIsGenerating(false);
      toast.info('Audio generation cancelled');
    }
  };

  const handleCloseProgress = () => {
    setShowProgress(false);
    // Don't reset other states so user can see the result
  };

  const handlePlayGenerated = () => {
    if (generatedAudioUrl && audioRef.current) {
      audioRef.current.src = generatedAudioUrl;
      audioRef.current.play().catch(console.error);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant={variant}
          size={size}
          onClick={handleGenerate}
          disabled={disabled || isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isComplete ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          
          {children || (
            <span>
              {isGenerating ? 'Generating...' : isComplete ? 'Generated' : 'Generate Audio'}
            </span>
          )}
        </Button>

        {/* Play button for generated audio */}
        {generatedAudioUrl && isComplete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayGenerated}
            title="Play generated audio"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}

        {/* Estimation badge */}
        {showEstimate && !isGenerating && !isComplete && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            ~{estimate.estimatedSeconds}s
          </Badge>
        )}

        {/* Complexity indicator */}
        {estimate.complexity === 'high' && (
          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
            <Zap className="h-3 w-3 mr-1" />
            Complex
          </Badge>
        )}
      </div>

      {/* Progress Modal */}
      <TtsProgressModal
        isOpen={showProgress}
        onClose={handleCloseProgress}
        onCancel={isGenerating ? handleCancel : undefined}
        progress={progress}
        estimatedTime={estimate.estimatedSeconds}
        complexity={estimate.complexity}
        chunksEstimate={estimate.chunksEstimate}
        textLength={text.length}
        chunkSize={chunkSize}
        error={error}
        isComplete={isComplete}
        isCancelled={isCancelled}
      />

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} />
    </>
  );
};
