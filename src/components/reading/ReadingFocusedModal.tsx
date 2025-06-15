
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, X, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
import { ReadingExercise } from '@/types/reading';
import { InteractiveText } from './InteractiveText';
import { AudioGenerationStatus } from './AudioGenerationStatus';
import { useIsMobile } from '@/hooks/use-mobile';
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
  enableWordSynchronization?: boolean;
  enableContextMenu?: boolean;
  enableSelectionFeedback?: boolean;
  enableSmartTextProcessing?: boolean;
}

export const ReadingFocusedModal: React.FC<ReadingFocusedModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onCreateDictation,
  onCreateBidirectional,
  enableTextSelection = false,
  enableVocabularyIntegration = false,
  enableEnhancedHighlighting = false,
  enableFullTextAudio = false,
  enableWordSynchronization = false,
  enableContextMenu = false,
  enableSelectionFeedback = false,
  enableSmartTextProcessing = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioGenerationStatus, setAudioGenerationStatus] = useState<string>('pending');
  const isMobile = useIsMobile();

  useEffect(() => {
    // Cleanup audio when modal closes or exercise changes
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        setCurrentAudio(null);
        setIsPlaying(false);
      }
    };
  }, [exercise?.id, isOpen]);

  const playFullTextAudio = async () => {
    if (!exercise) return;

    // Check if we have a full text audio URL
    const audioUrl = exercise.full_text_audio_url || exercise.audio_url;
    
    if (!audioUrl) {
      setAudioError('No audio available for this exercise');
      toast.error('Audio is not available yet');
      return;
    }

    try {
      if (currentAudio && !currentAudio.paused) {
        // Pause current audio
        currentAudio.pause();
        setIsPlaying(false);
        return;
      }

      // Create new audio instance
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      setAudioError(null);

      audio.addEventListener('loadstart', () => {
        console.log('[AUDIO] Loading started for:', audioUrl);
      });

      audio.addEventListener('canplay', () => {
        console.log('[AUDIO] Can start playing');
        setIsPlaying(true);
        audio.play().catch(error => {
          console.error('[AUDIO] Play failed:', error);
          setAudioError('Failed to play audio');
          setIsPlaying(false);
        });
      });

      audio.addEventListener('ended', () => {
        console.log('[AUDIO] Playback ended');
        setIsPlaying(false);
      });

      audio.addEventListener('error', (e) => {
        console.error('[AUDIO] Audio error:', e);
        setAudioError('Failed to load audio');
        setIsPlaying(false);
        toast.error('Audio playback failed');
      });

      // Start loading the audio
      audio.load();

    } catch (error) {
      console.error('[AUDIO] Error creating audio:', error);
      setAudioError('Failed to initialize audio');
      setIsPlaying(false);
      toast.error('Audio initialization failed');
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const getAudioButtonState = () => {
    if (audioGenerationStatus === 'generating' || audioGenerationStatus === 'pending') {
      return { disabled: true, text: 'Generating Audio...', icon: Volume2 };
    }
    
    if (audioGenerationStatus === 'failed') {
      return { disabled: true, text: 'Audio Failed', icon: AlertCircle };
    }

    const hasAudio = exercise?.full_text_audio_url || exercise?.audio_url;
    if (!hasAudio) {
      return { disabled: true, text: 'No Audio Available', icon: Volume2 };
    }

    return {
      disabled: false,
      text: isPlaying ? 'Pause Audio' : 'Play Full Text',
      icon: isPlaying ? Pause : Play
    };
  };

  const handleTextSelection = (selectedText: string) => {
    console.log('[MODAL] Text selected:', selectedText);
    // Handle text selection based on feature flags
    if (enableSelectionFeedback) {
      toast.success(`Selected: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
    }
  };

  const handleCreateDictation = (selectedText: string) => {
    if (onCreateDictation) {
      onCreateDictation(selectedText);
    } else {
      toast.success(`Dictation exercise ready for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
    }
  };

  const handleCreateBidirectional = (selectedText: string) => {
    if (onCreateBidirectional) {
      onCreateBidirectional(selectedText);
    } else {
      toast.success(`Translation exercise ready for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
    }
  };

  if (!exercise) return null;

  const audioButton = getAudioButtonState();
  const IconComponent = audioButton.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'w-full h-full max-w-full max-h-full m-0 rounded-none' : 'max-w-4xl max-h-[90vh]'} overflow-hidden flex flex-col`}>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Volume2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">{exercise.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {exercise.language}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {exercise.difficulty_level}
                  </Badge>
                  {exercise.audio_generation_status === 'completed' && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      Audio Ready
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {enableFullTextAudio && (
                <>
                  <Button
                    onClick={playFullTextAudio}
                    disabled={audioButton.disabled}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <IconComponent className="h-4 w-4" />
                    {!isMobile && audioButton.text}
                  </Button>
                  
                  {isPlaying && (
                    <Button
                      onClick={stopAudio}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {/* Audio Generation Status */}
          <AudioGenerationStatus 
            exerciseId={exercise.id}
            onStatusChange={setAudioGenerationStatus}
          />

          {/* Audio Error Display */}
          {audioError && (
            <Card className="mb-4 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{audioError}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interactive Reading Content */}
          <Card className="min-h-[400px]">
            <CardContent className="p-6">
              <InteractiveText
                text={exercise.content.sentences.map(s => s.text).join(' ')}
                sentences={exercise.content.sentences}
                language={exercise.language}
                exerciseId={exercise.id}
                enableTooltips={enableVocabularyIntegration}
                enableTextSelection={enableTextSelection}
                enableHighlighting={enableEnhancedHighlighting}
                enableWordSync={enableWordSynchronization}
                enableContextMenu={enableContextMenu}
                enableSmartProcessing={enableSmartTextProcessing}
                onTextSelection={handleTextSelection}
                onCreateDictation={handleCreateDictation}
                onCreateBidirectional={handleCreateBidirectional}
                currentAudio={currentAudio}
                isPlaying={isPlaying}
              />
            </CardContent>
          </Card>

          {/* Exercise Analysis */}
          {exercise.content.analysis && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Exercise Analysis</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Word Count:</span>
                    <p className="font-medium">{exercise.content.analysis.wordCount}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Reading Time:</span>
                    <p className="font-medium">{exercise.content.analysis.readingTime} min</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Sentences:</span>
                    <p className="font-medium">{exercise.content.sentences.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Difficulty:</span>
                    <p className="font-medium capitalize">{exercise.difficulty_level}</p>
                  </div>
                </div>
                
                {exercise.content.analysis.grammarPoints && exercise.content.analysis.grammarPoints.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-600 text-sm">Grammar Focus:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exercise.content.analysis.grammarPoints.map((point, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
