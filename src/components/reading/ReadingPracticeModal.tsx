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
  Edit,
  SkipForward,
  Rewind
} from 'lucide-react';
import { ReadingExercise, ReadingSentence } from '@/types/reading';
import { Language } from '@/types';
import { readingExerciseService } from '@/services/readingExerciseService';
import { EnhancedInteractiveText } from './EnhancedInteractiveText';
import { useExerciseContext } from '@/contexts/ExerciseContext';
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

  // Enhanced word-by-word playback with synchronized highlighting
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
        
        await new Promise(resolve => setTimeout(resolve, 300)); // Pause between words
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

  // Enhanced text rendering with synchronized highlighting
  const renderInteractiveText = () => {
    if (!currentSentence) return null;

    const words = currentSentence.text.split(/\s+/);
    
    return (
      <div className="leading-relaxed text-lg">
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

  // Handle audio ended event
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {exercise.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {exercise.difficulty_level}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Sentence {currentSentenceIndex + 1} of {exercise.content.sentences.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Sentence */}
          <Card>
            <CardContent className="p-6 space-y-4">
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
                  <div className="text-sm text-muted-foreground bg-blue-50 p-2 rounded">
                    Word-by-word playback active... ({currentWordIndex + 1} of {currentSentence?.text.split(/\s+/).length})
                  </div>
                )}
              </div>

              {/* Enhanced Audio Controls */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={playAudio}
                  disabled={isPlaying || !audioEnabled}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span className="ml-2">Play Sentence</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={playWordByWord}
                  disabled={isWordByWordMode || !audioEnabled}
                >
                  <SkipForward className="h-4 w-4" />
                  <span className="ml-2">Word by Word</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnalysis(!showAnalysis)}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {showAnalysis ? 'Hide' : 'Show'} Analysis
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={createDictationExercise}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Create as Dictation
                </Button>
              </div>

              {/* Enhanced Analysis Panel */}
              {showAnalysis && currentSentence?.analysis && (
                <div className="space-y-4 border-t pt-4">
                  {/* Translation */}
                  {currentSentence.analysis.translation && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Translation:</h4>
                      <p className="text-muted-foreground italic">
                        {currentSentence.analysis.translation}
                      </p>
                    </div>
                  )}

                  {/* Word Analysis */}
                  {currentSentence.analysis.words && currentSentence.analysis.words.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Word Analysis:</h4>
                      <div className="grid gap-2">
                        {currentSentence.analysis.words.map((word, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge
                              variant="outline"
                              className={`${getDifficultyColor(word.difficulty || 'easy')} text-xs`}
                            >
                              {word.word}
                            </Badge>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">{word.definition}</p>
                              {word.partOfSpeech && (
                                <p className="text-xs text-muted-foreground">
                                  {word.partOfSpeech}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grammar Points */}
                  {currentSentence.analysis.grammar && currentSentence.analysis.grammar.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Grammar Points:</h4>
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
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={restartExercise}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restart
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={previousSentence}
                disabled={currentSentenceIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <Button
                onClick={nextSentence}
                disabled={currentSentenceIndex >= exercise.content.sentences.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Exercise Complete */}
          {currentSentenceIndex >= exercise.content.sentences.length - 1 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-green-800 mb-2">
                  🎉 Exercise Complete!
                </h3>
                <p className="text-green-700 text-sm">
                  Great job! You've completed this reading exercise.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      </DialogContent>
    </Dialog>
  );
};
