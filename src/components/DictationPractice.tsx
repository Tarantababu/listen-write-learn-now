import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { Exercise } from "@/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, BookOpen, Volume2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import VocabularyHighlighter from "@/components/VocabularyHighlighter"
import { compareTexts, generateHighlightedText, type TokenComparisonResult } from "@/utils/textComparison"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DictationMicrophone from "@/components/DictationMicrophone"
import DictationTips from "@/components/DictationTips"
import SpecialCharacterHints from "@/components/SpecialCharacterHints"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { getLanguageShortcuts, applyShortcuts } from "@/utils/specialCharacters"

interface DictationPracticeProps {
  exercise: Exercise
  onComplete: (accuracy: number) => void
  showResults?: boolean
  onTryAgain?: () => void
  hideVocabularyTab?: boolean
  onViewReadingAnalysis?: () => void
  hasReadingAnalysis?: boolean
  keepResultsVisible?: boolean // Prop to control result visibility
  autoPlay?: boolean // Prop to control auto-playing audio
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
}) => {
  const [userInput, setUserInput] = useState("")
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [highlightedErrors, setHighlightedErrors] = useState<string>("")
  const [tokenResults, setTokenResults] = useState<TokenComparisonResult[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(200) // Default duration in seconds
  const [internalShowResults, setInternalShowResults] = useState(showResults)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [isDragging, setIsDragging] = useState(isDragging)
  const [stats, setStats] = useState<{
    correct: number
    almost: number
    incorrect: number
    missing: number
    extra: number
  }>({
    correct: 0,
    almost: 0,
    incorrect: 0,
    missing: 0,
    extra: 0,
  })

  const [progressValue, setProgressValue] = useState((exercise.completionCount / 3) * 100)

  // Get shortcuts for the current language
  const shortcuts = getLanguageShortcuts(exercise.language)

  // Sync with external showResults prop
  useEffect(() => {
    setInternalShowResults(showResults)
  }, [showResults])

  useEffect(() => {
    setProgressValue((exercise.completionCount / 3) * 100)
  }, [exercise.completionCount])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle audio autoplay when component mounts with recovery attempts
  useEffect(() => {
    if (audioRef.current && autoPlay && !internalShowResults) {
      // We need to catch any autoplay errors to handle browser restrictions
      const attemptPlay = () => {
        if (!audioRef.current) return

        const playPromise = audioRef.current.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true)
              setAutoplayBlocked(false)
            })
            .catch((error) => {
              console.log("Autoplay prevented:", error)
              setIsPlaying(false)
              setAutoplayBlocked(true)
            })
        }
      }

      // Make initial attempt
      attemptPlay()

      // Add a user interaction listener to automatically retry playing once user interacts
      const handleUserInteraction = () => {
        if (audioRef.current && autoplayBlocked) {
          attemptPlay()
          // Remove event listeners after successful play attempt
          if (!autoplayBlocked) {
            removeInteractionListeners()
          }
        }
      }

      // Add listeners for common user interactions
      const interactionEvents = ["click", "touchstart", "keydown"]
      interactionEvents.forEach((event) => {
        document.addEventListener(event, handleUserInteraction, { once: true })
      })

      // Cleanup function to remove listeners
      const removeInteractionListeners = () => {
        interactionEvents.forEach((event) => {
          document.removeEventListener(event, handleUserInteraction)
        })
      }

      return () => {
        removeInteractionListeners()
      }
    }
  }, [audioRef.current, autoPlay, internalShowResults, autoplayBlocked])

  // Handle text input with special character shortcuts
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value

    // Apply special character shortcuts if available
    if (shortcuts.length > 0) {
      const processedValue = applyShortcuts(newValue, shortcuts)
      setUserInput(processedValue)
    } else {
      setUserInput(newValue)
    }
  }

  const handleSubmit = () => {
    if (!userInput.trim()) return

    // Use the comparison logic
    const result = compareTexts(exercise.text, userInput)
    const highlightedText = generateHighlightedText(result.tokenResults)

    setAccuracy(result.accuracy)
    setHighlightedErrors(highlightedText)
    setTokenResults(result.tokenResults)
    setStats({
      correct: result.correct,
      almost: result.almost,
      incorrect: result.incorrect,
      missing: result.missing,
      extra: result.extra,
    })

    // Set internal results state - show results
    setInternalShowResults(true)

    // Call onComplete with the accuracy result
    onComplete(result.accuracy)

    // Only show result toast - the calling component will handle persistence
    if (result.accuracy >= 95) {
      toast({
        title: "Great job!",
        description: `${Math.round(result.accuracy)}% accuracy!`,
        variant: "default",
      })
    } else if (result.accuracy >= 70) {
      toast({
        title: "Good effort!",
        description: `${Math.round(result.accuracy)}% accuracy. You need 95% for it to count toward completion.`,
        variant: "default",
      })
    } else {
      toast({
        title: "Keep practicing",
        description: `You scored ${Math.round(result.accuracy)}%. Try listening again carefully.`,
        variant: "default",
      })
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Play/Pause with Shift+Space
    if (e.shiftKey && e.key === " ") {
      e.preventDefault() // Prevent space from being typed
      togglePlay()
    }

    // Submit on Ctrl+Enter or Command+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
  }

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      const playPromise = audioRef.current.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
            setAutoplayBlocked(false)
          })
          .catch((error) => {
            console.log("Play prevented:", error)
            setAutoplayBlocked(true)
          })
      }
    }
  }

  const handleSkipBack = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
  }

  const handleSkipForward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10)
  }

  // Handle seeking with slider
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return

    const newTime = value[0]
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleSeekStart = () => {
    setIsDragging(true)
  }

  const handleSeekEnd = () => {
    setIsDragging(false)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Update time display
  useEffect(() => {
    if (!audioRef.current) return

    const updateTime = () => {
      if (audioRef.current && !isDragging) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    audioRef.current.addEventListener("timeupdate", updateTime)
    audioRef.current.addEventListener("loadedmetadata", handleLoadedMetadata)
    audioRef.current.addEventListener("ended", handleEnded)

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", updateTime)
        audioRef.current.removeEventListener("loadedmetadata", handleLoadedMetadata)
        audioRef.current.removeEventListener("ended", handleEnded)
      }
    }
  }, [isDragging])

  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current && !internalShowResults) {
      textareaRef.current.focus()
    }
  }, [internalShowResults])

  // Modified handleTryAgain to respect keepResultsVisible
  const handleTryAgain = () => {
    // Only reset if not instructed to keep results visible
    if (!keepResultsVisible) {
      setUserInput("")
      setInternalShowResults(false)

      // Focus on textarea after resetting
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
        }
      }, 0)
    }

    // Always call the parent's onTryAgain if provided
    if (onTryAgain) {
      onTryAgain()
    }
  }

  // Handle dictation result
  const handleDictationResult = (text: string) => {
    setUserInput(text)

    // Focus back on textarea to allow edits
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 100)
  }

  return (
    <div className="space-y-4">
      {/* Header with exercise title and progress */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">{exercise.title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Progress: {exercise.completionCount}/3</span>
            <Progress value={progressValue} className="w-32 h-2" indicatorClassName="bg-indigo-600" />
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full capitalize">
            {exercise.language}
          </span>
          {exercise.tags.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">{exercise.tags[0]}</span>
          )}
        </div>
      </div>

      {!internalShowResults ? (
        <div className="p-6 space-y-8">
          {/* Audio player */}
          <div className="flex flex-col items-center justify-center">
            {exercise.audioUrl && <audio ref={audioRef} src={exercise.audioUrl} />}

            {autoplayBlocked && (
              <Alert className="mb-4 bg-amber-50 border-amber-200">
                <Volume2 className="h-4 w-4 text-amber-500" />
                <AlertTitle>Autoplay blocked</AlertTitle>
                <AlertDescription>
                  Your browser has blocked automatic audio playback. Please use the play button below to start the
                  audio.
                </AlertDescription>
              </Alert>
            )}

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
                {isPlaying ? <Pause className="h-8 w-8 text-white" /> : <Play className="h-8 w-8 text-white ml-1" />}
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

          {/* Enhanced Input area */}
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={userInput}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Start typing what you hear... 🎧"
                className={cn(
                  "min-h-32 text-base leading-relaxed transition-all duration-200",
                  "rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm",
                  "focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:bg-white",
                  "hover:border-gray-300 hover:bg-white/70",
                  "placeholder:text-gray-400 placeholder:italic",
                  "resize-none shadow-sm",
                  // Mobile optimizations
                  "text-16px", // Prevents zoom on iOS
                  userInput.length > 0 && "border-indigo-300 bg-white",
                )}
                style={{ fontSize: "16px" }} // Explicit font size for mobile
              />

              {/* Character count indicator */}
              {userInput.length > 0 && (
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
                  {userInput.length} chars
                </div>
              )}

              {/* Typing indicator animation */}
              {userInput.length === 0 && (
                <div className="absolute top-4 left-4 flex items-center gap-1 text-gray-300 pointer-events-none">
                  <div className="w-1 h-4 bg-current animate-pulse" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1 h-4 bg-current animate-pulse" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1 h-4 bg-current animate-pulse" style={{ animationDelay: "300ms" }}></div>
                </div>
              )}
            </div>

            {/* Enhanced helper section */}
            <div className="bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-lg p-4 space-y-3">
              {/* Keyboard shortcuts */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span className="text-xs">⌨️</span>
                    <span className="hidden sm:inline">Shortcuts:</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono shadow-sm">
                        Shift + Space
                      </kbd>
                      <span className="text-xs text-gray-500">play/pause</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono shadow-sm">
                      Ctrl + Enter
                    </kbd>
                    <span className="text-xs text-gray-500">submit</span>
                  </div>
                </div>

                <SpecialCharacterHints language={exercise.language} />
              </div>

              {/* Tools section */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <DictationTips />

                  {/* Enhanced microphone button */}
                  <DictationMicrophone
                    onTextReceived={handleDictationResult}
                    language={exercise.language}
                    isDisabled={internalShowResults}
                    existingText={userInput}
                  />
                </div>

                {/* Progress indicator for typing */}
                {userInput.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="hidden sm:inline">Ready to check</span>
                    <span className="sm:hidden">Ready</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center gap-4 pt-2">
            <Button
              onClick={handleSubmit}
              className={cn(
                "px-8 py-3 rounded-xl text-base font-medium transition-all duration-200",
                "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800",
                "text-white shadow-lg hover:shadow-xl transform hover:scale-105",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg",
                userInput.trim() && "ring-2 ring-indigo-200 ring-offset-2",
              )}
              disabled={!userInput.trim()}
            >
              {userInput.trim() ? "✓ Check Answer" : "Type to continue..."}
            </Button>

            {hasReadingAnalysis && onViewReadingAnalysis && (
              <Button
                onClick={onViewReadingAnalysis}
                variant="outline"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 hover:bg-gray-50 transition-all duration-200"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">View Reading Analysis</span>
                <span className="sm:hidden">Reading</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        // Enhanced Results view with tabs
        <div className="overflow-hidden">
          <Tabs defaultValue="summary" className="w-full">
            <div className="px-6 pt-4">
              <TabsList
                className={cn(
                  "w-full border border-gray-200 p-1 rounded-lg bg-gray-50",
                  hideVocabularyTab ? "grid-cols-2" : "grid-cols-3",
                )}
              >
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
                    <div
                      className={cn(
                        "p-6 rounded-lg border text-center flex flex-col items-center justify-center",
                        accuracy && accuracy >= 95
                          ? "bg-success/10 border-success/50"
                          : accuracy && accuracy >= 70
                            ? "bg-amber-500/10 border-amber-500/50"
                            : "bg-destructive/10 border-destructive/50",
                      )}
                    >
                      <h3 className="font-medium mb-1 text-gray-600">Accuracy</h3>
                      <div
                        className={cn(
                          "text-4xl font-bold",
                          accuracy && accuracy >= 95
                            ? "text-success"
                            : accuracy && accuracy >= 70
                              ? "text-amber-500"
                              : "text-destructive",
                        )}
                      >
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
                        <div
                          className={cn(
                            "p-2 rounded flex flex-col items-center",
                            stats.correct > 0 ? "bg-success/20" : "bg-muted",
                          )}
                        >
                          <div className="text-xl font-bold">{stats.correct}</div>
                          <div className="text-xs">Correct</div>
                        </div>
                        <div
                          className={cn(
                            "p-2 rounded flex flex-col items-center",
                            stats.almost > 0 ? "bg-amber-500/20" : "bg-muted",
                          )}
                        >
                          <div className="text-xl font-bold">{stats.almost}</div>
                          <div className="text-xs">Almost</div>
                        </div>
                        <div
                          className={cn(
                            "p-2 rounded flex flex-col items-center",
                            stats.incorrect > 0 ? "bg-destructive/20" : "bg-muted",
                          )}
                        >
                          <div className="text-xl font-bold">{stats.incorrect}</div>
                          <div className="text-xs">Incorrect</div>
                        </div>
                        <div
                          className={cn(
                            "p-2 rounded flex flex-col items-center",
                            stats.missing > 0 ? "bg-blue-500/20" : "bg-muted",
                          )}
                        >
                          <div className="text-xl font-bold">{stats.missing}</div>
                          <div className="text-xs">Missing</div>
                        </div>
                        <div
                          className={cn(
                            "p-2 rounded flex flex-col items-center",
                            stats.extra > 0 ? "bg-purple-500/20" : "bg-muted",
                          )}
                        >
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

                  <div className="flex justify-between pt-4">
                    <div>
                      {hasReadingAnalysis && onViewReadingAnalysis && (
                        <Button onClick={onViewReadingAnalysis} variant="outline" className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          View Reading Analysis
                        </Button>
                      )}
                    </div>
                    <Button onClick={handleTryAgain} className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
                        if (!result.userToken && result.status === "missing") {
                          return (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-blue-100 border border-blue-200 rounded text-sm"
                            >
                              <span className="opacity-50">Missing:</span> {result.originalToken}
                            </span>
                          )
                        } else if (result.status === "extra") {
                          return (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-purple-100 border border-purple-200 rounded text-sm"
                            >
                              <span className="opacity-50">Extra:</span> {result.userToken}
                            </span>
                          )
                        }

                        return null
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
                    <Button onClick={handleTryAgain} className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
  )
}

export default DictationPractice