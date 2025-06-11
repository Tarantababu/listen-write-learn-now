import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Exercise } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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
import DictationTips from '@/components/DictationTips';
import SpecialCharacterHints from '@/components/SpecialCharacterHints';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useSession } from '@/hooks/use-session';
import { getLanguageShortcuts, applyShortcuts } from '@/utils/specialCharacters';
import ConfettiCelebration from '@/components/ConfettiCelebration';
import { ArrowRightIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DictationPracticeProps {
  exercise: Exercise;
  onComplete: (accuracy: number) => void;
  showResults?: boolean;
  onTryAgain?: () => void;
  hideVocabularyTab?: boolean;
  onViewReadingAnalysis?: () => void;
  hasReadingAnalysis?: boolean;
  keepResultsVisible?: boolean; // Prop to control result visibility
  autoPlay?: boolean; // Prop to control auto-playing audio
  onNextExercise?: () => void; // New prop for next exercise navigation
  hasNextExercise?: boolean; // New prop to indicate if there's a next exercise
}

const DictationPractice: React.FC<DictationPracticeProps> = ({
  exercise,
  onComplete,
  showResults = false,
  onTryAgain,
  hideVocabularyTab = false,
  onViewReadingAnalysis,
  hasReadingAnalysis = false,
  keepResultsVisible = false, // Default to false for backward compatibility
  autoPlay = false, // Default to false for backward compatibility
  onNextExercise,
  hasNextExercise = false
}) => {
  const [userInput, setUserInput] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [highlightedErrors, setHighlightedErrors] = useState<string>('');
  const [tokenResults, setTokenResults] = useState<TokenComparisonResult[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(200); // Default duration in seconds
  const [internalShowResults, setInternalShowResults] = useState(showResults);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showStickyControls, setShowStickyControls] = useState(false);
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
  
  const [progressValue, setProgressValue] = useState((exercise.completionCount / 3) * 100);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMasteryMessage, setShowMasteryMessage] = useState(false);
  
  const isMobile = useIsMobile();
  
  // Get shortcuts for the current language
  const shortcuts = getLanguageShortcuts(exercise.language);
  
  // Function to get dynamic button label based on accuracy
  const getTryAgainButtonLabel = () => {
    if (accuracy === null) return "Try Again";
    
    if (accuracy >= 95) {
      return "Practice More";
    } else if (accuracy >= 85) {
      return "Almost There!";
    } else if (accuracy >= 70) {
      return "Keep Trying";
    } else if (accuracy >= 50) {
      return "Try Again";
    } else {
      return "Listen Again";
    }
  };
  
  // Sync with external showResults prop
  useEffect(() => {
    setInternalShowResults(showResults);
  }, [showResults]);
  
  useEffect(() => {
    setProgressValue((exercise.completionCount / 3) * 100);
  }, [exercise.completionCount]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mainAudioControlsRef = useRef<HTMLDivElement>(null);
  const inputSectionRef = useRef<HTMLDivElement>(null);
  
  // Mobile sticky controls scroll handler
  useEffect(() => {
    if (!isMobile || internalShowResults) return;
    
    const handleScroll = () => {
      if (mainAudioControlsRef.current && inputSectionRef.current) {
        const audioControlsRect = mainAudioControlsRef.current.getBoundingClientRect();
        const inputSectionRect = inputSectionRef.current.getBoundingClientRect();
        
        // Show sticky controls when main controls are out of view and input section is visible
        const shouldShowSticky = audioControlsRect.bottom < 0 && inputSectionRect.top < window.innerHeight;
        setShowStickyControls(shouldShowSticky);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, internalShowResults]);
  
  // Handle audio autoplay when component mounts with recovery attempts
  useEffect(() => {
    if (audioRef.current && autoPlay && !internalShowResults) {
      // We need to catch any autoplay errors to handle browser restrictions
      const attemptPlay = () => {
        if (!audioRef.current) return;
        
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setAutoplayBlocked(false);
            })
            .catch(error => {
              console.log('Autoplay prevented:', error);
              setIsPlaying(false);
              setAutoplayBlocked(true);
            });
        }
      };
      
      // Make initial attempt
      attemptPlay();
      
      // Add a user interaction listener to automatically retry playing once user interacts
      const handleUserInteraction = () => {
        if (audioRef.current && autoplayBlocked) {
          attemptPlay();
          // Remove event listeners after successful play attempt
          if (!autoplayBlocked) {
            removeInteractionListeners();
          }
        }
      };
      
      // Add listeners for common user interactions
      const interactionEvents = ['click', 'touchstart', 'keydown'];
      interactionEvents.forEach(event => {
        document.addEventListener(event, handleUserInteraction, { once: true });
      });
      
      // Cleanup function to remove listeners
      const removeInteractionListeners = () => {
        interactionEvents.forEach(event => {
          document.removeEventListener(event, handleUserInteraction);
        });
      };
      
      return () => {
        removeInteractionListeners();
      };
    }
  }, [audioRef.current, autoPlay, internalShowResults, autoplayBlocked]);
  
  // Handle text input with special character shortcuts
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Apply special character shortcuts if available
    if (shortcuts.length > 0) {
      const processedValue = applyShortcuts(newValue, shortcuts);
      setUserInput(processedValue);
    } else {
      setUserInput(newValue);
    }
  };
  
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
    
    // Set internal results state - show results
    setInternalShowResults(true);
    
    // Check if this completion will result in mastery (3/3)
    const willBeMastered = result.accuracy >= 95 && exercise.completionCount === 2;
    
    // Call onComplete with the accuracy result
    onComplete(result.accuracy);

    // Show confetti if exercise is being mastered
    if (willBeMastered) {
      setShowConfetti(true);
      setShowMasteryMessage(true);
      // Don't show the regular toast for mastery, confetti handles the celebration
    } else if (result.accuracy >= 95) {
      toast({
        title: "Great job!",
        description: `${Math.round(result.accuracy)}% accuracy!`,
        variant: "default"
      });
    } else if (result.accuracy >= 70) {
      toast({
        title: "Good effort!",
        description: `${Math.round(result.accuracy)}% accuracy. You need 95% for it to count toward completion.`,
        variant: "default"
      });
    } else {
      toast({
        title: "Keep practicing",
        description: `You scored ${Math.round(result.accuracy)}%. Try listening again carefully.`,
        variant: "default"
      });
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
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch(error => {
            console.log('Play prevented:', error);
            setAutoplayBlocked(true);
          });
      }
    }
  };
  
  const handleSkipBack = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 1);
  };
  
  const handleSkipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 1);
  };

  // Handle seeking with slider
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekStart = () => {
    setIsDragging(true);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
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
      if (audioRef.current && !isDragging) {
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
  }, [isDragging]);
  
  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current && !internalShowResults) {
      textareaRef.current.focus();
    }
  }, [internalShowResults]);

  // Modified handleTryAgain to respect keepResultsVisible
  const handleTryAgain = () => {
    // Only reset if not instructed to keep results visible
    if (!keepResultsVisible) {
      setUserInput('');
      setInternalShowResults(false);
      setShowMasteryMessage(false);
      
      // Focus on textarea after resetting
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    }
    
    // Always call the parent's onTryAgain if provided
    if (onTryAgain) {
      onTryAgain();
    }
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

  // Handle confetti completion
  const handleConfettiComplete = () => {
    setShowConfetti(false);
  };

  // Mobile touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || !touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Only trigger if horizontal swipe is more significant than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - skip back
        handleSkipBack();
      } else {
        // Swipe left - skip forward
        handleSkipForward();
      }
    }
    
    setTouchStart(null);
  };

  // Audio Controls Component (reusable for desktop and mobile)
  const AudioControls = ({ compact = false, className = "" }) => (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn(
        "flex items-center justify-center gap-4 mb-4",
        compact && "gap-2 mb-2"
      )}>
        <button 
          className={cn(
            "rounded-full bg-gray-100 flex items-center justify-center",
            compact ? "w-8 h-8" : "w-10 h-10"
          )}
          onClick={handleSkipBack}
        >
          <SkipBack className={cn("text-gray-700", compact ? "h-3 w-3" : "h-5 w-5")} />
        </button>
        
        <button 
          className={cn(
            "rounded-full bg-indigo-600 flex items-center justify-center",
            compact ? "w-12 h-12" : "w-16 h-16"
          )}
          onClick={togglePlay}
        >
          {isPlaying ? 
            <Pause className={cn("text-white", compact ? "h-6 w-6" : "h-8 w-8")} /> : 
            <Play className={cn("text-white ml-1", compact ? "h-6 w-6" : "h-8 w-8")} />
          }
        </button>
        
        <button 
          className={cn(
            "rounded-full bg-gray-100 flex items-center justify-center",
            compact ? "w-8 h-8" : "w-10 h-10"
          )}
          onClick={handleSkipForward}
        >
          <SkipForward className={cn("text-gray-700", compact ? "h-3 w-3" : "h-5 w-5")} />
        </button>
      </div>
      
      {!compact && (
        <div className="w-full max-w-md space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            onValueCommit={handleSeekEnd}
            onPointerDown={handleSeekStart}
            className="w-full"
            disabled={!exercise.audioUrl}
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="space-y-4">
      {/* Confetti celebration */}
      <ConfettiCelebration 
        show={showConfetti} 
        onComplete={handleConfettiComplete}
      />

      {/* Audio element */}
      {exercise.audioUrl && <audio ref={audioRef} src={exercise.audioUrl} />}

      {/* Mobile Sticky Audio Controls */}
      {isMobile && showStickyControls && !internalShowResults && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                onClick={handleSkipBack}
              >
                <SkipBack className="h-3 w-3 text-gray-700" />
              </button>
              
              <button 
                className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center"
                onClick={togglePlay}
              >
                {isPlaying ? 
                  <Pause className="h-5 w-5 text-white" /> : 
                  <Play className="h-5 w-5 text-white ml-0.5" />
                }
              </button>
              
              <button 
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                onClick={handleSkipForward}
              >
                <SkipForward className="h-3 w-3 text-gray-700" />
              </button>
            </div>
            
            <div className="text-xs text-gray-500 font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
      )}

      {/* Header with exercise title and progress */}
      <div className={cn("p-4 border-b", showStickyControls && isMobile && "pt-16")}>
        <div className="flex justify-between items-center mb-2">
          <h1 className={cn("font-bold", isMobile ? "text-lg" : "text-2xl")}>{exercise.title}</h1>
          <div className="flex items-center gap-3">
            <span className={cn("text-gray-600", isMobile ? "text-xs" : "text-sm")}>
              Progress: {exercise.completionCount}/3
            </span>
            <Progress 
              value={progressValue} 
              className={cn("h-2", isMobile ? "w-20" : "w-32")} 
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
      
      {!internalShowResults ? (
        <div className={cn("space-y-8", isMobile ? "p-4 space-y-6" : "p-6")}>
          {/* Audio player - Desktop layout */}
          {!isMobile && (
            <div ref={mainAudioControlsRef}>
              {autoplayBlocked && (
                <Alert className="mb-4 bg-amber-50 border-amber-200">
                  <Volume2 className="h-4 w-4 text-amber-500" />
                  <AlertTitle>Autoplay blocked</AlertTitle>
                  <AlertDescription>
                    Your browser has blocked automatic audio playback. 
                    Please use the play button below to start the audio.
                  </AlertDescription>
                </Alert>
              )}
              
              <AudioControls />
            </div>
          )}

          {/* Mobile Audio Player - Fixed to remove duplicate slider */}
          {isMobile && (
            <div ref={mainAudioControlsRef}>
              {autoplayBlocked && (
                <Alert className="mb-4 bg-amber-50 border-amber-200">
                  <Volume2 className="h-4 w-4 text-amber-500" />
                  <AlertTitle>Autoplay blocked</AlertTitle>
                  <AlertDescription className="text-sm">
                    Your browser blocked autoplay. Use the play button below.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex flex-col items-center justify-center">
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
                  
                  <div className="w-full max-w-md space-y-2">
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      onValueCommit={handleSeekEnd}
                      onPointerDown={handleSeekStart}
                      className="w-full"
                      disabled={!exercise.audioUrl}
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Input area */}
          <div 
            ref={inputSectionRef}
            className="space-y-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Mobile Quick Controls */}
            {isMobile && (
              <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 font-medium">Swipe:</span>
                  <span className="text-blue-600">← forward, → back</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center"
                  >
                    {isPlaying ? 
                      <Pause className="h-4 w-4 text-blue-700" /> : 
                      <Play className="h-4 w-4 text-blue-700 ml-0.5" />
                    }
                  </button>
                </div>
              </div>
            )}
            
            <Textarea
              ref={textareaRef}
              value={userInput}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type what you hear..."
              className={cn(
                "rounded-xl border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50",
                isMobile ? "min-h-40 text-base" : "min-h-32"
              )}
            />
            
            <div className={cn(
              "flex items-center justify-between flex-wrap gap-2",
              isMobile && "flex-col items-stretch space-y-2"
            )}>
              <div className={cn(
                "flex items-center gap-2 flex-wrap",
                isMobile && "justify-center"
              )}>
                <p className={cn("text-gray-500", isMobile ? "text-xs text-center" : "text-sm")}>
                  Press <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Shift</span> + <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Space</span> to play/pause
                </p>
                
                <SpecialCharacterHints language={exercise.language} />
              </div>
              
              <div className={cn(
                "flex items-center gap-2",
                isMobile && "justify-center"
              )}>
                <DictationTips />
                
                {/* Updated microphone dictation button with existing text */}
                <DictationMicrophone 
                  onTextReceived={handleDictationResult}
                  language={exercise.language}
                  isDisabled={internalShowResults}
                  existingText={userInput}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-center items-center gap-4">
            <Button
              onClick={handleSubmit}
              className={cn(
                "bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg",
                isMobile ? "px-6 py-3 text-base w-full" : "px-8 py-2 text-base"
              )}
              disabled={!userInput.trim()}
            >
              Check Answer
            </Button>
            
            {hasReadingAnalysis && onViewReadingAnalysis && !isMobile && (
              <Button
                onClick={onViewReadingAnalysis}
                variant="outline"
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                View Reading Analysis
              </Button>
            )}
          </div>

          {/* Mobile Reading Analysis Button */}
          {hasReadingAnalysis && onViewReadingAnalysis && isMobile && (
            <div className="flex justify-center">
              <Button
                onClick={onViewReadingAnalysis}
                variant="outline"
                className="flex items-center gap-2 w-full"
              >
                <BookOpen className="h-4 w-4" />
                View Reading Analysis
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Enhanced Results view with tabs
        <div className="overflow-hidden">
          {/* Show mastery celebration message if exercise was just mastered */}
          {showMasteryMessage && exercise.completionCount >= 3 && (
            <div className={cn(isMobile ? "px-4 pt-4" : "px-6 pt-4")}>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🎉</div>
                  <div>
                    <h3 className="font-semibold text-green-800">Exercise Mastered!</h3>
                    <p className={cn("text-green-600", isMobile ? "text-sm" : "text-sm")}>
                      Congratulations! You've completed this exercise 3 times with high accuracy.
                    </p>
                  </div>
                </div>
                
                {/* Show next exercise button if available */}
                {hasNextExercise && onNextExercise && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      onClick={onNextExercise}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                      Next Exercise
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <Tabs defaultValue="summary" className="w-full">
            <div className={cn(isMobile ? "px-4 pt-4" : "px-6 pt-4")}>
              <TabsList className={cn(
                "w-full border border-gray-200 p-1 rounded-lg bg-gray-50", 
                hideVocabularyTab ? "grid-cols-2" : "grid-cols-3"
              )}>
                <TabsTrigger 
                  value="summary" 
                  className={cn(
                    "rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm data-[state=active]:font-semibold",
                    isMobile ? "py-2 text-xs font-medium" : "py-2.5 text-sm font-medium"
                  )}
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger 
                  value="comparison" 
                  className={cn(
                    "rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm data-[state=active]:font-semibold",
                    isMobile ? "py-2 text-xs font-medium" : "py-2.5 text-sm font-medium"
                  )}
                >
                  Comparison
                </TabsTrigger>
                {!hideVocabularyTab && (
                  <TabsTrigger 
                    value="vocabulary" 
                    className={cn(
                      "rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm data-[state=active]:font-semibold",
                      isMobile ? "py-2 text-xs font-medium" : "py-2.5 text-sm font-medium"
                    )}
                  >
                    Vocabulary
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="summary" className="mt-0">
              <ScrollArea className={cn(isMobile ? "h-[60vh] p-4" : "h-[65vh] p-6")}>
                <div className="space-y-4">
                  {/* Stats section with cards layout */}
                  <div className={cn(
                    "grid gap-4 mb-6",
                    isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
                  )}>
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
                        {accuracy ? Math.round(accuracy) : 0}%
                      </div>
                      
                      {accuracy && accuracy >= 95 ? (
                        <p className="text-sm text-success mt-2">
                          Great job! This attempt counts toward your progress.
                        </p>
                      ) : (
                        <p className="text-sm mt-2 text-muted-foreground">
                          You need at least 95% accuracy for it to count toward progress.
                        </p>
                      )}
                    </div>

                    {/* Stats breakdown card */}
                    <div className="p-6 rounded-lg border bg-muted/30">
                      <h3 className="font-medium mb-3 text-gray-600">Statistics</h3>
                      <div className="grid grid-cols-5 gap-2">
                        <div className={cn("p-2 rounded flex flex-col items-center", stats.correct > 0 ? "bg-success/20" : "bg-muted")}>
                          <div className={cn("font-bold", isMobile ? "text-lg" : "text-xl")}>{stats.correct}</div>
                          <div className={cn(isMobile ? "text-xs" : "text-xs")}>Correct</div>
                        </div>
                        <div className={cn("p-2 rounded flex flex-col items-center", stats.almost > 0 ? "bg-amber-500/20" : "bg-muted")}>
                          <div className={cn("font-bold", isMobile ? "text-lg" : "text-xl")}>{stats.almost}</div>
                          <div className={cn(isMobile ? "text-xs" : "text-xs")}>Almost</div>
                        </div>
                        <div className={cn("p-2 rounded flex flex-col items-center", stats.incorrect > 0 ? "bg-destructive/20" : "bg-muted")}>
                          <div className={cn("font-bold", isMobile ? "text-lg" : "text-xl")}>{stats.incorrect}</div>
                          <div className={cn(isMobile ? "text-xs" : "text-xs")}>Incorrect</div>
                        </div>
                        <div className={cn("p-2 rounded flex flex-col items-center", stats.missing > 0 ? "bg-blue-500/20" : "bg-muted")}>
                          <div className={cn("font-bold", isMobile ? "text-lg" : "text-xl")}>{stats.missing}</div>
                          <div className={cn(isMobile ? "text-xs" : "text-xs")}>Missing</div>
                        </div>
                        <div className={cn("p-2 rounded flex flex-col items-center", stats.extra > 0 ? "bg-purple-500/20" : "bg-muted")}>
                          <div className={cn("font-bold", isMobile ? "text-lg" : "text-xl")}>{stats.extra}</div>
                          <div className={cn(isMobile ? "text-xs" : "text-xs")}>Extra</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Your Answer section */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">Your Answer</h3>
                    <p 
                      className={cn(
                        "whitespace-pre-wrap p-3 bg-background rounded",
                        isMobile ? "text-sm" : "text-sm"
                      )}
                      dangerouslySetInnerHTML={{ __html: highlightedErrors }}
                    ></p>
                  </div>

                  {/* Legend */}
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-medium mb-2">Legend</h3>
                    <div className={cn("grid gap-2", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-success"></span>
                        <span className={cn(isMobile ? "text-xs" : "text-sm")}>Correct words</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                        <span className={cn(isMobile ? "text-xs" : "text-sm")}>Almost correct (minor typos)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-destructive"></span>
                        <span className={cn(isMobile ? "text-xs" : "text-sm")}>Incorrect words</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <span className={cn(isMobile ? "text-xs" : "text-sm")}>Missing words</span>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "flex pt-4",
                    isMobile ? "flex-col gap-3" : "justify-between"
                  )}>
                    <div>
                      {hasReadingAnalysis && onViewReadingAnalysis && (
                        <Button
                          onClick={onViewReadingAnalysis}
                          variant="outline"
                          className={cn(
                            "flex items-center gap-2",
                            isMobile && "w-full justify-center"
                          )}
                        >
                          <BookOpen className="h-4 w-4" />
                          View Reading Analysis
                        </Button>
                      )}
                    </div>
                    <div className={cn("flex gap-2", isMobile && "flex-col")}>
                      {/* Show next exercise button if mastered and available */}
                      {showMasteryMessage && hasNextExercise && onNextExercise && (
                        <Button
                          onClick={onNextExercise}
                          className={cn(
                            "bg-green-600 hover:bg-green-700 text-white flex items-center gap-2",
                            isMobile && "w-full justify-center"
                          )}
                        >
                          Next Exercise
                          <ArrowRightIcon className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={handleTryAgain}
                        className={cn(
                          "bg-indigo-600 hover:bg-indigo-700 text-white",
                          isMobile && "w-full"
                        )}
                      >
                        {getTryAgainButtonLabel()}
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="comparison" className="mt-0">
              <ScrollArea className={cn(isMobile ? "h-[60vh] p-4" : "h-[65vh] p-6")}>
                <div className="space-y-4">
                  {/* Detailed comparison */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">Word-by-Word Comparison</h3>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {tokenResults.map((result, index) => {
                        if (!result.userToken && result.status === 'missing') {
                          return (
                            <span key={index} className={cn(
                              "px-2 py-0.5 bg-blue-100 border border-blue-200 rounded",
                              isMobile ? "text-xs" : "text-sm"
                            )}>
                              <span className="opacity-50">Missing:</span> {result.originalToken}
                            </span>
                          );
                        } else if (result.status === 'extra') {
                          return (
                            <span key={index} className={cn(
                              "px-2 py-0.5 bg-purple-100 border border-purple-200 rounded",
                              isMobile ? "text-xs" : "text-sm"
                            )}>
                              <span className="opacity-50">Extra:</span> {result.userToken}
                            </span>
                          );
                        }
                        
                        return null;
                      })}
                    </div>
                    
                    <h3 className="font-medium mb-2 mt-4">Your Answer:</h3>
                    <p 
                      className={cn(
                        "whitespace-pre-wrap bg-background p-3 rounded",
                        isMobile ? "text-sm" : "text-sm"
                      )}
                      dangerouslySetInnerHTML={{ __html: highlightedErrors }}
                    ></p>
                    
                    <h3 className="font-medium mb-2 mt-4">Original Text:</h3>
                    <p className={cn(
                      "whitespace-pre-wrap bg-background p-3 rounded",
                      isMobile ? "text-sm" : "text-sm"
                    )}>{exercise.text}</p>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleTryAgain}
                      className={cn(
                        "bg-indigo-600 hover:bg-indigo-700 text-white",
                        isMobile && "w-full"
                      )}
                    >
                      {getTryAgainButtonLabel()}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {!hideVocabularyTab && (
              <TabsContent value="vocabulary" className="mt-0">
                <ScrollArea className={cn(isMobile ? "h-[60vh]" : "h-[65vh]")}>
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
