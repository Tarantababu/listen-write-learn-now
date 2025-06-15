
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  AlertTriangle,
  Loader2,
  CheckCircle 
} from 'lucide-react';
import { ReadingExercise } from '@/types/reading';
import { toast } from 'sonner';

interface ReadingPracticeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: ReadingExercise | null;
  onUpdateProgress?: (sentenceIndex: number) => void;
}

export const ReadingPracticeModal: React.FC<ReadingPracticeModalProps> = ({
  isOpen,
  onOpenChange,
  exercise,
  onUpdateProgress
}) => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Split text into sentences for practice mode
  const fullText = exercise?.content?.text || '';
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0).map(s => s.trim());
  const currentSentence = sentences[currentSentenceIndex];

  useEffect(() => {
    if (isOpen) {
      setCurrentSentenceIndex(0);
      setIsPlaying(false);
      setAudioError(null);
    }
  }, [isOpen, exercise]);

  const handlePlayAudio = async (audioUrl?: string) => {
    if (!audioUrl) {
      setAudioError('Audio not available for this sentence');
      toast.error('Audio not available for this sentence');
      return;
    }

    try {
      setAudioLoading(true);
      setAudioError(null);

      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up event listeners
      audio.addEventListener('loadstart', () => {
        console.log('[AUDIO] Loading started for:', audioUrl);
      });

      audio.addEventListener('canplay', () => {
        console.log('[AUDIO] Can play:', audioUrl);
        setAudioLoading(false);
        setIsPlaying(true);
      });

      audio.addEventListener('ended', () => {
        console.log('[AUDIO] Playback ended');
        setIsPlaying(false);
      });

      audio.addEventListener('error', (e) => {
        console.error('[AUDIO] Playback error:', e);
        const error = audio.error;
        let errorMessage = 'Audio playback failed';
        
        if (error) {
          switch (error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = 'Audio playback was aborted';
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error while loading audio';
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = 'Audio decoding error';
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Audio format not supported';
              break;
            default:
              errorMessage = 'Unknown audio error';
          }
        }
        
        setAudioError(errorMessage);
        setAudioLoading(false);
        setIsPlaying(false);
        toast.error(errorMessage);
      });

      // Load and play
      await audio.load();
      await audio.play();

    } catch (error) {
      console.error('[AUDIO] Error playing audio:', error);
      setAudioError('Failed to play audio');
      setAudioLoading(false);
      setIsPlaying(false);
      toast.error('Failed to play audio');
    }
  };

  const handlePauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      const newIndex = currentSentenceIndex + 1;
      setCurrentSentenceIndex(newIndex);
      setIsPlaying(false);
      setAudioError(null);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Update progress
      if (onUpdateProgress) {
        onUpdateProgress(newIndex);
      }
    }
  };

  const handlePreviousSentence = () => {
    if (currentSentenceIndex > 0) {
      const newIndex = currentSentenceIndex - 1;
      setCurrentSentenceIndex(newIndex);
      setIsPlaying(false);
      setAudioError(null);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  };

  const handlePlayFullText = async () => {
    const fullTextAudioUrl = exercise?.full_text_audio_url;
    if (fullTextAudioUrl) {
      await handlePlayAudio(fullTextAudioUrl);
    } else {
      toast.error('Full text audio not available');
    }
  };

  const progress = sentences.length > 0 ? ((currentSentenceIndex + 1) / sentences.length) * 100 : 0;

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            {exercise.title}
          </DialogTitle>
          <DialogDescription>
            Practice reading with audio playback
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Audio Generation Status */}
          {exercise.audio_generation_status !== 'completed' && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {exercise.audio_generation_status === 'generating' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Audio is being generated in the background...</span>
                    </>
                  ) : exercise.audio_generation_status === 'failed' ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Audio generation failed</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Audio generation pending...</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {currentSentenceIndex + 1} of {sentences.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Sentence */}
          {currentSentence && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      Sentence {currentSentenceIndex + 1}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      {/* Audio Controls */}
                      {exercise.full_text_audio_url ? (
                        <div className="flex items-center gap-2">
                          {audioError && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs">{audioError}</span>
                            </div>
                          )}
                          
                          {audioLoading ? (
                            <Button size="sm" disabled>
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </Button>
                          ) : isPlaying ? (
                            <Button size="sm" onClick={handlePauseAudio} variant="outline">
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => handlePlayAudio(exercise.full_text_audio_url)}
                              variant="outline"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <VolumeX className="h-4 w-4" />
                          <span className="text-xs">Audio not available</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-lg leading-relaxed">
                    {currentSentence}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousSentence}
              disabled={currentSentenceIndex === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {/* Full Text Audio */}
            {exercise.full_text_audio_url && (
              <Button
                variant="outline"
                onClick={handlePlayFullText}
                disabled={audioLoading}
              >
                {audioLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4 mr-2" />
                )}
                Play Full Text
              </Button>
            )}

            <Button
              onClick={handleNextSentence}
              disabled={currentSentenceIndex === sentences.length - 1}
            >
              Next
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
