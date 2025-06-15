
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, Volume2, Brain, Mic, Info, BarChart3, Clock, FileText, RefreshCw, AlertTriangle } from 'lucide-react';
import { ReadingExercise } from '@/types/reading';
import { EnhancedInteractiveText } from './EnhancedInteractiveText';
import { TextSelectionManager } from './TextSelectionManager';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { Language } from '@/types';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { AudioUtils } from '@/utils/audioUtils';
import { enhancedAudioService } from '@/services/enhancedAudioService';

interface AllTextViewProps {
  exercise: ReadingExercise;
  audioEnabled: boolean;
  onCreateDictation: () => void;
  onCreateDictationFromSelection?: (selectedText: string) => void;
  onCreateBidirectionalFromSelection?: (selectedText: string) => void;
}

export const AllTextView: React.FC<AllTextViewProps> = ({
  exercise,
  audioEnabled,
  onCreateDictation,
  onCreateDictationFromSelection,
  onCreateBidirectionalFromSelection
}) => {
  const { addExercise } = useExerciseContext();
  const isMobile = useIsMobile();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentPlayingSentence, setCurrentPlayingSentence] = useState<number>(-1);
  const [showSelectionHelp, setShowSelectionHelp] = useState(true);
  const [audioProgress, setAudioProgress] = useState(0);
  const [hasAudioIssue, setHasAudioIssue] = useState(false);
  const [isRetryingAudio, setIsRetryingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get full text from simplified content structure
  const fullText = exercise.content.text || '';
  
  // Split text into sentences for basic counting (simplified approach)
  const estimatedSentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const estimatedWordCount = fullText.split(/\s+/).filter(word => word.length > 0).length;

  // Check if audio is available for this exercise
  const preferredAudioUrl = AudioUtils.getPreferredAudioUrl(exercise);
  const hasAudio = !!preferredAudioUrl;
  
  // Check for audio issues
  const shouldHaveAudio = exercise.audio_generation_status === 'completed';
  const audioIssueDetected = shouldHaveAudio && !hasAudio;

  useEffect(() => {
    setHasAudioIssue(audioIssueDetected);
  }, [audioIssueDetected]);

  const handleRetryAudio = async () => {
    setIsRetryingAudio(true);
    try {
      console.log(`[ALL TEXT VIEW] Retrying audio for exercise: ${exercise.id}`);
      const success = await enhancedAudioService.validateAndFixExerciseAudio(exercise.id);
      
      if (success) {
        toast.success('Audio regeneration completed successfully');
        setHasAudioIssue(false);
        // The page might need to refresh to get the updated exercise data
        window.location.reload();
      } else {
        toast.error('Failed to regenerate audio');
      }
    } catch (error) {
      console.error('[ALL TEXT VIEW] Audio retry failed:', error);
      toast.error('Audio regeneration failed');
    } finally {
      setIsRetryingAudio(false);
    }
  };

  const playFullText = async () => {
    if (!audioEnabled || !hasAudio) return;
    
    try {
      setIsPlaying(true);
      
      if (audioRef.current) {
        audioRef.current.src = preferredAudioUrl;
        await audioRef.current.play();
      } else {
        throw new Error('Audio player not available');
      }
    } catch (error) {
      console.error('Error playing full text audio:', error);
      toast.error('Audio playback failed');
      setIsPlaying(false);
    }
  };

  const playSentenceBysentence = async () => {
    if (!audioEnabled || !hasAudio) return;
    
    try {
      setIsPlaying(true);
      
      // For sentence-by-sentence, we'll play the full audio but show visual feedback
      if (audioRef.current) {
        audioRef.current.src = preferredAudioUrl;
        await audioRef.current.play();
        
        // Simulate sentence highlighting for user feedback
        let currentSentence = 0;
        const sentenceInterval = setInterval(() => {
          setCurrentPlayingSentence(currentSentence);
          currentSentence++;
          
          if (currentSentence >= estimatedSentences.length) {
            clearInterval(sentenceInterval);
            setCurrentPlayingSentence(-1);
          }
        }, 3000); // Rough estimate of 3 seconds per sentence
      } else {
        throw new Error('Audio player not available');
      }
    } catch (error) {
      console.error('Error playing sentence-by-sentence audio:', error);
      toast.error('Audio playback failed');
      setIsPlaying(false);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentPlayingSentence(-1);
    }
  };

  const createDictationFromSelection = (selectedText: string) => {
    if (onCreateDictationFromSelection) {
      onCreateDictationFromSelection(selectedText);
    } else {
      toast.success(`Dictation exercise created for: "${selectedText.substring(0, 50)}..."`);
    }
  };

  const createBidirectionalFromSelection = (selectedText: string) => {
    if (onCreateBidirectionalFromSelection) {
      onCreateBidirectionalFromSelection(selectedText);
    } else {
      toast.success(`Translation exercise created for: "${selectedText.substring(0, 50)}..."`);
    }
  };

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log('[ALL TEXT VIEW] Audio loaded successfully');
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPlayingSentence(-1);
      setAudioProgress(0);
    };

    const handleTimeUpdate = () => {
      if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        setAudioProgress(progress);
      }
    };

    const handleError = (e: any) => {
      console.error('[ALL TEXT VIEW] Audio error:', e);
      setIsPlaying(false);
      setHasAudioIssue(true);
      toast.error('Audio playback failed');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Audio hidden element */}
      <audio ref={audioRef} />

      {/* Exercise Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{exercise.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{exercise.language}</Badge>
                <Badge variant="outline" className="capitalize">{exercise.difficulty_level}</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                ~{estimatedSentences.length} sentences
              </p>
              <p className="text-sm text-muted-foreground">
                ~{estimatedWordCount} words
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Audio Controls */}
      {audioEnabled && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Audio Playback
                </h4>
                
                {hasAudioIssue && (
                  <Button
                    onClick={handleRetryAudio}
                    disabled={isRetryingAudio}
                    variant="outline"
                    size="sm"
                    className="text-orange-600 border-orange-200"
                  >
                    {isRetryingAudio ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Fixing...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Fix Audio
                      </>
                    )}
                  </Button>
                )}
              </div>

              {hasAudio ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={isPlaying ? pauseAudio : playFullText}
                      variant={isPlaying ? "secondary" : "default"}
                      size="sm"
                    >
                      {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                      {isPlaying ? 'Pause' : 'Play Full Text'}
                    </Button>
                    
                    <Button
                      onClick={playSentenceBysentence}
                      variant="outline"
                      size="sm"
                      disabled={isPlaying}
                    >
                      <Brain className="h-4 w-4 mr-1" />
                      Guided Reading
                    </Button>
                  </div>

                  {isPlaying && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round(audioProgress)}%</span>
                      </div>
                      <Progress value={audioProgress} className="h-1" />
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Audio is not available for this exercise.
                    {hasAudioIssue && " There seems to be an issue with the audio generation."}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Text Selection Help */}
      {showSelectionHelp && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Select any text to create dictation or translation exercises from it.</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSelectionHelp(false)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Text Content */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex items-center justify-between border-b pb-4">
              <h4 className="font-medium">Reading Content</h4>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onCreateDictation}
                  variant="outline"
                  size="sm"
                >
                  <Mic className="h-4 w-4 mr-1" />
                  Full Dictation
                </Button>
                <Button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  variant="outline"
                  size="sm"
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  {showAnalysis ? 'Hide' : 'Show'} Stats
                </Button>
              </div>
            </div>

            {/* Text Analysis (if shown) */}
            {showAnalysis && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h5 className="font-medium text-sm">Text Statistics</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Words:</span>
                    <p className="font-medium">{estimatedWordCount}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sentences:</span>
                    <p className="font-medium">{estimatedSentences.length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Reading Time:</span>
                    <p className="font-medium">{Math.ceil(estimatedWordCount / 200)} min</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Difficulty:</span>
                    <p className="font-medium capitalize">{exercise.difficulty_level}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Text */}
            <div className="prose max-w-none">
              <TextSelectionManager
                onCreateDictation={createDictationFromSelection}
                onCreateBidirectional={createBidirectionalFromSelection}
              >
                <EnhancedInteractiveText
                  text={fullText}
                  language={exercise.language as Language}
                  enableTooltips={true}
                  enableBidirectionalCreation={true}
                  exerciseId={exercise.id}
                  className="text-lg leading-relaxed"
                />
              </TextSelectionManager>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
