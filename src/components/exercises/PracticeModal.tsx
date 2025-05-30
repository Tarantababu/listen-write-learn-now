import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Exercise } from "@/types"
import DictationPractice from "@/components/DictationPractice"
import ReadingAnalysis from "@/components/ReadingAnalysis"
import { useUserSettingsContext } from "@/contexts/UserSettingsContext"
import { useExerciseContext } from "@/contexts/ExerciseContext"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { toast } from "@/hooks/use-toast"
import {
  AlertTriangle,
  Search,
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Check,
  Volume2,
  SkipBack,
  SkipForward,
  RefreshCw,
  X,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/use-mobile"

interface PracticeModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  exercise: Exercise | null
  onComplete: (accuracy: number) => void
}

enum PracticeStage {
  PROMPT = 0,
  READING = 1,
  DICTATION = 2,
}

// Mobile Virtual Keyboard Component
const MobileVirtualKeyboard: React.FC<{
  onSubmit: () => void
  onPlay: () => void
  onPause: () => void
  onRewind: () => void
  onSkipBack: () => void
  onSkipForward: () => void
  onClear: () => void
  onTryAgain: () => void
  isPlaying: boolean
  showResults: boolean
}> = ({
  onSubmit,
  onPlay,
  onPause,
  onRewind,
  onSkipBack,
  onSkipForward,
  onClear,
  onTryAgain,
  isPlaying,
  showResults,
}) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-3 border-t">
      {/* Audio Controls Row */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onSkipBack}
          className="h-12 flex flex-col items-center justify-center p-1"
        >
          <SkipBack className="h-4 w-4" />
          <span className="text-xs mt-1">-10s</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRewind}
          className="h-12 flex flex-col items-center justify-center p-1"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="text-xs mt-1">Restart</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={isPlaying ? onPause : onPlay}
          className="h-12 flex flex-col items-center justify-center p-1 bg-primary/10"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          <span className="text-xs mt-1">{isPlaying ? "Pause" : "Play"}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onSkipForward}
          className="h-12 flex flex-col items-center justify-center p-1"
        >
          <SkipForward className="h-4 w-4" />
          <span className="text-xs mt-1">+10s</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="h-12 flex flex-col items-center justify-center p-1"
        >
          <X className="h-4 w-4" />
          <span className="text-xs mt-1">Clear</span>
        </Button>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 gap-3">
        {showResults ? (
          <Button onClick={onTryAgain} className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        ) : (
          <Button onClick={onSubmit} className="h-12 bg-green-600 hover:bg-green-700 text-white font-medium">
            <Check className="h-4 w-4 mr-2" />
            Check Answer
          </Button>
        )}

        <Button variant="outline" onClick={onRewind} className="h-12">
          <Volume2 className="h-4 w-4 mr-2" />
          Replay Audio
        </Button>
      </div>
    </div>
  )
}

// Mobile Dictation Practice Component
const MobileDictationPractice: React.FC<{
  exercise: Exercise
  onComplete: (accuracy: number) => void
  showResults: boolean
  onTryAgain: () => void
}> = ({ exercise, onComplete, showResults, onTryAgain }) => {
  const [userInput, setUserInput] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [accuracy, setAccuracy] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Mock audio controls - replace with actual audio implementation
  const handlePlay = () => {
    setIsPlaying(true)
    if (audioRef.current) {
      audioRef.current.play()
    }
  }

  const handlePause = () => {
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
    }
  }

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = audioRef.current.currentTime + 10
    }
  }

  const handleClear = () => {
    setUserInput("")
  }

  const handleSubmit = () => {
    // Calculate accuracy - replace with actual logic
    const correctText = exercise.text || ""
    const similarity = calculateSimilarity(userInput.trim(), correctText)
    setAccuracy(similarity)
    onComplete(similarity)
  }

  const handleTryAgainLocal = () => {
    setUserInput("")
    setAccuracy(0)
    onTryAgain()
  }

  // Simple similarity calculation - replace with actual implementation
  const calculateSimilarity = (input: string, correct: string): number => {
    if (!input || !correct) return 0
    const inputWords = input.toLowerCase().split(/\s+/)
    const correctWords = correct.toLowerCase().split(/\s+/)
    const matches = inputWords.filter((word) => correctWords.includes(word))
    return Math.round((matches.length / correctWords.length) * 100)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-background/95 backdrop-blur">
        <h2 className="text-lg font-semibold mb-1">{exercise.title}</h2>
        <p className="text-sm text-muted-foreground">Listen and type what you hear</p>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={exercise.audioUrl}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {showResults ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Results: {accuracy}% Accuracy</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Answer:</p>
                  <p className="text-sm bg-white dark:bg-gray-800 p-2 rounded border">{userInput}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Correct Answer:</p>
                  <p className="text-sm bg-white dark:bg-gray-800 p-2 rounded border">{exercise.text}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress Indicator */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 dark:text-blue-300">Dictation Practice</span>
                <span className="text-blue-600 dark:text-blue-400">{userInput.length} characters</span>
              </div>
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type what you hear:</label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Start typing here..."
                className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Audio Status */}
            <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Volume2 className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isPlaying ? "Audio is playing..." : "Audio ready to play"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Virtual Keyboard */}
      <MobileVirtualKeyboard
        onSubmit={handleSubmit}
        onPlay={handlePlay}
        onPause={handlePause}
        onRewind={handleRewind}
        onSkipBack={handleSkipBack}
        onSkipForward={handleSkipForward}
        onClear={handleClear}
        onTryAgain={handleTryAgainLocal}
        isPlaying={isPlaying}
        showResults={showResults}
      />
    </div>
  )
}

