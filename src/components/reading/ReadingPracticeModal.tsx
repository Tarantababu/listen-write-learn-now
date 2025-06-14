
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  BookOpen,
  Brain,
  RotateCcw,
  Mic,
  SkipForward
} from 'lucide-react';
import { ReadingExercise, ReadingSentence } from '@/types/reading';
import { Language } from '@/types';
import { readingExerciseService } from '@/services/readingExerciseService';
import { EnhancedInteractiveText } from './EnhancedInteractiveText';
import { AllTextView } from './AllTextView';
import { ViewToggle, ReadingView } from './ViewToggle';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface ReadingPracticeModalProps {
  exercise: ReadingExercise | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReadingPracticeModal: React.FC<ReadingPracticeModalProps> = ({
  exercise,
  isOpen,
  onOpenChange
}) => {
  const { addExercise } = useExerciseContext();
  const isMobile = useIsMobile();
  const [currentView, setCurrentView] = useState<ReadingView>('sentence');
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isWordByWordMode, setIsWordByWordMode] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentSentence = exercise?.content.sentences[currentSentenceIndex];
  const progress = exercise ? ((currentSentenceIndex + 1) / exercise.content.sentences.length) * 100 : 0;

  useEffect(() => {
    if (exercise) {
      loadProgress();
    }
  }, [exercise]);

  const loadProgress = async () => {
    if (!exercise) return;
    
    try {
      const progress = await readingExerciseService.getProgress(exercise.id);
      if (progress && progress.last_sentence_index > 0) {
        setCurrentSentenceIndex(Math.min(progress.last_sentence_index, exercise.content.sentences.length - 1));
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async () => {
    if (!exercise) return;
    
    try {
      await readingExerciseService.updateProgress(exercise.id, currentSentenceIndex + 1);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const nextSentence = () => {
    if (!exercise || currentSentenceIndex >= exercise.content.sentences.length - 1) return;
    
    setCurrentSentenceIndex(prev => prev + 1);
    setShowAnalysis(false);
    setCurrentWordIndex(0);
    setHighlightedWordIndex(-1);
    saveProgress();
  };

  const previousSentence = () => {
    if (currentSentenceIndex <= 0) return;
    
    setCurrentSentenceIndex(prev => prev - 1);
    setShowAnalysis(false);
    setCurrentWordIndex(0);
    setHighlightedWordIndex(-1);
  };

  const restartExercise = () => {
    setCurrentSentenceIndex(0);
    setShowAnalysis(false);
    setCurrentWordIndex(0);
    setHighlightedWordIndex(-1);
    setCurrentView('sentence');
  };

  const playAudio = async () => {
    if (!currentSentence || !audioEnabled) return;
    
    try {
      setIsPlaying(true);
      
      if (currentSentence.audio_url) {
        if (audioRef.current) {
          audioRef.current.src = currentSentence.audio_url;
          await audioRef.current.play();
        }
      } else {
        const audioUrl = await readingExerciseService.generateAudio(
          currentSentence.text,
          exercise!.language
        );
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Audio playback failed');
    }
  };

  const playWordByWord = async () => {
    if (!currentSentence || !audioEnabled) return;
    
    const words = currentSentence.text.split(/\s+/);
    setIsWordByWordMode(true);
    setCurrentWordIndex(0);
    
    try {
      for (let i = 0; i < words.length; i++) {
        setCurrentWordIndex(i);
        setHighlightedWordIndex(i);
        
        const word = words[i].replace(/[.,!?;:"'()]/g, '');
        const audioUrl = await readingExerciseService.generateAudio(word, exercise!.language);
        
        const audio = new Audio(audioUrl);
        await new Promise((resolve, reject) => {
          audio.onended = resolve;
          audio.onerror = reject;
          audio.play();
        });
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Error in word-by-word playback:', error);
      toast.error('Word-by-word playback failed');
    } finally {
      setIsWordByWordMode(false);
      setCurrentWordIndex(0);
      setHighlightedWordIndex(-1);
    }
  };

  const createDictationExercise = async () => {
    if (!exercise || !currentSentence) return;
    
    try {
      const dictationExercise = {
        title: `Dictation: ${exercise.title}`,
        text: currentSentence.text,
        language: exercise.language as Language,
        tags: ['dictation', 'from-reading'],
        directoryId: null
      };
      
      await addExercise(dictationExercise);
      toast.success('Dictation exercise created successfully!');
    } catch (error) {
      console.error('Error creating dictation exercise:', error);
      toast.error('Failed to create dictation exercise');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderInteractiveText = () => {
    if (!currentSentence) return null;

    const words = currentSentence.text.split(/\s+/);
    
    return (
      <div className={`leading-relaxed ${isMobile ? 'text-base' : 'text-lg'}`}>
        {words.map((word, index) => {
          const isCurrentWord = isWordByWordMode && index === currentWordIndex;
          const isHighlighted = highlightedWordIndex === index;
          
          return (
            <span
              key={index}
              className={`transition-all duration-300 ${
                isCurrentWord || isHighlighted 
                  ? 'bg-yellow-200 px-1 rounded shadow-sm' 
                  : ''
              }`}
            >
              {word}{index < words.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => {
        setIsPlaying(false);
        setHighlightedWordIndex(-1);
      };
      
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, []);

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[95vh] p-4' : 'max-w-5xl max-h-[90vh]'} overflow-auto`}>
        <DialogHeader className={isMobile ? 'pb-4' : ''}>
          <div className="flex items-center justify-between">
            <DialogTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
              <BookOpen className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span className={isMobile ? 'line-clamp-2' : ''}>{exercise.title}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`capitalize ${isMobile ? 'text-xs' : ''}`}>
                {exercise.difficulty_level}
              </Badge>
              <Button
                variant="ghost"
                size={isMobile ? 'sm' : 'sm'}
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={isMobile ? 'p-2' : ''}
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* View Toggle */}
          <ViewToggle currentView={currentView} onViewChange={setCurrentView} />

          {currentView === 'sentence' ? (
            <>
              {/* Progress Bar - Only show in sentence view */}
              <div className="space-y-2">
                <div className={`flex justify-between text-muted-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                  <span>Sentence {currentSentenceIndex + 1} of {exercise.content.sentences.length}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Current Sentence */}
              <Card>
                <CardContent className={`space-y-4 ${isMobile ? 'p-4' : 'p-6'}`}>
                  <div className="space-y-4">
                    <EnhancedInteractiveText
                      text={currentSentence?.text || ''}
                      words={currentSentence?.analysis?.words}
                      language={exercise.language}
                      onWordClick={(word) => console.log('Word clicked:', word)}
                      enableTooltips={true}
                      enableBidirectionalCreation={true}
                    />
                    
                    {isWordByWordMode && (
                      <div className={`bg-blue-50 p-2 rounded ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                        Word-by-word playback active... ({currentWordIndex + 1} of {currentSentence?.text.split(/\s+/).length})
                      </div>
                    )}
                  </div>

                  {/* Audio Controls */}
                  <div className={`pt-2 border-t ${isMobile ? 'space-y-3' : ''}`}>
                    <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
                      <Button
                        variant="outline"
                        size={isMobile ? 'sm' : 'sm'}
                        onClick={playAudio}
                        disabled={isPlaying || !audioEnabled}
                        className={isMobile ? 'flex-1 min-w-0' : ''}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span className={`ml-2 ${isMobile ? 'text-xs' : ''}`}>
                          {isMobile ? 'Play' : 'Play Sentence'}
                        </span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size={isMobile ? 'sm' : 'sm'}
                        onClick={playWordByWord}
                        disabled={isWordByWordMode || !audioEnabled}
                        className={isMobile ? 'flex-1 min-w-0' : ''}
                      >
                        <SkipForward className="h-4 w-4" />
                        <span className={`ml-2 ${isMobile ? 'text-xs' : ''}`}>
                          {isMobile ? 'Words' : 'Word by Word'}
                        </span>
                      </Button>

                      <Button
                        variant="outline"
                        size={isMobile ? 'sm' : 'sm'}
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className={isMobile ? 'flex-1 min-w-0' : ''}
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        <span className={isMobile ? 'text-xs' : ''}>
                          {showAnalysis ? 'Hide' : 'Show'} Analysis
                        </span>
                      </Button>

                      <Button
                        variant="outline"
                        size={isMobile ? 'sm' : 'sm'}
                        onClick={createDictationExercise}
                        className={isMobile ? 'w-full mt-2' : ''}
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        <span className={isMobile ? 'text-xs' : ''}>
                          {isMobile ? 'Create as Dictation' : 'Create as Dictation'}
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* Analysis Panel */}
                  {showAnalysis && currentSentence?.analysis && (
                    <div className={`space-y-4 border-t pt-4 ${isMobile ? 'space-y-3' : ''}`}>
                      {currentSentence.analysis.translation && (
                        <div>
                          <h4 className={`font-semibold mb-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>Translation:</h4>
                          <p className={`text-muted-foreground italic ${isMobile ? 'text-sm' : ''}`}>
                            {currentSentence.analysis.translation}
                          </p>
                        </div>
                      )}

                      {currentSentence.analysis.words && currentSentence.analysis.words.length > 0 && (
                        <div>
                          <h4 className={`font-semibold mb-3 ${isMobile ? 'text-sm' : 'text-sm'}`}>Word Analysis:</h4>
                          <div className="grid gap-2">
                            {currentSentence.analysis.words.map((word, index) => (
                              <div key={index} className={`flex items-start gap-3 bg-muted/50 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                                <Badge
                                  variant="outline"
                                  className={`${getDifficultyColor(word.difficulty || 'easy')} text-xs`}
                                >
                                  {word.word}
                                </Badge>
                                <div className="flex-1 space-y-1">
                                  <p className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>{word.definition}</p>
                                  {word.partOfSpeech && (
                                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                      {word.partOfSpeech}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentSentence.analysis.grammar && currentSentence.analysis.grammar.length > 0 && (
                        <div>
                          <h4 className={`font-semibold mb-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>Grammar Points:</h4>
                          <div className="flex flex-wrap gap-2">
                            {currentSentence.analysis.grammar.map((point, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {point}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation Controls */}
              <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
                <Button
                  variant="outline"
                  onClick={restartExercise}
                  className={`flex items-center gap-2 ${isMobile ? 'w-full py-3' : ''}`}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restart
                </Button>

                <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
                  <Button
                    variant="outline"
                    onClick={previousSentence}
                    disabled={currentSentenceIndex === 0}
                    className={isMobile ? 'flex-1 py-3' : ''}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {!isMobile && 'Previous'}
                  </Button>
                  
                  <Button
                    onClick={nextSentence}
                    disabled={currentSentenceIndex >= exercise.content.sentences.length - 1}
                    className={isMobile ? 'flex-1 py-3' : ''}
                  >
                    {!isMobile && 'Next'}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Exercise Complete */}
              {currentSentenceIndex >= exercise.content.sentences.length - 1 && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className={`text-center ${isMobile ? 'p-4' : 'p-4'}`}>
                    <h3 className={`font-semibold text-green-800 mb-2 ${isMobile ? 'text-base' : ''}`}>
                      🎉 Exercise Complete!
                    </h3>
                    <p className={`text-green-700 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                      Great job! You've completed this reading exercise.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* All Text View */
            <AllTextView
              exercise={exercise}
              audioEnabled={audioEnabled}
              onCreateDictation={createDictationExercise}
            />
          )}
        </div>

        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      </DialogContent>
    </Dialog>
  );
};
