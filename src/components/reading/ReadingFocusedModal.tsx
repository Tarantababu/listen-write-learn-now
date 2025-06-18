import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw,
  BookOpen,
  Headphones,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ReadingExercise } from '@/types/reading';
import { SynchronizedTextWithSelection } from './SynchronizedTextWithSelection';
import { ViewToggle } from './ViewToggle';
import { SelectionActions } from './SelectionActions';
import { MobileReadingNavigation } from './MobileReadingNavigation';
import { AdvancedAudioControls } from './AdvancedAudioControls';
import { useIsMobile } from '@/hooks/use-mobile';
import { enhancedTtsService } from '@/services/enhancedTtsService';

interface ReadingFocusedModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: ReadingExercise | null;
  onCreateDictation: (selectedText: string) => Promise<void>;
  onCreateBidirectional: (selectedText: string) => void;
  enableTextSelection?: boolean;
  enableVocabularyIntegration?: boolean;
  enableEnhancedHighlighting?: boolean;
  enableFullTextAudio?: boolean;
  enableWordSynchronization?: boolean;
  enableContextMenu?: boolean;
  enableSelectionFeedback?: boolean;
  enableSmartTextProcessing?: boolean;
}

export const ReadingFocusedModal: React.FC<ReadingFocusedModalProps> = ({
  isOpen,
  onClose,
  exercise,
  onCreateDictation,
  onCreateBidirectional,
  enableTextSelection = true,
  enableVocabularyIntegration = true,
  enableEnhancedHighlighting = true,
  enableFullTextAudio = true,
  enableWordSynchronization = true,
  enableContextMenu = true,
  enableSelectionFeedback = true,
  enableSmartTextProcessing = true,
}) => {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [audioGenerationError, setAudioGenerationError] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [viewMode, setViewMode] = useState<'text' | 'analysis'>('text');
  const [isMobileView, setIsMobileView] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1); // Default playback rate
  const [volume, setVolume] = useState(1); // Default volume
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsMobileView(isMobile);
  }, [isMobile]);

  // Load audio on exercise change
  useEffect(() => {
    if (exercise?.audioUrl) {
      setGeneratedAudioUrl(exercise.audioUrl);
      setAudioGenerationError(null);
    }
  }, [exercise?.audioUrl]);

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      if (generatedAudioUrl) {
        audioRef.current.src = generatedAudioUrl;
        audioRef.current.play().catch(error => {
          console.error("Playback failed:", error);
          setAudioGenerationError("Failed to play audio. Please try again.");
        });
        setIsAudioPlaying(true);
      } else {
        generateFullTextAudio();
      }
    }
  };

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleTextSelection = useCallback((text: string) => {
    setIsTextSelected(!!text);
    setSelectedText(text);
  }, []);

  const clearSelection = () => {
    setIsTextSelected(false);
    setSelectedText('');
  };

  const handleDownloadAudio = () => {
    if (!generatedAudioUrl) return;

    const link = document.createElement('a');
    link.href = generatedAudioUrl;
    link.download = `${exercise?.title || 'reading_audio'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateFullTextAudio = async () => {
    if (!exercise?.text || isGeneratingAudio) return;
    
    setIsGeneratingAudio(true);
    setAudioGenerationError(null);
    
    try {
      console.log('Generating full-text audio using enhanced TTS service');
      
      // Use the enhanced TTS service with progress tracking
      const result = await enhancedTtsService.generateAudio({
        text: exercise.text,
        language: exercise.language,
        chunkSize: 'auto',
        onProgress: (progress) => {
          console.log(`Audio generation progress: ${progress.progress}% - ${progress.message}`);
          // You could add a progress state here if needed
        }
      });
      
      setGeneratedAudioUrl(result.audioUrl);
      console.log('Full-text audio generated successfully');
      
    } catch (error) {
      console.error('Error generating full-text audio:', error);
      setAudioGenerationError(error instanceof Error ? error.message : 'Failed to generate audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} className="relative">
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              {exercise?.title}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Audio Controls */}
          {enableFullTextAudio && (
            <Card className="bg-gray-50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {generatedAudioUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAudio}
                      disabled={isGeneratingAudio}
                    >
                      {isGeneratingAudio ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : isAudioPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Play
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateFullTextAudio}
                      disabled={isGeneratingAudio}
                    >
                      {isGeneratingAudio ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Headphones className="h-4 w-4 mr-2" />
                          Generate Audio
                        </>
                      )}
                    </Button>
                  )}

                  {generatedAudioUrl && (
                    <Button variant="ghost" size="sm" onClick={resetAudio} title="Reset Playback">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Audio Error Message */}
                {audioGenerationError && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {audioGenerationError}
                  </Badge>
                )}

                <div className="flex items-center gap-3">
                  {generatedAudioUrl && (
                    <Button variant="ghost" size="sm" onClick={handleDownloadAudio} title="Download Audio">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <AdvancedAudioControls
                    audioRef={audioRef}
                    playbackRate={playbackRate}
                    setPlaybackRate={setPlaybackRate}
                    volume={volume}
                    setVolume={setVolume}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Display */}
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          {viewMode === 'text' ? (
            <Card>
              <CardContent className="relative">
                {exercise?.text ? (
                  <SynchronizedTextWithSelection
                    text={exercise.text}
                    audioUrl={generatedAudioUrl || ''}
                    audioRef={audioRef}
                    isAudioPlaying={isAudioPlaying}
                    playbackRate={playbackRate}
                    volume={volume}
                    onTextSelection={handleTextSelection}
                    enableTextSelection={enableTextSelection}
                    enableVocabularyIntegration={enableVocabularyIntegration}
                    enableEnhancedHighlighting={enableEnhancedHighlighting}
                    enableWordSynchronization={enableWordSynchronization}
                    enableContextMenu={enableContextMenu}
                    enableSelectionFeedback={enableSelectionFeedback}
                    enableSmartTextProcessing={enableSmartTextProcessing}
                  />
                ) : (
                  <div className="text-center py-8">No text available for this exercise.</div>
                )}
                <audio ref={audioRef} src={generatedAudioUrl || ''} preload="metadata" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <ReadingAnalysisPlaceholder />
              </CardContent>
            </Card>
          )}

          {/* Mobile Navigation - Always Visible */}
          {isMobileView && (
            <MobileReadingNavigation
              onClose={onClose}
              isTextSelected={isTextSelected}
              onCreateDictation={() => selectedText && onCreateDictation(selectedText)}
              onCreateBidirectional={() => selectedText && onCreateBidirectional(selectedText)}
              clearSelection={clearSelection}
              enableTextSelection={enableTextSelection}
            />
          )}

          {/* Desktop Selection Actions - Only Visible when Text is Selected */}
          {!isMobileView && isTextSelected && (
            <SelectionActions
              selectedText={selectedText}
              onCreateDictation={onCreateDictation}
              onCreateBidirectional={onCreateBidirectional}
              clearSelection={clearSelection}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ReadingAnalysisPlaceholder: React.FC = () => {
  return (
    <div className="text-center py-8">
      <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-muted-foreground">Analysis View Coming Soon!</h3>
      <p className="text-sm text-muted-foreground">
        This feature is under development. Stay tuned for updates!
      </p>
    </div>
  );
};
