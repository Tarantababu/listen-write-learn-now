
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useShadowingExercises } from '@/hooks/useShadowingExercises';
import { toast } from 'sonner';

interface ShadowingPracticeModalProps {
  exercise: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShadowingPracticeModal: React.FC<ShadowingPracticeModalProps> = ({
  exercise,
  isOpen,
  onOpenChange,
}) => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showText, setShowText] = useState(true);
  const [practiceMode, setPracticeMode] = useState<'shadowing' | 'listening'>('shadowing');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { updateProgress } = useShadowingExercises();

  const sentences = exercise?.sentences || [];
  const currentSentence = sentences[currentSentenceIndex];
  const progress = sentences.length > 0 ? ((currentSentenceIndex + 1) / sentences.length) * 100 : 0;

  useEffect(() => {
    if (!isOpen) {
      setCurrentSentenceIndex(0);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isOpen]);

  const handlePlayPause = () => {
    if (!currentSentence?.audio_url) {
      // For now, we'll use text-to-speech or show a message
      toast.info('Audio not available for this sentence');
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleNext = async () => {
    if (currentSentenceIndex < sentences.length - 1) {
      const nextIndex = currentSentenceIndex + 1;
      setCurrentSentenceIndex(nextIndex);
      
      // Update progress
      try {
        await updateProgress(exercise.id, nextIndex + 1, sentences.length);
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    } else {
      // Exercise completed
      toast.success('Shadowing exercise completed!');
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1);
    }
  };

  const handleRestart = () => {
    setCurrentSentenceIndex(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const toggleTextVisibility = () => {
    setShowText(!showText);
  };

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{exercise.title}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{exercise.difficulty_level}</Badge>
              <Badge variant="secondary">
                {currentSentenceIndex + 1} / {sentences.length}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Practice Mode Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={practiceMode === 'listening' ? 'default' : 'outline'}
              onClick={() => setPracticeMode('listening')}
              size="sm"
            >
              Listening Only
            </Button>
            <Button
              variant={practiceMode === 'shadowing' ? 'default' : 'outline'}
              onClick={() => setPracticeMode('shadowing')}
              size="sm"
            >
              Shadowing
            </Button>
          </div>

          {/* Main Practice Area */}
          <Card className="p-6">
            <CardContent className="space-y-4">
              {/* Current Sentence */}
              <div className="text-center space-y-4">
                {showText && (
                  <div className="text-2xl font-medium leading-relaxed">
                    {currentSentence?.text || 'No text available'}
                  </div>
                )}
                
                {practiceMode === 'shadowing' && (
                  <div className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg">
                    <strong>Shadowing Mode:</strong> Listen to the audio and repeat the sentence 
                    while it's playing. Try to match the rhythm, intonation, and pronunciation.
                  </div>
                )}
                
                {practiceMode === 'listening' && (
                  <div className="text-sm text-muted-foreground bg-green-50 p-4 rounded-lg">
                    <strong>Listening Mode:</strong> Focus on understanding the sentence. 
                    Listen multiple times if needed.
                  </div>
                )}
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePlayPause}
                  className="h-12 w-12"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRestart}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTextVisibility}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  {showText ? 'Hide Text' : 'Show Text'}
                </Button>
              </div>

              {/* Playback Speed */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Speed:</span>
                {[0.5, 0.75, 1, 1.25, 1.5].map((speed) => (
                  <Button
                    key={speed}
                    variant={playbackSpeed === speed ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlaybackSpeed(speed)}
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentSentenceIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Sentence {currentSentenceIndex + 1} of {sentences.length}
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={currentSentenceIndex >= sentences.length - 1}
            >
              {currentSentenceIndex >= sentences.length - 1 ? 'Complete' : 'Next'}
              {currentSentenceIndex < sentences.length - 1 && (
                <ChevronRight className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• Use the speed controls to adjust playback speed for your comfort level</p>
            <p>• In Shadowing mode, try to speak along with the audio simultaneously</p>
            <p>• In Listening mode, focus on comprehension and pronunciation patterns</p>
          </div>
        </div>

        {/* Hidden audio element */}
        {currentSentence?.audio_url && (
          <audio
            ref={audioRef}
            src={currentSentence.audio_url}
            onEnded={() => setIsPlaying(false)}
            onLoadStart={() => console.log('Audio loading...')}
            onError={(e) => {
              console.error('Audio error:', e);
              toast.error('Error loading audio');
              setIsPlaying(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
