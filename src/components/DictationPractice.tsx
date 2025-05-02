
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Exercise } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AudioPlayer from '@/components/AudioPlayer';
import { Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  compareTexts, 
  generateHighlightedText,
  TokenComparisonResult 
} from '@/utils/textComparison';
import { cn } from '@/lib/utils';

interface DictationPracticeProps {
  exercise: Exercise;
  onComplete: (accuracy: number) => void;
}

const DictationPractice: React.FC<DictationPracticeProps> = ({
  exercise,
  onComplete
}) => {
  const [userInput, setUserInput] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [highlightedErrors, setHighlightedErrors] = useState<string>('');
  const [tokenResults, setTokenResults] = useState<TokenComparisonResult[]>([]);
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
  
  const audioPlayerRef = useRef<{ play: () => void; pause: () => void; replay: () => void } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleSubmit = () => {
    if (!userInput.trim()) return;
    
    // Use the new comparison logic
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
    
    setShowResults(true);
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
    // Play/Pause with Ctrl+Space or Alt+Space
    if ((e.ctrlKey || e.altKey) && e.key === ' ') {
      e.preventDefault(); // Prevent space from being typed
      if (audioPlayerRef.current) {
        if (e.ctrlKey) {
          audioPlayerRef.current.play();
        } else {
          audioPlayerRef.current.pause();
        }
      }
    }
    
    // Submit on Ctrl+Enter or Command+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    
    // Replay with Alt+R
    if (e.altKey && e.key === 'r') {
      e.preventDefault();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.replay();
      }
    }
  };
  
  const handleTryAgain = () => {
    setUserInput('');
    setShowResults(false);
    setAccuracy(null);
    setTokenResults([]);
    
    // Focus on textarea after resetting
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Register audio player methods
  const registerAudioPlayerMethods = (methods: { play: () => void; pause: () => void; replay: () => void }) => {
    audioPlayerRef.current = methods;
  };
  
  // Auto-focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current && !showResults) {
      textareaRef.current.focus();
    }
  }, [showResults]);
  
  return (
    <div className="space-y-6">
      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium mb-2">Instructions</h3>
        <p className="text-sm">
          Listen to the audio and type what you hear in the box below.
        </p>
        <div className="mt-2 p-2 bg-background rounded border text-xs flex items-center">
          <Keyboard className="h-3.5 w-3.5 mr-1.5" />
          <span>
            <strong>Ctrl+Space</strong>: Play, 
            <strong> Alt+Space</strong>: Pause, 
            <strong> Alt+R</strong>: Replay, 
            <strong> Ctrl+Enter</strong>: Submit
          </span>
        </div>
      </div>
      
      <div className="flex justify-center">
        <AudioPlayer 
          audioUrl={exercise.audioUrl} 
          demoMode={!exercise.audioUrl}
          registerMethods={registerAudioPlayerMethods}
        />
      </div>
      
      {!showResults ? (
        <div className="space-y-4">
          <div>
            <Textarea
              ref={textareaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type what you hear..."
              className="min-h-40"
              disabled={showResults}
            />
            <p className="text-xs mt-1 text-muted-foreground">
              Press Ctrl+Enter to submit
            </p>
          </div>
          
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!userInput.trim()}
          >
            Check My Answer
          </Button>
        </div>
      ) : (
        // Results section - using ScrollArea for proper scrolling
        <ScrollArea className="h-[60vh] pr-2">
          <div className="space-y-4">
            {/* Stats section */}
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Results Summary</h3>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className={cn("p-2 rounded", stats.correct > 0 ? "bg-success/20" : "bg-muted-foreground/10")}>
                  <div className="text-xl font-bold">{stats.correct}</div>
                  <div className="text-xs">Correct</div>
                </div>
                <div className={cn("p-2 rounded", stats.almost > 0 ? "bg-amber-500/20" : "bg-muted-foreground/10")}>
                  <div className="text-xl font-bold">{stats.almost}</div>
                  <div className="text-xs">Almost</div>
                </div>
                <div className={cn("p-2 rounded", stats.incorrect > 0 ? "bg-destructive/20" : "bg-muted-foreground/10")}>
                  <div className="text-xl font-bold">{stats.incorrect}</div>
                  <div className="text-xs">Incorrect</div>
                </div>
                <div className={cn("p-2 rounded", stats.missing > 0 ? "bg-blue-500/20" : "bg-muted-foreground/10")}>
                  <div className="text-xl font-bold">{stats.missing}</div>
                  <div className="text-xs">Missing</div>
                </div>
                <div className={cn("p-2 rounded", stats.extra > 0 ? "bg-purple-500/20" : "bg-muted-foreground/10")}>
                  <div className="text-xl font-bold">{stats.extra}</div>
                  <div className="text-xs">Extra</div>
                </div>
              </div>
            </div>
            
            {/* Detailed comparison */}
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Word-by-Word Comparison</h3>
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
                className="text-sm whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: highlightedErrors }}
              ></p>
            </div>
            
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Original Text:</h3>
              <p className="text-sm whitespace-pre-wrap">{exercise.text}</p>
            </div>
            
            <div className="bg-muted p-4 rounded-md text-center">
              <h3 className="font-medium mb-1">Accuracy</h3>
              <div className={`text-2xl font-bold ${
                accuracy && accuracy >= 95 
                  ? 'text-success' 
                  : accuracy && accuracy >= 70 
                    ? 'text-amber-500' 
                    : 'text-destructive'
              }`}>
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
              
              <div className="mt-4 text-xs p-2 bg-background rounded border flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-success"></span>
                  <span>Correct words</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span>Almost correct (minor typos)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-destructive"></span>
                  <span>Incorrect words</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleTryAgain}
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default DictationPractice;

