import React, { useState, useRef, useEffect, TouchEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Mic, Plus, Languages } from 'lucide-react';
import { ReadingExercise } from '@/types/reading';
import { Language } from '@/types';
import { EnhancedInteractiveText } from './EnhancedInteractiveText';
import { AudioWordSynchronizer } from './AudioWordSynchronizer';
import { SynchronizedTextWithSelection } from './SynchronizedTextWithSelection';
import { AdvancedAudioControls } from './AdvancedAudioControls';
import { SimpleTranslationAnalysis } from './SimpleTranslationAnalysis';
import { SimpleAudioSyncText } from './SimpleAudioSyncText';
import { useIsMobile } from '@/hooks/use-mobile';
import { readingExerciseService } from '@/services/readingExerciseService';
import { toast } from 'sonner';
const MOBILE_READING_TABS = [{
  id: 'text',
  label: 'Text',
  icon: BookOpen
}, {
  id: 'audio',
  label: 'Audio',
  icon: Mic
}, {
  id: 'analyze',
  label: 'Analyze',
  icon: Languages
}];
export const ReadingFocusedModal: React.FC<any> = ({
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const [showTranslationAnalysis, setShowTranslationAnalysis] = useState(false);

  // Mobile navigation UI
  const [mobileTab, setMobileTab] = useState<'text' | 'audio' | 'analyze'>('text');
  const swipeStartX = useRef<number | null>(null);
  const isMobile = useIsMobile();
  useEffect(() => {
    if (!isOpen) setMobileTab('text');
  }, [isOpen]);

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
  useEffect(() => {
    if (exercise && isOpen && enableFullTextAudio) {
      generateFullTextAudio();
    }
  }, [exercise, isOpen, enableFullTextAudio]);

  // Swipe gesture (only for mobile and 3 tabs)
  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    swipeStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    if (swipeStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(deltaX) < 50) return;
    // Left swipe: go right in tabs, Right swipe: go left in tabs
    const order = ['text', 'audio', 'analyze'] as const;
    const idx = order.indexOf(mobileTab);
    if (deltaX < 0 && idx < order.length - 1) setMobileTab(order[idx + 1]);
    if (deltaX > 0 && idx > 0) setMobileTab(order[idx - 1]);
  }
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
  const handleAnalyzeTranslation = () => {
    setShowTranslationAnalysis(true);
  };
  if (!exercise) return null;
  const fullText = exercise.content.sentences.map(s => s.text).join(' ');
  const totalWords = fullText.split(/\s+/).length;
  const exerciseLanguage = exercise.language as Language;

  // Mobile UI: tab navigation bar
  const renderMobileTabs = () => <div className="flex border-b border-muted z-20 sticky top-0 bg-background">
      {MOBILE_READING_TABS.map(t => <button key={t.id} type="button" onClick={() => setMobileTab(t.id as any)} className={`flex-1 flex flex-col items-center justify-center px-2 py-2 ${mobileTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'} focus-visible:ring transition-all active:bg-primary/20`} aria-current={mobileTab === t.id} style={{
      WebkitTapHighlightColor: "transparent",
      outline: 'none'
    }}>
          <t.icon className="h-5 w-5 mb-0.5" />
          <span className="text-xs font-medium">{t.label}</span>
        </button>)}
    </div>;

  // Attach swipe handlers for mobile modal body
  const bodyTouchEvents = isMobile ? {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  } : {};

  // Main UI
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'w-full h-full max-w-full max-h-full m-0 rounded-none p-0 flex flex-col' : 'max-w-4xl max-h-[95vh]'} overflow-hidden flex flex-col`} style={{
      touchAction: "manipulation"
    }}>
        <DialogHeader className={`flex-shrink-0 ${isMobile ? "py-2 px-4 border-b" : 'pb-4'}`}>
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
                  
                  {enableWordSynchronization && <Badge variant="outline" className="text-xs">Word Sync</Badge>}
                  {enableContextMenu}
                </div>
              </div>
            </div>
            {/* Analyze Button: only show on desktop, use tab on mobile */}
            {!isMobile && <Button variant="outline" size="sm" onClick={handleAnalyzeTranslation} className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Analyze
              </Button>}
          </div>
        </DialogHeader>

        {/* MOBILE: Show Navigation Tabs */}
        {isMobile && renderMobileTabs()}

        {/* Desktop: Actions */}
        {!isMobile && <Separator className="flex-shrink-0" />}

        {/* Main Content */}
        <div className={`flex-1 min-h-0 relative overflow-auto bg-background`} {...bodyTouchEvents}>
          <Card className={`p-0 h-full bg-transparent shadow-none border-none`}>
            {/* Mobile tabs content */}
            {isMobile ? <>
                {/* Text tab */}
                {mobileTab === 'text' && <div className="p-4">
                    {enableTextSelection ? <SynchronizedTextWithSelection text={fullText} highlightedWordIndex={highlightedWordIndex} enableWordHighlighting={enableWordSynchronization && enableFullTextAudio && !!audioUrl} className={'text-base'} onCreateDictation={handleCreateDictation} onCreateBidirectional={handleCreateBidirectional} exerciseId={exercise.id} exerciseLanguage={exerciseLanguage} enableTextSelection={true} enableVocabulary={enableVocabularyIntegration} enhancedHighlighting={enableEnhancedHighlighting} vocabularyIntegration={enableVocabularyIntegration} enableContextMenu={enableContextMenu} /> : <EnhancedInteractiveText text={fullText} language={exerciseLanguage} enableTooltips={true} enableBidirectionalCreation={true} enableTextSelection={false} vocabularyIntegration={false} enhancedHighlighting={false} exerciseId={exercise.id} onCreateDictation={handleCreateDictation} onCreateBidirectional={handleCreateBidirectional} />}
                  </div>}
                {/* Audio tab */}
                {mobileTab === 'audio' && <div className="flex flex-col gap-0 h-full">
                    <div className="sticky top-0 z-10 bg-background p-4 pb-1 border-b">
                      <AudioWordSynchronizer audioUrl={audioUrl} text={fullText} onWordHighlight={handleWordHighlight} onTimeUpdate={handleTimeUpdate} isPlaying={isPlaying} playbackRate={audioSpeed} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded}>
                        {audioRef => <AdvancedAudioControls isPlaying={isPlaying} isGeneratingAudio={isGeneratingAudio} audioEnabled={audioEnabled} currentPosition={currentPosition} audioDuration={audioDuration} audioSpeed={audioSpeed} showSettings={showSettings} highlightedWordIndex={highlightedWordIndex} totalWords={totalWords} onTogglePlayPause={() => togglePlayPause(audioRef)} onSkipBackward={() => skipBackward(audioRef)} onSkipForward={() => skipForward(audioRef)} onRestart={() => restart(audioRef)} onToggleAudio={() => setAudioEnabled(!audioEnabled)} onToggleSettings={() => setShowSettings(!showSettings)} onChangeSpeed={changeSpeed} onSeek={time => seekTo(audioRef, time)} />}
                      </AudioWordSynchronizer>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                      {/* NON-INTERACTIVE text in audio tab: only highlights current word */}
                      <SimpleAudioSyncText text={fullText} highlightedWordIndex={highlightedWordIndex} enableWordHighlighting={enableWordSynchronization && enableFullTextAudio && !!audioUrl} className="text-base" />
                    </div>
                  </div>}
                {/* Analyze tab */}
                {mobileTab === 'analyze' && <div className="p-4">
                    <SimpleTranslationAnalysis text={fullText} sourceLanguage={exerciseLanguage} onClose={() => setMobileTab('text')} />
                  </div>}
              </> :
          // Desktop: Existing structure, with possibility to toggle translation analysis
          showTranslationAnalysis ? <SimpleTranslationAnalysis text={fullText} sourceLanguage={exerciseLanguage} onClose={() => setShowTranslationAnalysis(false)} /> : <>
                  {enableFullTextAudio && <div className="flex-shrink-0 mb-4">
                      <AudioWordSynchronizer audioUrl={audioUrl} text={fullText} onWordHighlight={handleWordHighlight} onTimeUpdate={handleTimeUpdate} isPlaying={isPlaying} playbackRate={audioSpeed} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded}>
                        {audioRef => <AdvancedAudioControls isPlaying={isPlaying} isGeneratingAudio={isGeneratingAudio} audioEnabled={audioEnabled} currentPosition={currentPosition} audioDuration={audioDuration} audioSpeed={audioSpeed} showSettings={showSettings} highlightedWordIndex={highlightedWordIndex} totalWords={totalWords} onTogglePlayPause={() => togglePlayPause(audioRef)} onSkipBackward={() => skipBackward(audioRef)} onSkipForward={() => skipForward(audioRef)} onRestart={() => restart(audioRef)} onToggleAudio={() => setAudioEnabled(!audioEnabled)} onToggleSettings={() => setShowSettings(!showSettings)} onChangeSpeed={changeSpeed} onSeek={time => seekTo(audioRef, time)} />}
                      </AudioWordSynchronizer>
                    </div>}
                  <div>
                    {enableTextSelection ? <SynchronizedTextWithSelection text={fullText} highlightedWordIndex={highlightedWordIndex} enableWordHighlighting={enableWordSynchronization && enableFullTextAudio && !!audioUrl} className={'text-lg'} onCreateDictation={handleCreateDictation} onCreateBidirectional={handleCreateBidirectional} exerciseId={exercise.id} exerciseLanguage={exerciseLanguage} enableTextSelection={true} enableVocabulary={enableVocabularyIntegration} enhancedHighlighting={enableEnhancedHighlighting} vocabularyIntegration={enableVocabularyIntegration} enableContextMenu={enableContextMenu} /> : <EnhancedInteractiveText text={fullText} language={exerciseLanguage} enableTooltips={true} enableBidirectionalCreation={true} enableTextSelection={false} vocabularyIntegration={false} enhancedHighlighting={false} exerciseId={exercise.id} onCreateDictation={handleCreateDictation} onCreateBidirectional={handleCreateBidirectional} />}
                  </div>
                </>}
          </Card>
        </div>
        {/* Mobile: Bottom quick actions - keep existing, but add tap styles */}
        {isMobile && mobileTab === 'text' && <div className="flex-shrink-0 border-t p-4 bg-gray-50">
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" className="touch-manipulation active:bg-primary/20" onClick={() => handleCreateDictation(fullText)}>
                <Mic className="h-4 w-4 mr-1" />
                Dictation
              </Button>
              <Button variant="outline" size="sm" className="touch-manipulation active:bg-primary/20" onClick={() => handleCreateBidirectional(fullText)}>
                <Plus className="h-4 w-4 mr-1" />
                Translation
              </Button>
              <Button variant="outline" size="sm" className="touch-manipulation active:bg-primary/20" onClick={() => setMobileTab('analyze')}>
                <Languages className="h-4 w-4 mr-1" />
                Analyze
              </Button>
            </div>
          </div>}
      </DialogContent>
    </Dialog>;
};