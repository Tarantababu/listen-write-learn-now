
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen,
  Mic,
  Plus
} from 'lucide-react';
import { ReadingExercise } from '@/types/reading';
import { EnhancedInteractiveText } from './EnhancedInteractiveText';
import { AudioWordSynchronizer } from './AudioWordSynchronizer';
import { SynchronizedText } from './SynchronizedText';
import { AdvancedAudioControls } from './AdvancedAudioControls';
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
  enableWordSynchronization?: boolean; // New feature flag for Phase 2
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
  enableFullTextAudio = true,
  enableWordSynchronization = true // Default to true for Phase 2
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  
  const isMobile = useIsMobile();

  // Generate full-text audio
  const generateFullTextAudio = async () => {
    if (!exercise || !enableFullTextAudio) return;
    
    try {
      setIsGeneratingAudio(true);
      const fullText = exercise.content.sentences.map(s => s.text).join(' ');
      const generatedAudioUrl = await readingExerciseService.generateAudio(fullText, exercise.language);
      setAudioUrl(generatedAudioUrl);
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

  const togglePlayPause = async (audioRef: React.RefObject<HTMLAudioElement>) => {
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

  const skipBackward = (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };

  const skipForward = (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioDuration, audioRef.current.currentTime + 10);
  };

  const restart = (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentPosition(0);
    setHighlightedWordIndex(-1);
  };

  const seekTo = (audioRef: React.RefObject<HTMLAudioElement>, time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
  };

  const changeSpeed = (newSpeed: number) => {
    setAudioSpeed(newSpeed);
  };

  const handleWordHighlight = (wordIndex: number) => {
    setHighlightedWordIndex(wordIndex);
  };

  const handleTimeUpdate = (currentTime: number) => {
    setCurrentPosition(currentTime);
  };

  const handleLoadedMetadata = (duration: number) => {
    setAudioDuration(duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentPosition(0);
    setHighlightedWordIndex(-1);
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
  const totalWords = fullText.split(/\s+/).length;

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
                  {enableWordSynchronization && (
                    <Badge variant="outline" className="text-xs">
                      Word Sync
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Advanced Audio Controls */}
        {enableFullTextAudio && (
          <div className="flex-shrink-0 mb-4">
            <AudioWordSynchronizer
              audioUrl={audioUrl}
              text={fullText}
              onWordHighlight={handleWordHighlight}
              onTimeUpdate={handleTimeUpdate}
              isPlaying={isPlaying}
              playbackRate={audioSpeed}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
            >
              {(audioRef) => (
                <AdvancedAudioControls
                  isPlaying={isPlaying}
                  isGeneratingAudio={isGeneratingAudio}
                  audioEnabled={audioEnabled}
                  currentPosition={currentPosition}
                  audioDuration={audioDuration}
                  audioSpeed={audioSpeed}
                  showSettings={showSettings}
                  highlightedWordIndex={highlightedWordIndex}
                  totalWords={totalWords}
                  onTogglePlayPause={() => togglePlayPause(audioRef)}
                  onSkipBackward={() => skipBackward(audioRef)}
                  onSkipForward={() => skipForward(audioRef)}
                  onRestart={() => restart(audioRef)}
                  onToggleAudio={() => setAudioEnabled(!audioEnabled)}
                  onToggleSettings={() => setShowSettings(!showSettings)}
                  onChangeSpeed={changeSpeed}
                  onSeek={(time) => seekTo(audioRef, time)}
                />
              )}
            </AudioWordSynchronizer>
          </div>
        )}

        <Separator className="flex-shrink-0" />

        {/* Main Reading Content */}
        <div className="flex-1 overflow-auto">
          <Card className="p-6 h-full">
            {enableWordSynchronization && enableFullTextAudio ? (
              <SynchronizedText
                text={fullText}
                highlightedWordIndex={highlightedWordIndex}
                enableWordHighlighting={true}
                className={isMobile ? 'text-base' : 'text-lg'}
              />
            ) : (
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
            )}
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
      </DialogContent>
    </Dialog>
  );
};
