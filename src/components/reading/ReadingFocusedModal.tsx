import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BookOpen,
  Mic,
  Plus,
  Languages,
  RefreshCw,
  AlertTriangle,
  Volume2,
  Info
} from 'lucide-react'
import { ReadingExercise } from '@/types/reading'
import { Language } from '@/types'
import { EnhancedInteractiveText } from './EnhancedInteractiveText'
import { AudioWordSynchronizer } from './AudioWordSynchronizer'
import { SynchronizedTextWithSelection } from './SynchronizedTextWithSelection'
import { AdvancedAudioControls } from './AdvancedAudioControls'
import { SimpleTranslationAnalysis } from './SimpleTranslationAnalysis'
import { ReadingViewToggle } from '@/components/ui/reading-view-toggle'
import { FullScreenReadingOverlay } from './FullScreenReadingOverlay'
import { useFullScreenReading } from '@/hooks/use-full-screen-reading'
import { useIsMobile } from '@/hooks/use-mobile'
import { useReadingAudio } from '@/hooks/useReadingAudio'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReadingFocusedModalProps {
  exercise: ReadingExercise | null
  isOpen: boolean
  onClose: () => void
  onCreateDictation?: (selectedText: string) => void
  onCreateBidirectional?: (selectedText: string) => void
  // Feature flags
  enableTextSelection?: boolean
  enableVocabularyIntegration?: boolean
  enableEnhancedHighlighting?: boolean
  enableFullTextAudio?: boolean
  enableWordSynchronization?: boolean
  enableContextMenu?: boolean
  enableSelectionFeedback?: boolean
  enableSmartTextProcessing?: boolean
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
  enableWordSynchronization = true,
  enableContextMenu = true,
  enableSelectionFeedback = true,
  enableSmartTextProcessing = true
}) => {
  // Log exercise data on component mount and updates
  useEffect(() => {
    console.log('[READING MODAL] Exercise prop updated:', {
      exercise_id: exercise?.id,
      exercise_title: exercise?.title,
      exercise_audio_url: exercise?.audio_url,
      exercise_full_text_audio_url: exercise?.full_text_audio_url,
      exercise_audio_status: exercise?.audio_generation_status,
      isOpen
    });
  }, [exercise, isOpen]);

  const [isPlaying, setIsPlaying] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioSpeed, setAudioSpeed] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1)
  const [showTranslationAnalysis, setShowTranslationAnalysis] = useState(false)
  
  const { viewMode, cycleViewMode, isFullScreen } = useFullScreenReading()
  const isMobile = useIsMobile()

  // Enhanced audio hook with auto-retry disabled (we'll handle it manually)
  const {
    audioUrl,
    isInitialized: audioInitialized,
    hasAudioIssue,
    accessibilityUncertain,
    isRetrying,
    setIsPlaying: updatePlayingState,
    setCurrentPosition: updateCurrentPosition,
    setDuration: updateDuration,
    retryAudioGeneration
  } = useReadingAudio({
    exercise,
    enabled: enableFullTextAudio && isOpen,
    autoRetry: false
  });

  // Log audio hook results
  useEffect(() => {
    console.log('[READING MODAL] Audio hook results:', {
      audioUrl: !!audioUrl,
      audioUrlValue: audioUrl,
      audioInitialized,
      hasAudioIssue,
      accessibilityUncertain,
      isRetrying,
      enableFullTextAudio,
      isOpen
    });
  }, [audioUrl, audioInitialized, hasAudioIssue, accessibilityUncertain, isRetrying, enableFullTextAudio, isOpen]);

  const togglePlayPause = async (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (!audioRef.current || !audioEnabled || !audioUrl) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        updatePlayingState(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
        updatePlayingState(true);
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
    updateCurrentPosition(0);
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
    updateCurrentPosition(currentTime);
  };

  const handleLoadedMetadata = (duration: number) => {
    setAudioDuration(duration);
    updateDuration(duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    updatePlayingState(false);
    setCurrentPosition(0);
    updateCurrentPosition(0);
    setHighlightedWordIndex(-1);
  };

  const handleCreateDictation = (selectedText: string) => {
    console.log('Creating dictation for:', selectedText);
    if (onCreateDictation) {
      onCreateDictation(selectedText);
    } else {
      toast.success(`Ready to create dictation exercise for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
    }
  };

  const handleCreateBidirectional = (selectedText: string) => {
    console.log('Creating bidirectional for:', selectedText);
    if (onCreateBidirectional) {
      onCreateBidirectional(selectedText);
    } else {
      toast.success(`Ready to create translation exercise for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
    }
  };

  const handleAnalyzeTranslation = () => {
    setShowTranslationAnalysis(true);
  };

  const handleRetryAudio = async () => {
    try {
      await retryAudioGeneration();
      toast.success('Audio regeneration started');
    } catch (error) {
      console.error('Audio retry failed:', error);
      toast.error('Failed to regenerate audio');
    }
  };

  if (!exercise) return null

  const fullText = exercise.content.sentences.map(s => s.text).join(' ')
  const totalWords = fullText.split(/\s+/).length
  const exerciseLanguage = exercise.language as Language

  // Enhanced text size scaling for better full-screen reading
  const getTextSize = () => {
    if (isMobile) {
      switch (viewMode) {
        case 'normal': return 'text-base leading-relaxed';
        case 'expanded': return 'text-lg leading-relaxed';
        case 'fullscreen': return 'text-2xl leading-loose max-w-none';
        default: return 'text-base leading-relaxed';
      }
    } else {
      switch (viewMode) {
        case 'normal': return 'text-lg leading-relaxed';
        case 'expanded': return 'text-xl leading-relaxed';
        case 'fullscreen': return 'text-3xl leading-loose max-w-none';
        default: return 'text-lg leading-relaxed';
      }
    }
  };

  // More permissive audio availability check
  const hasAudio = audioInitialized && audioUrl;
  const showAudioIssueWarning = audioInitialized && hasAudioIssue && !audioUrl;
  const showAccessibilityWarning = audioInitialized && audioUrl && accessibilityUncertain;

  console.log('[READING MODAL] Audio status computed:', {
    audioInitialized,
    audioUrl: !!audioUrl,
    hasAudioIssue,
    accessibilityUncertain,
    hasAudio,
    showAudioIssueWarning,
    showAccessibilityWarning,
    exercise_audio_status: exercise.audio_generation_status
  });

  // Render the reading content with optimized full-screen layout
  const renderReadingContent = () => (
    <>
      {/* Audio Issue Warning */}
      {showAudioIssueWarning && !showTranslationAnalysis && (
        <Alert className="mb-4 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>Audio is not available for this exercise</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryAudio}
                disabled={isRetrying}
                className="ml-2 border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate Audio
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Accessibility Warning */}
      {showAccessibilityWarning && !showTranslationAnalysis && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Audio is available but network connectivity may affect playback quality.
          </AlertDescription>
        </Alert>
      )}

      {/* Audio Controls - More permissive display logic */}
      {enableFullTextAudio && !showTranslationAnalysis && (
        <div className={cn(
          "flex-shrink-0",
          isFullScreen ? "mb-8" : "mb-4"
        )}>
          {hasAudio ? (
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
                  isGeneratingAudio={false}
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
          ) : audioInitialized ? null : (
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-3" />
              <span className="text-blue-700">Loading audio...</span>
            </div>
          )}
        </div>
      )}

      {!isFullScreen && <Separator className="flex-shrink-0" />}

      {/* Main Content - Optimized for full-screen reading */}
      <div className="flex-1 overflow-auto min-h-0">
        {isFullScreen ? (
          // Full-screen mode: Remove Card wrapper and maximize text area
          <div className={cn(
            "h-full w-full",
            isFullScreen && "px-4 py-2"
          )}>
            {showTranslationAnalysis ? (
              <SimpleTranslationAnalysis
                text={fullText}
                sourceLanguage={exerciseLanguage}
                onClose={() => setShowTranslationAnalysis(false)}
              />
            ) : (
              <>
                {enableTextSelection ? (
                  <SynchronizedTextWithSelection
                    text={fullText}
                    highlightedWordIndex={highlightedWordIndex}
                    enableWordHighlighting={Boolean(enableWordSynchronization && hasAudio)}
                    className={cn(
                      "transition-all duration-300",
                      getTextSize(),
                      isFullScreen && "w-full"
                    )}
                    onCreateDictation={handleCreateDictation}
                    onCreateBidirectional={handleCreateBidirectional}
                    exerciseId={exercise.id}
                    exerciseLanguage={exerciseLanguage}
                    enableTextSelection={Boolean(enableTextSelection)}
                    enableVocabulary={Boolean(enableVocabularyIntegration)}
                    enhancedHighlighting={Boolean(enableEnhancedHighlighting)}
                    vocabularyIntegration={Boolean(enableVocabularyIntegration)}
                    enableContextMenu={Boolean(enableContextMenu)}
                  />
                ) : (
                  <EnhancedInteractiveText
                    text={fullText}
                    language={exerciseLanguage}
                    enableTooltips={true}
                    enableBidirectionalCreation={true}
                    enableTextSelection={false}
                    vocabularyIntegration={false}
                    enhancedHighlighting={false}
                    exerciseId={exercise.id}
                    onCreateDictation={handleCreateDictation}
                    onCreateBidirectional={handleCreateBidirectional}
                    className={cn(
                      "transition-all duration-300",
                      getTextSize(),
                      isFullScreen && "w-full"
                    )}
                  />
                )}
              </>
            )}
          </div>
        ) : (
          // Normal/expanded mode: Keep Card wrapper
          <Card className={cn(
            "h-full transition-all duration-300",
            viewMode === 'expanded' ? "p-8" : "p-6"
          )}>
            {showTranslationAnalysis ? (
              <SimpleTranslationAnalysis
                text={fullText}
                sourceLanguage={exerciseLanguage}
                onClose={() => setShowTranslationAnalysis(false)}
              />
            ) : (
              <>
                {enableTextSelection ? (
                  <SynchronizedTextWithSelection
                    text={fullText}
                    highlightedWordIndex={highlightedWordIndex}
                    enableWordHighlighting={Boolean(enableWordSynchronization && hasAudio)}
                    className={cn(
                      "transition-all duration-300",
                      getTextSize()
                    )}
                    onCreateDictation={handleCreateDictation}
                    onCreateBidirectional={handleCreateBidirectional}
                    exerciseId={exercise.id}
                    exerciseLanguage={exerciseLanguage}
                    enableTextSelection={Boolean(enableTextSelection)}
                    enableVocabulary={Boolean(enableVocabularyIntegration)}
                    enhancedHighlighting={Boolean(enableEnhancedHighlighting)}
                    vocabularyIntegration={Boolean(enableVocabularyIntegration)}
                    enableContextMenu={Boolean(enableContextMenu)}
                  />
                ) : (
                  <EnhancedInteractiveText
                    text={fullText}
                    language={exerciseLanguage}
                    enableTooltips={true}
                    enableBidirectionalCreation={true}
                    enableTextSelection={false}
                    vocabularyIntegration={false}
                    enhancedHighlighting={false}
                    exerciseId={exercise.id}
                    onCreateDictation={handleCreateDictation}
                    onCreateBidirectional={handleCreateBidirectional}
                    className={cn(
                      "transition-all duration-300",
                      getTextSize()
                    )}
                  />
                )}
              </>
            )}
          </Card>
        )}
      </div>

      {/* Quick Actions - Mobile (only show when not in full-screen) */}
      {isMobile && !showTranslationAnalysis && !isFullScreen && (
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyzeTranslation}
            >
              <Languages className="h-4 w-4 mr-1" />
              Analyze
            </Button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <Dialog open={isOpen && !isFullScreen} onOpenChange={onClose}>
        <DialogContent className={cn(
          "overflow-hidden flex flex-col transition-all duration-300",
          isMobile 
            ? "w-full h-full max-w-full max-h-full m-0 rounded-none" 
            : viewMode === 'expanded'
              ? "max-w-7xl max-h-[95vh]" 
              : "max-w-4xl max-h-[95vh]"
        )}>
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
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {exercise.language}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {exercise.difficulty_level}
                    </Badge>
                    {hasAudio && enableWordSynchronization && (
                      <Badge variant="outline" className="text-xs">
                        <Volume2 className="h-3 w-3 mr-1" />
                        Audio Sync
                      </Badge>
                    )}
                    {enableContextMenu && (
                      <Badge variant="outline" className="text-xs">
                        Enhanced Selection
                      </Badge>
                    )}
                    {/* Enhanced audio status indicator */}
                    {exercise.audio_generation_status && (
                      <Badge 
                        variant={
                          hasAudio && !accessibilityUncertain ? 'default' : 
                          hasAudio && accessibilityUncertain ? 'outline' :
                          hasAudioIssue ? 'destructive' :
                          exercise.audio_generation_status === 'failed' ? 'destructive' : 'outline'
                        }
                        className="text-xs"
                      >
                        Audio: {
                          hasAudio && !accessibilityUncertain ? 'Ready' :
                          hasAudio && accessibilityUncertain ? 'Available' :
                          hasAudioIssue ? 'Issue' :
                          exercise.audio_generation_status
                        }
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <ReadingViewToggle
                  viewMode={viewMode}
                  onToggle={cycleViewMode}
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeTranslation}
                  className="flex items-center gap-2"
                >
                  <Languages className="h-4 w-4" />
                  Analyze
                </Button>
              </div>
            </div>
          </DialogHeader>

          {renderReadingContent()}
        </DialogContent>
      </Dialog>

      {/* Full-screen overlay */}
      <FullScreenReadingOverlay
        title={exercise.title}
        language={exercise.language}
        difficulty={exercise.difficulty_level}
        viewMode={viewMode}
        onToggleView={cycleViewMode}
        onClose={onClose}
        onAnalyze={handleAnalyzeTranslation}
      >
        {renderReadingContent()}
      </FullScreenReadingOverlay>
    </>
  )
}
