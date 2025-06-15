
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  BookOpen,
  Mic,
  Plus,
  Languages
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
import { readingExerciseService } from '@/services/readingExerciseService'
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioSpeed, setAudioSpeed] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1)
  const [showTranslationAnalysis, setShowTranslationAnalysis] = useState(false)
  
  const { viewMode, cycleViewMode, isFullScreen } = useFullScreenReading()
  const isMobile = useIsMobile()

  // Debug logging for feature flags
  useEffect(() => {
    if (exercise && isOpen) {
      console.log('ReadingFocusedModal feature flags:', {
        enableTextSelection,
        enableWordSynchronization,
        enableContextMenu,
        enableSelectionFeedback,
        enableVocabularyIntegration,
        enableFullTextAudio,
        exerciseId: exercise.id,
        exerciseLanguage: exercise.language
      });
    }
  }, [exercise, isOpen, enableTextSelection, enableWordSynchronization, enableContextMenu, enableSelectionFeedback]);

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

  if (!exercise) return null

  const fullText = exercise.content.sentences.map(s => s.text).join(' ')
  const totalWords = fullText.split(/\s+/).length

  // Cast exercise.language to Language type to fix TypeScript error
  const exerciseLanguage = exercise.language as Language

  // Get text size based on view mode
  const getTextSize = () => {
    if (isMobile) {
      switch (viewMode) {
        case 'normal': return 'text-base';
        case 'expanded': return 'text-lg leading-relaxed';
        case 'fullscreen': return 'text-xl leading-loose';
        default: return 'text-base';
      }
    } else {
      switch (viewMode) {
        case 'normal': return 'text-lg';
        case 'expanded': return 'text-xl leading-relaxed';
        case 'fullscreen': return 'text-2xl leading-loose';
        default: return 'text-lg';
      }
    }
  };

  // Render the reading content
  const renderReadingContent = () => (
    <>
      {/* Advanced Audio Controls */}
      {enableFullTextAudio && !showTranslationAnalysis && (
        <div className={cn(
          "flex-shrink-0",
          isFullScreen ? "mb-6" : "mb-4"
        )}>
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

      {!isFullScreen && <Separator className="flex-shrink-0" />}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Card className={cn(
          "h-full transition-all duration-300",
          isFullScreen ? "border-none shadow-none bg-transparent" : viewMode === 'expanded' ? "p-8" : "p-6"
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
                // Text selection is enabled - use the hybrid component
                <SynchronizedTextWithSelection
                  text={fullText}
                  highlightedWordIndex={highlightedWordIndex}
                  enableWordHighlighting={enableWordSynchronization && enableFullTextAudio && !!audioUrl}
                  className={cn(
                    "transition-all duration-300",
                    getTextSize()
                  )}
                  onCreateDictation={handleCreateDictation}
                  onCreateBidirectional={handleCreateBidirectional}
                  exerciseId={exercise.id}
                  exerciseLanguage={exerciseLanguage}
                  enableTextSelection={true}
                  enableVocabulary={enableVocabularyIntegration}
                  enhancedHighlighting={enableEnhancedHighlighting}
                  vocabularyIntegration={enableVocabularyIntegration}
                  enableContextMenu={enableContextMenu}
                />
              ) : (
                // Text selection is disabled - use enhanced interactive text
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
      </div>

      {/* Quick Actions - Mobile */}
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

  // Simplified rendering logic with proper debug logging
  console.log('ReadingFocusedModal rendering decision:', {
    enableTextSelection,
    enableWordSynchronization,
    enableFullTextAudio,
    hasAudioUrl: !!audioUrl,
    exerciseId: exercise.id,
    viewMode
  })

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
                    {enableContextMenu && (
                      <Badge variant="outline" className="text-xs">
                        Enhanced Selection
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Reading View Toggle */}
                <ReadingViewToggle
                  viewMode={viewMode}
                  onToggle={cycleViewMode}
                />
                
                {/* Analyze Button */}
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
