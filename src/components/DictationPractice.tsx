import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Exercise } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import VocabularyHighlighter from '@/components/VocabularyHighlighter';
import { 
  compareTexts, 
  generateHighlightedText,
  TokenComparisonResult 
} from '@/utils/textComparison';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DictationMicrophone from '@/components/DictationMicrophone';

interface DictationPracticeProps {
  exercise: Exercise;
  onComplete: (accuracy: number) => void;
  showResults?: boolean;
  onTryAgain?: () => void;
  hideVocabularyTab?: boolean;
}

const DictationPractice: React.FC<DictationPracticeProps> = ({
  exercise,
  onComplete,
  showResults = false,
  onTryAgain,
  hideVocabularyTab = false
}) => {
  const [userInput, setUserInput] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [highlightedErrors, setHighlightedErrors] = useState<string>('');
  const [tokenResults, setTokenResults] = useState<TokenComparisonResult[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(200); // Default duration in seconds
  const [stats, setStats] = useState<{
    correct: number;
    almost: number;
    incorrect: number;
    missing: number;
    extra: number;
  }>({
    correct: 0,
    almost: 0,
    incorrect: 0,
    missing: 0,
    extra: 0
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleSubmit = () => {
    if (!userInput.trim()) return;
    
    // Use the comparison logic
    const result = compareTexts(exercise.text, userInput);
    const highlightedText = generateHighlightedText(result.tokenResults);
    
    setAccuracy(result.accuracy);
    setHighlightedErrors(highlightedText);
    setTokenResults(result.tokenResults);
    setStats({
      correct: result.correct,
      almost: result.almost,
      incorrect: result.incorrect,
      missing: result.missing,
      extra: result.extra
    });
    
    // Call onComplete immediately with the accuracy result
    onComplete(result.accuracy);

    if (result.accuracy >= 95) {
      toast.success(`Great job! ${result.accuracy}% accuracy!`);
    } else if (result.accuracy >= 70) {
      toast.info(`Good effort! ${result.accuracy}% accuracy. Keep practicing!`);
    } else {
      toast.error(`You scored ${result.accuracy}%. Try listening again carefully.`);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Play/Pause with Shift+Space
    if (e.shiftKey && e.key === ' ') {
      e.preventDefault(); // Prevent space from being typed
      togglePlay();
    }
    
    // Submit on Ctrl+Enter or Command+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleSkipBack = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };
  
  const handleSkipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Update time display
  useEffect(() => {
    if (!audioRef.current) return;
    
    const updateTime = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };
    
    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    audioRef.current.addEventListener('timeupdate', updateTime);
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioRef.current.addEventListener('ended', handleEnded);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateTime);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, []);
  
  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current && !showResults) {
      textareaRef.current.focus();
    }
  }, [showResults]);

  const handleTryAgain = () => {
    setUserInput('');
    if (onTryAgain) {
      onTryAgain();
    }
    
    // Focus on textarea after resetting
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };
  
  // Handle dictation result
  const handleDictationResult = (text: string) => {
    setUserInput(text);
    
    // Focus back on textarea to allow edits
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };
  
  return (
    <div className="space-y-4">
      {/* Header with exercise title and progress */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">{exercise.title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Progress: {exercise.completionCount}/3</span>
            <Progress 
              value={(exercise.completionCount / 3) * 100} 
              className="w-32 h-2" 
              indicatorClassName="bg-indigo-600"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full capitalize">
            {exercise.language}
          </span>
          {exercise.tags.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
              {exercise.tags[0]}
            </span>
          )}
        </div>
      </div>
      
      {!showResults ? (
        <div className="p-6 space-y-8">
          {/* Audio player */}
          <div className="flex flex-col items-center justify-center">
            {exercise.audioUrl && <audio ref={audioRef} src={exercise.audioUrl} />}
            
            <div className="flex items-center justify-center gap-4 mb-4">
              <button 
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                onClick={handleSkipBack}
              >
                <SkipBack className="h-5 w-5 text-gray-700" />
              </button>
              
              <button 
                className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center"
                onClick={togglePlay}
              >
                {isPlaying ? 
                  <Pause className="h-8 w-8 text-white" /> : 
                  <Play className="h-8 w-8 text-white ml-1" />
                }
              </button>
              
              <button 
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                onClick={handleSkipForward}
              >
                <SkipForward className="h-5 w-5 text-gray-700" />
              </button>
            </div>
            
            <div className="w-full max-w-md">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all" 
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Input area */}
          <div className="space-y-4">
            <Textarea
              ref={textareaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type what you hear..."
              className="min-h-32 rounded-xl border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-gray-500">
                Press <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Shift</span> + <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Space</span> to play/pause
              </p>
              
              {/* Updated microphone dictation button with existing text */}
              <DictationMicrophone 
                onTextReceived={handleDictationResult}
                language={exercise.language}
                isDisabled={showResults}
                existingText={userInput}
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg text-base"
              disabled={!userInput.trim()}
            >
              Check Answer
            </Button>
          </div>
        </div>
      ) : (
        // Enhanced Results view with tabs
        <div className="overflow-hidden">
          <Tabs defaultValue="summary" className="w-full">
            <div className="px-6 pt-4">
              <TabsList className={cn(
                "w-full border border-gray-200 p-1 rounded-lg bg-gray-50", 
                hideVocabularyTab ? "grid-cols-2" : "grid-cols-3"
              )}>
                <TabsTrigger 
                  value="summary" 
                  className="rounded-md py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger 
                  value="comparison" 
                  className="rounded-md py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Comparison
                </TabsTrigger>
                {!hideVocabularyTab && (
                  <TabsTrigger 
                    value="vocabulary" 
                    className="rounded-md py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                  >
                    Vocabulary
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="summary" className="mt-0">
              <ScrollArea className="h-[65vh] p-6">
                <div className="space-y-4">
                  {/* Stats section with cards layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Accuracy card */}
                    <div className={cn(
                      "p-6 rounded-lg border text-center flex flex-col items-center justify-center",
                      accuracy && accuracy >= 95 ? "bg-success/10 border-success/50" :
                      accuracy && accuracy >= 70 ? "bg-amber-500/10 border-amber-500/50" :
                      "bg-destructive/10 border-destructive/50"
                    )}>
                      <h3 className="font-medium mb-1 text-gray-600">Accuracy</h3>
                      <div className={cn(
                        "text-4xl font-bold",
                        accuracy && accuracy >= 95 ? "text-success" :
                        accuracy && accuracy >= 70 ? "text-amber-500" :
                        "text-destructive"
                      )}>
                        {accuracy}%
                      </div>
                      
                      {accuracy && accuracy >= 95 ? (
                        <p className="text-sm text-success mt-2">
                          Great job! {exercise.completionCount + 1 >= 3 
                            ? "You've mastered this exercise!" 
                            : `${3 - exercise.completionCount - 1} more successful attempts until mastery.`}
                        </p>
                      ) : (
                        <p className="text-sm mt-2">
                          Keep practicing to improve your accuracy
                        </p>
                      )}
                    </div>

                    {/* Stats breakdown card */}
                    <div className="p-6 rounded-lg border bg-muted/30">
                      <h3 className="font-medium mb-3 text-gray-600">Statistics</h3>
                      <div className="grid grid-cols-5 gap-2">
                        <div className={cn("p-2 rounded flex flex-col items-center", stats.correct > 0 ? "bg-success/20" : "bg-muted")}>
                          <div className="text-xl font-bold">{stats.correct}</div>
                          <div className="text-xs">Correct</div>
                        </div>
                        <div className={cn("p-2 rounded flex flex-col items-center", stats.almost > 0 ? "bg-amber-500/20" : "bg-muted")}>
                          <div className="text-xl font-bold">{stats.almost}</div>
                          <div className="text-xs">Almost</div>
                        </div>
                        <div className={cn("p-2 rounded flex flex-col items-center", stats.incorrect > 0 ? "bg-destructive/20" : "bg-muted")}>
                          <div className="text-xl font-bold">{stats.incorrect}</div>
                          <div className="text-xs">Incorrect</div>
                        </div>
                        <div className={cn("p-2 rounded flex flex-col items-center", stats.missing > 0 ? "bg-blue-500/20" : "bg-muted")}>
                          <div className="text-xl font-bold">{stats.missing}</div>
                          <div className="text-xs">Missing</div>
                        </div>
                        <div className={cn("p-2 rounded flex flex-col items-center", stats.extra > 0 ? "bg-purple-500/20" : "bg-muted")}>
                          <div className="text-xl font-bold">{stats.extra}</div>
                          <div className="text-xs">Extra</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Your Answer section */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">Your Answer</h3>
                    <p 
                      className="text-sm whitespace-pre-wrap p-3 bg-background rounded"
                      dangerouslySetInnerHTML={{ __html: highlightedErrors }}
                    ></p>
                  </div>

                  {/* Legend */}
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-medium mb-2">Legend</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-success"></span>
                        <span className="text-sm">Correct words</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                        <span className="text-sm">Almost correct (minor typos)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-destructive"></span>
                        <span className="text-sm">Incorrect words</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <span className="text-sm">Missing words</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleTryAgain}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="comparison" className="mt-0">
              <ScrollArea className="h-[65vh] p-6">
                <div className="space-y-4">
                  {/* Detailed comparison */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">Word-by-Word Comparison</h3>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {tokenResults.map((result, index) => {
                        if (!result.userToken && result.status === 'missing') {
                          return (
                            <span key={index} className="px-2 py-0.5 bg-blue-100 border border-blue-200 rounded text-sm">
                              <span className="opacity-50">Missing:</span> {result.originalToken}
                            </span>
                          );
                        } else if (result.status === 'extra') {
                          return (
                            <span key={index} className="px-2 py-0.5 bg-purple-100 border border-purple-200 rounded text-sm">
                              <span className="opacity-50">Extra:</span> {result.userToken}
                            </span>
                          );
                        }
                        
                        return null;
                      })}
                    </div>
                    
                    <h3 className="font-medium mb-2 mt-4">Your Answer:</h3>
                    <p 
                      className="text-sm whitespace-pre-wrap bg-background p-3 rounded"
                      dangerouslySetInnerHTML={{ __html: highlightedErrors }}
                    ></p>
                    
                    <h3 className="font-medium mb-2 mt-4">Original Text:</h3>
                    <p className="text-sm whitespace-pre-wrap bg-background p-3 rounded">{exercise.text}</p>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleTryAgain}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {!hideVocabularyTab && (
              <TabsContent value="vocabulary" className="mt-0">
                <ScrollArea className="h-[65vh]">
                  <VocabularyHighlighter exercise={exercise} />
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default DictationPractice;
