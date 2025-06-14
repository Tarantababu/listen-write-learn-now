import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, Brain, Mic, Info } from 'lucide-react';
import { ReadingExercise } from '@/types/reading';
import { readingExerciseService } from '@/services/readingExerciseService';
import { EnhancedInteractiveText } from './EnhancedInteractiveText';
import { TextSelectionManager } from './TextSelectionManager';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { Language } from '@/types';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface AllTextViewProps {
  exercise: ReadingExercise;
  audioEnabled: boolean;
  onCreateDictation: () => void;
  onCreateDictationFromSelection?: (selectedText: string) => void;
  onCreateBidirectionalFromSelection?: (selectedText: string) => void;
}

export const AllTextView: React.FC<AllTextViewProps> = ({
  exercise,
  audioEnabled,
  onCreateDictation,
  onCreateDictationFromSelection,
  onCreateBidirectionalFromSelection
}) => {
  const { addExercise } = useExerciseContext();
  const isMobile = useIsMobile();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentPlayingSentence, setCurrentPlayingSentence] = useState<number>(-1);
  const [showSelectionHelp, setShowSelectionHelp] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fullText = exercise.content.sentences.map(s => s.text).join(' ');
  const allWords = exercise.content.sentences.flatMap(s => s.analysis?.words || []);

  const playFullText = async () => {
    if (!audioEnabled) return;
    
    try {
      setIsPlaying(true);
      const audioUrl = await readingExerciseService.generateAudio(fullText, exercise.language);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing full text audio:', error);
      toast.error('Audio playback failed');
    }
  };

  const playSentenceBysentence = async () => {
    if (!audioEnabled) return;
    
    try {
      setIsPlaying(true);
      
      for (let i = 0; i < exercise.content.sentences.length; i++) {
        setCurrentPlayingSentence(i);
        const sentence = exercise.content.sentences[i];
        
        const audioUrl = sentence.audio_url || 
          await readingExerciseService.generateAudio(sentence.text, exercise.language);
        
        const audio = new Audio(audioUrl);
        await new Promise((resolve, reject) => {
          audio.onended = resolve;
          audio.onerror = reject;
          audio.play();
        });
        
        // Pause between sentences
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error in sentence-by-sentence playback:', error);
      toast.error('Audio playback failed');
    } finally {
      setIsPlaying(false);
      setCurrentPlayingSentence(-1);
    }
  };

  const createDictationFromFullText = async () => {
    try {
      const dictationExercise = {
        title: `Dictation: ${exercise.title}`,
        text: fullText,
        language: exercise.language as Language,
        tags: ['dictation', 'from-reading', 'full-text'],
        directoryId: null
      };
      
      await addExercise(dictationExercise);
      toast.success('Full text dictation exercise created!');
    } catch (error) {
      console.error('Error creating dictation exercise:', error);
      toast.error('Failed to create dictation exercise');
    }
  };

  // Handle audio ended event
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentPlayingSentence(-1);
      };
      
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, []);

  // Auto-hide selection help after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSelectionHelp(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const renderHighlightedText = () => {
    if (currentPlayingSentence === -1) {
      return (
        <EnhancedInteractiveText
          text={fullText}
          words={allWords}
          language={exercise.language}
          enableTooltips={true}
          enableBidirectionalCreation={true}
        />
      );
    }

    // Highlight the currently playing sentence
    return (
      <div className="leading-relaxed text-lg">
        {exercise.content.sentences.map((sentence, index) => (
          <span
            key={index}
            className={`transition-all duration-300 ${
              index === currentPlayingSentence 
                ? 'bg-yellow-200 px-1 rounded shadow-sm' 
                : ''
            }`}
          >
            <EnhancedInteractiveText
              text={sentence.text}
              words={sentence.analysis?.words || []}
              language={exercise.language}
              enableTooltips={true}
              enableBidirectionalCreation={true}
            />
            {index < exercise.content.sentences.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Selection Help Banner */}
      {showSelectionHelp && (onCreateDictationFromSelection || onCreateBidirectionalFromSelection) && (
        <Card className={`border-blue-200 bg-blue-50 ${isMobile ? 'mx-0' : ''}`}>
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-start gap-3">
              <Info className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600 mt-0.5 flex-shrink-0`} />
              <div className="flex-1">
                <h4 className={`font-medium text-blue-900 mb-1 ${isMobile ? 'text-sm' : ''}`}>
                  Text Selection Available
                </h4>
                <p className={`text-blue-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {isMobile 
                    ? 'Tap and hold to select text, then choose to create dictation or bidirectional exercises.'
                    : 'Select any portion of text to create targeted dictation or bidirectional exercises from your selection.'
                  }
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSelectionHelp(false)}
                className={`text-blue-600 hover:text-blue-800 ${isMobile ? 'p-1' : ''}`}
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Text Display with Selection */}
      <Card>
        <CardContent className={`${isMobile ? 'p-4' : 'p-6'} space-y-4`}>
          <TextSelectionManager
            onCreateDictation={onCreateDictationFromSelection || (() => {})}
            onCreateBidirectional={onCreateBidirectionalFromSelection || (() => {})}
            disabled={!onCreateDictationFromSelection && !onCreateBidirectionalFromSelection}
          >
            <div className="space-y-4">
              {renderHighlightedText()}
              
              {isPlaying && currentPlayingSentence !== -1 && (
                <div className={`text-muted-foreground bg-blue-50 p-2 rounded ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Playing sentence {currentPlayingSentence + 1} of {exercise.content.sentences.length}
                </div>
              )}
            </div>
          </TextSelectionManager>

          {/* Audio Controls */}
          <div className={`flex items-center gap-2 pt-2 border-t ${isMobile ? 'flex-wrap' : ''}`}>
            <Button
              variant="outline"
              size={isMobile ? 'sm' : 'sm'}
              onClick={playFullText}
              disabled={isPlaying || !audioEnabled}
              className={isMobile ? 'flex-1' : ''}
            >
              {isPlaying && currentPlayingSentence === -1 ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span className={`ml-2 ${isMobile ? 'text-xs' : ''}`}>Play All</span>
            </Button>
            
            <Button
              variant="outline"
              size={isMobile ? 'sm' : 'sm'}
              onClick={playSentenceBysentence}
              disabled={isPlaying || !audioEnabled}
              className={isMobile ? 'flex-1' : ''}
            >
              <Volume2 className="h-4 w-4" />
              <span className={`ml-2 ${isMobile ? 'text-xs' : ''}`}>By Sentence</span>
            </Button>

            <Button
              variant="outline"
              size={isMobile ? 'sm' : 'sm'}
              onClick={() => setShowAnalysis(!showAnalysis)}
              className={isMobile ? 'flex-1' : ''}
            >
              <Brain className="h-4 w-4 mr-2" />
              <span className={isMobile ? 'text-xs' : ''}>{showAnalysis ? 'Hide' : 'Show'} Analysis</span>
            </Button>

            <Button
              variant="outline"
              size={isMobile ? 'sm' : 'sm'}
              onClick={createDictationFromFullText}
              className={isMobile ? 'w-full mt-2' : ''}
            >
              <Mic className="h-4 w-4 mr-2" />
              <span className={isMobile ? 'text-xs' : ''}>Create Full Dictation</span>
            </Button>
          </div>

          {/* Analysis Panel */}
          {showAnalysis && (
            <div className="space-y-4 border-t pt-4">
              {/* Overall Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {exercise.content.sentences.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Sentences</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {exercise.content.analysis?.wordCount || fullText.split(/\s+/).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {exercise.content.analysis?.readingTime || Math.ceil(fullText.split(/\s+/).length / 200)}
                  </div>
                  <div className="text-sm text-muted-foreground">Min Read</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary capitalize">
                    {exercise.difficulty_level}
                  </div>
                  <div className="text-sm text-muted-foreground">Level</div>
                </div>
              </div>

              {/* Grammar Points */}
              {exercise.content.analysis?.grammarPoints && exercise.content.analysis.grammarPoints.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Grammar Focus:</h4>
                  <div className="flex flex-wrap gap-2">
                    {exercise.content.analysis.grammarPoints.map((point, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocabulary Overview */}
              {allWords.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3">Vocabulary Overview:</h4>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {allWords.slice(0, 20).map((word, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 bg-muted/30 rounded text-sm">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            word.difficulty === 'easy' ? 'border-green-200 text-green-800' :
                            word.difficulty === 'medium' ? 'border-yellow-200 text-yellow-800' :
                            word.difficulty === 'hard' ? 'border-red-200 text-red-800' :
                            'border-gray-200 text-gray-800'
                          }`}
                        >
                          {word.word}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{word.definition}</p>
                          {word.partOfSpeech && (
                            <p className="text-xs text-muted-foreground">{word.partOfSpeech}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {allWords.length > 20 && (
                      <div className="text-xs text-muted-foreground text-center p-2">
                        And {allWords.length - 20} more words...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
    </div>
  );
};
