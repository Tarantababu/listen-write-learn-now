import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
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
  Info,
  Loader2
} from 'lucide-react'
import { ReadingExercise } from '@/types/reading'
import { Language } from '@/types'
import { EnhancedInteractiveText } from './EnhancedInteractiveText'
import { SynchronizedTextWithSelection } from './SynchronizedTextWithSelection'
import { OnDemandAudioPlayer } from './OnDemandAudioPlayer'
import { SimpleTranslationAnalysis } from './SimpleTranslationAnalysis'
import { ReadingViewToggle } from '@/components/ui/reading-view-toggle'
import { FullScreenReadingOverlay } from './FullScreenReadingOverlay'
import { useFullScreenReading } from '@/hooks/use-full-screen-reading'
import { useIsMobile } from '@/hooks/use-mobile'
import { optimizedReadingService } from '@/services/optimizedReadingService'
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
  enableWordSynchronization = false, // Disabled for now since we're using on-demand audio
  enableContextMenu = true,
  enableSelectionFeedback = true,
  enableSmartTextProcessing = true
}) => {
  const [showTranslationAnalysis, setShowTranslationAnalysis] = useState(false)
  const [currentExercise, setCurrentExercise] = useState<ReadingExercise | null>(exercise)
  
  const { viewMode, cycleViewMode, isFullScreen } = useFullScreenReading()
  const isMobile = useIsMobile()

  // Update current exercise when prop changes
  useEffect(() => {
    setCurrentExercise(exercise);
  }, [exercise]);

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

  const refreshExerciseData = useCallback(async () => {
    if (!currentExercise?.id) return;
    
    try {
      console.log('[READING MODAL] Refreshing exercise data');
      const refreshedExercise = await optimizedReadingService.refreshExerciseFromDb(currentExercise.id);
      setCurrentExercise(refreshedExercise);
    } catch (error) {
      console.error('[READING MODAL] Failed to refresh exercise data:', error);
    }
  }, [currentExercise?.id]);

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

  if (!currentExercise) return null

  const fullText = currentExercise.content.sentences.map(s => s.text).join(' ')
  const exerciseLanguage = currentExercise.language as Language

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

  // Render the reading content with optimized full-screen layout
  const renderReadingContent = () => (
    <>
      {/* On-Demand Audio Player */}
      {enableFullTextAudio && !showTranslationAnalysis && (
        <div className={cn(
          "flex-shrink-0",
          isFullScreen ? "mb-8" : "mb-4"
        )}>
          <OnDemandAudioPlayer 
            exercise={currentExercise}
            autoGenerate={false}
            compact={isFullScreen}
          />
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
                    highlightedWordIndex={-1}
                    enableWordHighlighting={false}
                    className={cn(
                      "transition-all duration-300",
                      getTextSize(),
                      isFullScreen && "w-full"
                    )}
                    onCreateDictation={handleCreateDictation}
                    onCreateBidirectional={handleCreateBidirectional}
                    exerciseId={currentExercise.id}
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
                    exerciseId={currentExercise.id}
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
                    highlightedWordIndex={-1}
                    enableWordHighlighting={false}
                    className={cn(
                      "transition-all duration-300",
                      getTextSize()
                    )}
                    onCreateDictation={handleCreateDictation}
                    onCreateBidirectional={handleCreateBidirectional}
                    exerciseId={currentExercise.id}
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
                    exerciseId={currentExercise.id}
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
                    {currentExercise.title}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {currentExercise.language}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {currentExercise.difficulty_level}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      On-Demand Audio
                    </Badge>
                    {enableContextMenu && (
                      <Badge variant="outline" className="text-xs">
                        Enhanced Selection
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
        title={currentExercise.title}
        language={currentExercise.language}
        difficulty={currentExercise.difficulty_level}
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
