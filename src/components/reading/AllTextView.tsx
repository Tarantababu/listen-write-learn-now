
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, Volume2, Brain, Mic, Info, BarChart3, Clock, FileText } from 'lucide-react';
import { ReadingExercise } from '@/types/reading';
import { EnhancedInteractiveText } from './EnhancedInteractiveText';
import { TextSelectionManager } from './TextSelectionManager';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { Language } from '@/types';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { AudioUtils } from '@/utils/audioUtils';

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
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fullText = exercise.content.sentences.map(s => s.text).join(' ');
  const allWords = exercise.content.sentences.flatMap(s => s.analysis?.words || []);

  const playFullText = async () => {
    if (!audioEnabled) return;
    
    try {
      setIsPlaying(true);
      
      // Use the pre-generated audio URL from the exercise
      const audioUrl = AudioUtils.getPreferredAudioUrl(exercise);
      
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      } else {
        throw new Error('No audio available for this exercise');
      }
    } catch (error) {
      console.error('Error playing full text audio:', error);
      toast.error('Audio playback failed - no audio available for this exercise');
      setIsPlaying(false);
    }
  };

  const playSentenceBysentence = async () => {
    if (!audioEnabled) return;
    
    try {
      setIsPlaying(true);
      
      // For sentence-by-sentence, we'll play the full audio but show visual feedback
      // This is a simplified approach since we don't have individual sentence audio
      const audioUrl = AudioUtils.getPreferredAudioUrl(exercise);
      
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
        
        // Simulate sentence highlighting based on reading speed
        const avgWordsPerSentence = fullText.split(' ').length / exercise.content.sentences.length;
        const highlightDuration = (avgWordsPerSentence / 150) * 60 * 1000; // Assuming 150 words per minute
        
        for (let i = 0; i < exercise.content.sentences.length; i++) {
          setCurrentPlayingSentence(i);
          await new Promise(resolve => setTimeout(resolve, highlightDuration));
        }
      } else {
        throw new Error('No audio available for this exercise');
      }
    } catch (error) {
      console.error('Error in sentence-by-sentence playback:', error);
      toast.error('Audio playback failed - no audio available for this exercise');
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

  // Handle audio progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateProgress = () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentPlayingSentence(-1);
        setAudioProgress(0);
      };
      
      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  // Auto-hide selection help after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSelectionHelp(false);
    }, 7000);
    
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

    return (
      <div className="leading-relaxed text-lg">
        {exercise.content.sentences.map((sentence, index) => (
          <span
            key={index}
            className={`transition-all duration-500 ${
              index === currentPlayingSentence 
                ? 'bg-blue-100 px-2 py-1 rounded-md shadow-sm border border-blue-200' 
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

  // Check if audio is available for this exercise
  const hasAudio = AudioUtils.getPreferredAudioUrl(exercise) !== null;

  return (
    <div className="space-y-6">
      {/* Enhanced Selection Help Banner */}
      {showSelectionHelp && (onCreateDictationFromSelection || onCreateBidirectionalFromSelection) && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className={`${isMobile ? 'p-4' : 'p-5'}`}>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold text-blue-900 mb-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Interactive Text Selection
                </h4>
                <p className={`text-blue-800 leading-relaxed ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {isMobile 
                    ? 'Tap and hold any text to create custom exercises. Select words, phrases, or sentences to generate targeted practice materials.'
                    : 'Select any portion of text to create personalized dictation or translation exercises. Perfect for focusing on challenging vocabulary or grammar patterns.'
                  }
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-xs text-blue-700">Dictation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                    <span className="text-xs text-blue-700">Translation</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSelectionHelp(false)}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors duration-200"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Audio Control Panel */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className={`${isMobile ? 'p-4' : 'p-5'} pb-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Volume2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Audio Playback
                </h3>
                <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {hasAudio ? 'Listen to the full text or sentence by sentence' : 'Audio not available for this exercise'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-medium">
              {exercise.language.toUpperCase()}
            </Badge>
          </div>
          {isPlaying && audioProgress > 0 && (
            <div className="mt-3">
              <Progress value={audioProgress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Playing...</span>
                <span>{Math.round(audioProgress)}%</span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className={`${isMobile ? 'p-4' : 'p-5'} pt-0`}>
          <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-wrap'}`}>
            <Button
              onClick={playFullText}
              disabled={isPlaying || !audioEnabled || !hasAudio}
              className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 ${
                isMobile ? 'w-full justify-center py-2.5' : ''
              }`}
            >
              {isPlaying && currentPlayingSentence === -1 ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>
                Play Full Text
              </span>
            </Button>
            
            <Button
              variant="outline"
              onClick={playSentenceBysentence}
              disabled={isPlaying || !audioEnabled || !hasAudio}
              className={`flex items-center gap-2 border-gray-300 hover:bg-gray-50 transition-colors duration-200 ${
                isMobile ? 'w-full justify-center py-2.5' : ''
              }`}
            >
              <Volume2 className="h-4 w-4" />
              <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>
                Sentence by Sentence
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={createDictationFromFullText}
              className={`flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors duration-200 ${
                isMobile ? 'w-full justify-center py-2.5' : ''
              }`}
            >
              <Mic className="h-4 w-4" />
              <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>
                Create Dictation
              </span>
            </Button>
          </div>
          
          {!hasAudio && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Audio is not available for this exercise. Audio generation happens during exercise creation.
              </p>
            </div>
          )}
          
          {isPlaying && currentPlayingSentence !== -1 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className={`text-blue-800 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Playing sentence {currentPlayingSentence + 1} of {exercise.content.sentences.length}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Text Display */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className={`${isMobile ? 'p-4' : 'p-5'} pb-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Reading Text
                </h3>
                <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Click on words for definitions and pronunciation
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
            >
              <BarChart3 className="h-4 w-4" />
              <span className={isMobile ? 'text-xs' : 'text-sm'}>
                {showAnalysis ? 'Hide' : 'Show'} Analysis
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`${isMobile ? 'p-4' : 'p-6'} pt-0`}>
          <TextSelectionManager
            onCreateDictation={onCreateDictationFromSelection || (() => {})}
            onCreateBidirectional={onCreateBidirectionalFromSelection || (() => {})}
            disabled={!onCreateDictationFromSelection && !onCreateBidirectionalFromSelection}
          >
            <div className="prose prose-lg max-w-none">
              {renderHighlightedText()}
            </div>
          </TextSelectionManager>
        </CardContent>
      </Card>

      {/* Enhanced Analysis Panel */}
      {showAnalysis && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className={`${isMobile ? 'p-4' : 'p-5'} pb-3`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Text Analysis
                </h3>
                <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Reading statistics and vocabulary breakdown
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} pt-0 space-y-6`}>
            {/* Enhanced Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  {exercise.content.sentences.length}
                </div>
                <div className="text-sm text-blue-600 font-medium">Sentences</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-700 mb-1">
                  {exercise.content.analysis?.wordCount || fullText.split(/\s+/).length}
                </div>
                <div className="text-sm text-green-600 font-medium">Words</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="text-2xl font-bold text-orange-700 mb-1">
                  {exercise.content.analysis?.readingTime || Math.ceil(fullText.split(/\s+/).length / 200)}
                </div>
                <div className="text-sm text-orange-600 font-medium">Min Read</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-2xl font-bold text-purple-700 mb-1 capitalize">
                  {exercise.difficulty_level}
                </div>
                <div className="text-sm text-purple-600 font-medium">Level</div>
              </div>
            </div>

            {/* Grammar Points */}
            {exercise.content.analysis?.grammarPoints && exercise.content.analysis.grammarPoints.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Grammar Focus
                </h4>
                <div className="flex flex-wrap gap-2">
                  {exercise.content.analysis.grammarPoints.map((point, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800 border border-blue-200">
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Vocabulary Overview */}
            {allWords.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Key Vocabulary ({allWords.length} words)
                </h4>
                <div className="grid gap-3 max-h-64 overflow-y-auto pr-2">
                  {allWords.slice(0, 20).map((word, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${
                          word.difficulty === 'easy' ? 'border-green-300 text-green-700 bg-green-50' :
                          word.difficulty === 'medium' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                          word.difficulty === 'hard' ? 'border-red-300 text-red-700 bg-red-50' :
                          'border-gray-300 text-gray-700 bg-gray-50'
                        }`}
                      >
                        {word.word}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{word.definition}</p>
                        {word.partOfSpeech && (
                          <p className="text-xs text-gray-500 mt-1 italic">{word.partOfSpeech}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {allWords.length > 20 && (
                    <div className="text-center p-3 text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                      And {allWords.length - 20} more words...
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <audio ref={audioRef} />
    </div>
  );
};
