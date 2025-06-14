
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  RotateCcw
} from 'lucide-react';
import { ReadingExercise, ReadingSentence } from '@/types/reading';
import { readingExerciseService } from '@/services/readingExerciseService';
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
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
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
    saveProgress();
  };

  const previousSentence = () => {
    if (currentSentenceIndex <= 0) return;
    
    setCurrentSentenceIndex(prev => prev - 1);
    setShowAnalysis(false);
  };

  const restartExercise = () => {
    setCurrentSentenceIndex(0);
    setShowAnalysis(false);
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
    } finally {
      setIsPlaying(false);
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

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
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
              <div className="flex items-start justify-between gap-4">
                <p className="text-lg leading-relaxed flex-1">
                  {currentSentence?.text}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={playAudio}
                  disabled={isPlaying || !audioEnabled}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnalysis(!showAnalysis)}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {showAnalysis ? 'Hide' : 'Show'} Analysis
                </Button>
              </div>

              {/* Analysis Panel */}
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