const PracticeModal: React.FC<PracticeModalProps> = ({ isOpen, onOpenChange, exercise, onComplete }) => {
  const [showResults, setShowResults] = useState(false)
  const [updatedExercise, setUpdatedExercise] = useState<Exercise | null>(exercise)
  const [practiceStage, setPracticeStage] = useState<PracticeStage>(PracticeStage.PROMPT)
  const [hasExistingAnalysis, setHasExistingAnalysis] = useState<boolean>(false)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [analysisAllowed, setAnalysisAllowed] = useState<boolean>(true)
  const [loadingAnalysisCheck, setLoadingAnalysisCheck] = useState<boolean>(false)
  const hasInitializedRef = useRef<boolean>(false)
  const isMobile = useIsMobile()

  const { settings } = useUserSettingsContext()
  const { exercises, hasReadingAnalysis } = useExerciseContext()
  const { user } = useAuth()
  const { subscription } = useSubscription()

  // Update exercise state when prop or context changes
  useEffect(() => {
    if (exercise) {
      const latestExerciseData = exercises.find((ex) => ex.id === exercise.id)
      setUpdatedExercise(latestExerciseData || exercise)
    } else {
      setUpdatedExercise(null)
    }
  }, [exercise, exercises])

  // Check for existing analysis when modal opens
  useEffect(() => {
    const checkExistingAnalysis = async () => {
      if (!exercise || !user || !isOpen) return

      try {
        setLoadingAnalysisCheck(true)

        const hasAnalysis = await hasReadingAnalysis(exercise.id)

        if (hasAnalysis) {
          setHasExistingAnalysis(true)

          const { data: analysisData } = await supabase
            .from("reading_analyses")
            .select("id")
            .eq("exercise_id", exercise.id)
            .eq("user_id", user.id)
            .maybeSingle()

          if (analysisData) {
            setAnalysisId(analysisData.id)
          }

          setPracticeStage(isMobile ? PracticeStage.DICTATION : PracticeStage.DICTATION)
        } else {
          setHasExistingAnalysis(false)
          setAnalysisId(null)

          if (!subscription.isSubscribed) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("reading_analyses_count")
              .eq("id", user.id)
              .maybeSingle()

            if (profileData && profileData.reading_analyses_count >= 5) {
              setAnalysisAllowed(false)
              toast({
                title: "Free user limit reached",
                description: "Free users are limited to 5 reading analyses. Upgrade to premium for unlimited analyses.",
                variant: "destructive",
              })
            }
          }

          setPracticeStage(isMobile ? PracticeStage.DICTATION : PracticeStage.PROMPT)
        }
      } catch (error) {
        console.error("Error checking analysis:", error)
      } finally {
        setLoadingAnalysisCheck(false)
      }
    }

    if (isOpen && !hasInitializedRef.current) {
      checkExistingAnalysis()
      hasInitializedRef.current = true
    }

    if (!isOpen) {
      hasInitializedRef.current = false
    }
  }, [exercise, user, isOpen, subscription.isSubscribed, hasReadingAnalysis, isMobile])

  const handleComplete = (accuracy: number) => {
    onComplete(accuracy)
    setShowResults(true)

    if (updatedExercise && accuracy >= 95) {
      const newCompletionCount = Math.min(3, updatedExercise.completionCount + 1)
      const isCompleted = newCompletionCount >= 3
      setUpdatedExercise({
        ...updatedExercise,
        completionCount: newCompletionCount,
        isCompleted,
      })
    }
  }

  useEffect(() => {
    if (isOpen) {
      const latestExerciseData = exercises.find((ex) => ex?.id === exercise?.id)
      setUpdatedExercise(latestExerciseData || exercise)
    } else {
      setShowResults(false)
    }
  }, [isOpen, exercise, exercises])

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
  }

  const handleStartDictation = () => {
    setPracticeStage(PracticeStage.DICTATION)
  }

  const handleStartReadingAnalysis = () => {
    setPracticeStage(PracticeStage.READING)
  }

  const handleViewReadingAnalysis = () => {
    if (practiceStage === PracticeStage.DICTATION) {
      setPracticeStage(PracticeStage.READING)
    }
  }

  const handleTryAgain = () => {
    setShowResults(false)
  }

  if (!updatedExercise || updatedExercise.language !== settings.selectedLanguage) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={
          isMobile
            ? "fixed inset-0 w-screen h-screen max-w-none max-h-none m-0 p-0 border-0 rounded-none bg-background flex flex-col z-50 overflow-hidden"
            : "max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        }
      >
        <DialogTitle className="sr-only">{updatedExercise.title} Practice</DialogTitle>

        {/* Desktop: Full experience with prompt and reading analysis */}
        {!isMobile && practiceStage === PracticeStage.PROMPT && (
          <div className="px-6 py-8 space-y-4 md:space-y-6 flex-1 overflow-y-auto">
            <DialogHeader className="mb-2 md:mb-4">
              <h2 className="text-2xl font-bold mb-1 md:mb-2">{updatedExercise.title}</h2>
              <DialogDescription className="text-sm md:text-base">
                <p className="text-lg font-medium mb-1 md:mb-2">Boost Your Understanding Before You Start</p>
                <p className="text-base">
                  Dive into a Reading Analysis to see how words and grammar work — or skip straight to dictation.
                </p>
                {loadingAnalysisCheck && (
                  <div className="mt-2 text-sm font-medium">Checking for existing analysis...</div>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="md:grid-cols-2 gap-6 mt-6 grid grid-cols-1">
              <Card className="border-muted overflow-hidden hover:bg-muted/5 transition-colors dark:hover:bg-muted/10">
                <CardContent className="p-0">
                  <Button
                    onClick={handleStartReadingAnalysis}
                    variant="ghost"
                    disabled={!analysisAllowed || loadingAnalysisCheck}
                    className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent"
                  >
                    <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                      <div className="flex items-center justify-center bg-primary/10 w-12 h-12 rounded-full">
                        <Search className="h-6 w-6 text-primary" />
                      </div>
                      <div className="font-semibold text-lg">🔍 Start with Reading Analysis</div>
                      <p className="text-xs md:text-sm text-muted-foreground px-2">
                        Explore vocabulary and grammar with AI explanations
                      </p>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border border-muted hover:bg-muted/5 transition-all dark:hover:bg-muted/10">
                <CardContent className="p-0">
                  <Button
                    onClick={handleStartDictation}
                    variant="ghost"
                    className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent"
                  >
                    <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                      <div className="flex items-center justify-center bg-muted/40 w-12 h-12 rounded-full">
                        <Headphones className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="font-semibold text-lg">🎧 Start Dictation Now</div>
                      <p className="text-xs md:text-sm text-muted-foreground px-2">
                        Practice listening and transcription skills with audio
                      </p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {!analysisAllowed && !subscription.isSubscribed && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 md:p-4 rounded-md flex items-start mt-6 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 md:mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-base">Free user limit reached</p>
                  <p className="text-sm mt-1">
                    You've reached the limit of 5 reading analyses for free users. Upgrade to premium for unlimited
                    analyses.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!isMobile && practiceStage === PracticeStage.READING && (
          <div className="flex-1 overflow-hidden">
            <ReadingAnalysis
              exercise={updatedExercise}
              onComplete={handleStartDictation}
              existingAnalysisId={analysisId || undefined}
            />
          </div>
        )}

        {/* Desktop: Original dictation practice */}
        {!isMobile && practiceStage === PracticeStage.DICTATION && (
          <div className="flex-1 overflow-hidden">
            <DictationPractice
              exercise={updatedExercise}
              onComplete={handleComplete}
              showResults={showResults}
              onTryAgain={handleTryAgain}
              hasReadingAnalysis={hasExistingAnalysis}
              onViewReadingAnalysis={hasExistingAnalysis ? handleViewReadingAnalysis : undefined}
            />
          </div>
        )}

        {/* Mobile: Custom dictation practice with virtual keyboard */}
        {isMobile && (
          <MobileDictationPractice
            exercise={updatedExercise}
            onComplete={handleComplete}
            showResults={showResults}
            onTryAgain={handleTryAgain}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PracticeModal