
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  BookOpen,
  Mic,
  Plus,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { ReadingExercise } from '@/types/reading';
import { EnhancedInteractiveText } from './EnhancedInteractiveText';
import { useIsMobile } from '@/hooks/use-mobile';
import { readingExerciseService } from '@/services/readingExerciseService';
import { toast } from 'sonner';

interface ReadingFocusedModalProps {
  exercise: ReadingExercise | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateDictation?: (selectedText: string) => void;
  onCreateBidirectional?: (selectedText: string) => void;
  // Feature flags
  enableTextSelection?: boolean;
  enableVocabularyIntegration?: boolean;
  enableEnhancedHighlighting?: boolean;
  enableFullTextAudio?: boolean;
}

export const ReadingFocusedModal: React.FC<ReadingFocusedModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onCreateDictation,
  onCreateBidirectional,
  enableTextSelection = true,
  enableVocabularyIntegration = true,
  enableEnhancedHighlighting = true,
  enableFullTextAudio = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const isMobile = useIsMobile();

  // Generate full-text audio
  const generateFullTextAudio = async () => {
    if (!exercise || !enableFullTextAudio) return;
    
    try {
      setIsGeneratingAudio(true);
      const fullText = exercise.content.sentences.map(s => s.text).join(' ');
      const audioUrl = await readingExerciseService.generateAudio(fullText, exercise.language);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
      }
    } catch (error) {
      console.error('Error generating full-text audio:', error);
      toast.error('Failed to generate audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Initialize audio when exercise changes
  useEffect(() => {
    if (exercise && isOpen && enableFullTextAudio) {
      generateFullTextAudio();
    }
  }, [exercise, isOpen, enableFullTextAudio]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentPosition(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPosition(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = async () => {
    if (!audioRef.current || !audioEnabled) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      toast.error('Audio playback failed');
    }
  };

  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };

  const skipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioDuration, audioRef.current.currentTime + 10);
  };

  const changeSpeed = (newSpeed: number) => {
    setAudioSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateDictation = (selectedText: string) => {
    if (onCreateDictation) {
      onCreateDictation(selectedText);
    } else {
      toast.success(`Ready to create dictation exercise for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
    }
  };

  const handleCreateBidirectional = (selectedText: string) => {
    if (onCreateBidirectional) {
      onCreateBidirectional(selectedText);
    } else {
      toast.success(`Ready to create translation exercise for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
    }
  };

  if (!exercise) return null;

  const fullText = exercise.content.sentences.map(s => s.text).join(' ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'w-full h-full max-w-full max-h-full m-0 rounded-none' : 'max-w-4xl max-h-[95vh]'} overflow-hidden flex flex-col`}>
        <DialogHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold line-clamp-2`}>
                  {exercise.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {exercise.language}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {exercise.difficulty_level}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Audio Controls */}
        {enableFullTextAudio && (
          <Card className="flex-shrink-0 p-4 mb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipBackward}
                    disabled={!audioEnabled || isGeneratingAudio}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePlayPause}
                    disabled={!audioEnabled || isGeneratingAudio}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipForward}
                    disabled={!audioEnabled || isGeneratingAudio}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  {formatTime(currentPosition)} / {formatTime(audioDuration)}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${audioDuration > 0 ? (currentPosition / audioDuration) * 100 : 0}%` }}
                />
              </div>

              {/* Speed controls */}
              {showSettings && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Speed:</span>
                  {[0.5, 0.75, 1, 1.25, 1.5].map(speed => (
                    <Button
                      key={speed}
                      variant={audioSpeed === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => changeSpeed(speed)}
                      className="text-xs"
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              )}

              {isGeneratingAudio && (
                <div className="text-center text-sm text-muted-foreground">
                  Generating audio...
                </div>
              )}
            </div>
          </Card>
        )}

        <Separator className="flex-shrink-0" />

        {/* Main Reading Content */}
        <div className="flex-1 overflow-auto">
          <Card className="p-6 h-full">
            <EnhancedInteractiveText
              text={fullText}
              language={exercise.language}
              enableTooltips={true}
              enableBidirectionalCreation={true}
              enableTextSelection={enableTextSelection}
              vocabularyIntegration={enableVocabularyIntegration}
              enhancedHighlighting={enableEnhancedHighlighting}
              exerciseId={exercise.id}
              onCreateDictation={handleCreateDictation}
              onCreateBidirectional={handleCreateBidirectional}
            />
          </Card>
        </div>

        {/* Quick Actions - Mobile */}
        {isMobile && (
          <div className="flex-shrink-0 border-t p-4 bg-gray-50">
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateDictation(fullText)}
              >
                <Mic className="h-4 w-4 mr-1" />
                Dictation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateBidirectional(fullText)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Translation
              </Button>
            </div>
          </div>
        )}

        <audio
          ref={audioRef}
          onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)}
          onTimeUpdate={() => setCurrentPosition(audioRef.current?.currentTime || 0)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentPosition(0);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
