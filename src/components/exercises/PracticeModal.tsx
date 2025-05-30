import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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
  ArrowLeft,
  VolumeX,
  BookOpen,
  Mic,
  Star,
  Trophy,
  FileText,
  GitCompare,
  BookMarked,
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

enum MobileTab {
  SELECTION = 0,
  READING = 1,
  DICTATION = 2,
  RESULTS = 3,
}

enum ResultsTab {
  SUMMARY = 0,
  COMPARISON = 1,
  VOCABULARY = 2,
}

// Confetti Component
const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const confetti: Array<{
      x: number
      y: number
      vx: number
      vy: number
      color: string
      size: number
      rotation: number
      rotationSpeed: number
    }> = []

    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dda0dd", "#98d8c8"]

    // Create confetti pieces
    for (let i = 0; i < 100; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      })
    }

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      confetti.forEach((piece, index) => {
        piece.x += piece.vx
        piece.y += piece.vy
        piece.rotation += piece.rotationSpeed

        ctx.save()
        ctx.translate(piece.x, piece.y)
        ctx.rotate((piece.rotation * Math.PI) / 180)
        ctx.fillStyle = piece.color
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size)
        ctx.restore()

        // Remove confetti that's off screen
        if (piece.y > canvas.height + 10) {
          confetti.splice(index, 1)
        }
      })

      if (confetti.length > 0) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animate()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
    />
  )
}

// Mobile-specific fullscreen modal wrapper
const MobileModalWrapper: React.FC<{
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = "hidden"
      document.body.style.position = "fixed"
      document.body.style.width = "100%"
      document.body.style.height = "100%"
      document.body.style.top = "0"
      document.body.style.left = "0"

      return () => {
        document.body.style.overflow = ""
        document.body.style.position = ""
        document.body.style.width = ""
        document.body.style.height = ""
        document.body.style.top = ""
        document.body.style.left = ""
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        maxWidth: "100vw",
        maxHeight: "100vh",
      }}
    >
      {children}
    </div>
  )
}

// Progress Component
const ProgressIndicator: React.FC<{
  completionCount: number
  isCompleted: boolean
}> = ({ completionCount, isCompleted }) => {
  const stars = Array.from({ length: 3 }, (_, i) => i < completionCount)

  return (
    <div className="flex items-center space-x-1">
      {stars.map((filled, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${filled ? "text-yellow-500 fill-yellow-500" : "text-gray-300 dark:text-gray-600"}`}
        />
      ))}
      <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">{completionCount}/3</span>
      {isCompleted && <Trophy className="h-4 w-4 text-yellow-500 ml-1" />}
    </div>
  )
}

// Mobile Header Component
const MobileHeader: React.FC<{
  title: string
  onClose: () => void
  subtitle?: string
  showTabs?: boolean
  activeTab?: MobileTab
  onTabChange?: (tab: MobileTab) => void
  hasReadingAnalysis?: boolean
  completionCount?: number
  isCompleted?: boolean
  showResults?: boolean
}> = ({
  title,
  onClose,
  subtitle,
  showTabs,
  activeTab,
  onTabChange,
  hasReadingAnalysis,
  completionCount = 0,
  isCompleted = false,
  showResults = false,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 min-h-[60px] w-full">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 p-0 flex-shrink-0" type="button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate text-gray-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex-shrink-0">
          <ProgressIndicator completionCount={completionCount} isCompleted={isCompleted} />
        </div>
      </div>

      {/* Tabs */}
      {showTabs && (
        <div className="flex border-t border-gray-200 dark:border-gray-700">
          {hasReadingAnalysis && (
            <button
              onClick={() => onTabChange?.(MobileTab.READING)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === MobileTab.READING
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Reading</span>
              </div>
            </button>
          )}
          <button
            onClick={() => onTabChange?.(MobileTab.DICTATION)}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === MobileTab.DICTATION
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Mic className="h-4 w-4" />
              <span>Dictation</span>
            </div>
          </button>
          {showResults && (
            <button
              onClick={() => onTabChange?.(MobileTab.RESULTS)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === MobileTab.RESULTS
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Check className="h-4 w-4" />
                <span>Results</span>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Mobile Selection Screen
const MobileSelectionScreen: React.FC<{
  exercise: Exercise
  onSelectReading: () => void
  onSelectDictation: () => void
  onClose: () => void
  analysisAllowed: boolean
  loadingAnalysisCheck: boolean
  subscription: any
}> = ({
  exercise,
  onSelectReading,
  onSelectDictation,
  onClose,
  analysisAllowed,
  loadingAnalysisCheck,
  subscription,
}) => {
  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-900">
      <MobileHeader
        title={exercise.title}
        subtitle="Choose your practice mode"
        onClose={onClose}
        completionCount={exercise.completionCount}
        isCompleted={exercise.isCompleted}
      />

      <div className="flex-1 p-4 space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            Boost Your Understanding Before You Start
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Dive into a Reading Analysis to see how words and grammar work — or skip straight to dictation.
          </p>
          {loadingAnalysisCheck && (
            <div className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              Checking for existing analysis...
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Reading Analysis Card */}
          <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
            <button
              onClick={onSelectReading}
              disabled={!analysisAllowed || loadingAnalysisCheck}
              className="w-full p-4 text-left bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex-shrink-0">
                  <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                    🔍 Start with Reading Analysis
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Explore vocabulary and grammar with AI explanations
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Dictation Card */}
          <div className="border-2 border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
            <button
              onClick={onSelectDictation}
              className="w-full p-4 text-left bg-white dark:bg-gray-900 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center bg-green-100 dark:bg-green-900 w-12 h-12 rounded-full flex-shrink-0">
                  <Headphones className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg text-gray-900 dark:text-white mb-1">🎧 Start Dictation Now</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Practice listening and transcription skills with audio
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Warning Message */}
        {!analysisAllowed && !subscription.isSubscribed && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md flex items-start dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Free user limit reached</p>
              <p className="text-xs mt-1">
                You've reached the limit of 5 reading analyses for free users. Upgrade to premium for unlimited
                analyses.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Mobile Reading Analysis Wrapper
const MobileReadingAnalysisWrapper: React.FC<{
  exercise: Exercise
  onComplete: () => void
  existingAnalysisId?: string
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  onClose: () => void
  hasReadingAnalysis: boolean
  showResults?: boolean
}> = ({
  exercise,
  onComplete,
  existingAnalysisId,
  activeTab,
  onTabChange,
  onClose,
  hasReadingAnalysis,
  showResults = false,
}) => {
  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-900">
      <MobileHeader
        title={exercise.title}
        subtitle="Reading Analysis"
        onClose={onClose}
        showTabs={true}
        activeTab={activeTab}
        onTabChange={onTabChange}
        hasReadingAnalysis={hasReadingAnalysis}
        completionCount={exercise.completionCount}
        isCompleted={exercise.isCompleted}
        showResults={showResults}
      />

      <div className="flex-1 overflow-hidden">
        <ReadingAnalysis exercise={exercise} onComplete={onComplete} existingAnalysisId={existingAnalysisId} />
      </div>
    </div>
  )
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
  audioLoaded: boolean
  audioError: boolean
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
  audioLoaded,
  audioError,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 w-full">
      {/* Audio Controls Row */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onSkipBack}
          className="h-12 flex flex-col items-center justify-center p-1 text-xs border-gray-300 dark:border-gray-600"
          type="button"
          disabled={!audioLoaded || audioError}
        >
          <SkipBack className="h-4 w-4" />
          <span className="text-xs mt-1">-10s</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRewind}
          className="h-12 flex flex-col items-center justify-center p-1 text-xs border-gray-300 dark:border-gray-600"
          type="button"
          disabled={!audioLoaded || audioError}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="text-xs mt-1">Restart</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={isPlaying ? onPause : onPlay}
          className="h-12 flex flex-col items-center justify-center p-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
          type="button"
          disabled={!audioLoaded || audioError}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          <span className="text-xs mt-1">{isPlaying ? "Pause" : "Play"}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onSkipForward}
          className="h-12 flex flex-col items-center justify-center p-1 text-xs border-gray-300 dark:border-gray-600"
          type="button"
          disabled={!audioLoaded || audioError}
        >
          <SkipForward className="h-4 w-4" />
          <span className="text-xs mt-1">+10s</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="h-12 flex flex-col items-center justify-center p-1 text-xs border-gray-300 dark:border-gray-600"
          type="button"
        >
          <X className="h-4 w-4" />
          <span className="text-xs mt-1">Clear</span>
        </Button>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 gap-3">
        {showResults ? (
          <Button
            onClick={onTryAgain}
            className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            type="button"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            className="h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
            type="button"
          >
            <Check className="h-4 w-4 mr-2" />
            Check Answer
          </Button>
        )}

        <Button
          variant="outline"
          onClick={onRewind}
          className="h-12 border-gray-300 dark:border-gray-600"
          type="button"
          disabled={!audioLoaded || audioError}
        >
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
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  onClose: () => void
  hasReadingAnalysis: boolean
  userInput: string
  setUserInput: (input: string) => void
  accuracy: number
}> = ({
  exercise,
  onComplete,
  showResults,
  onTryAgain,
  activeTab,
  onTabChange,
  onClose,
  hasReadingAnalysis,
  userInput,
  setUserInput,
  accuracy,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioLoaded, setAudioLoaded] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Audio controls
  const handlePlay = () => {
    if (audioRef.current) {
      const playPromise = audioRef.current.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch((error) => {
            console.error("Audio play error:", error)
            setAudioError(true)
          })
      }
    }
  }

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
    }
  }

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10)
    }
  }

  const handleClear = () => {
    setUserInput("")
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleSubmit = () => {
    const correctText = exercise.text || ""
    const similarity = calculateSimilarity(userInput.trim(), correctText)
    onComplete(similarity)
    onTabChange(MobileTab.RESULTS)
  }

  const handleTryAgainLocal = () => {
    setUserInput("")
    onTryAgain()

    // Focus on textarea after reset
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 100)
  }

  const handleAudioError = () => {
    setAudioError(true)
    setAudioLoaded(false)
    toast({
      title: "Audio Error",
      description: "There was a problem loading the audio. Please try again.",
      variant: "destructive",
    })
  }

  // Simple similarity calculation
  const calculateSimilarity = (input: string, correct: string): number => {
    if (!input || !correct) return 0

    // Normalize both texts
    const normalizedInput = input.toLowerCase().trim()
    const normalizedCorrect = correct.toLowerCase().trim()

    // Split into words
    const inputWords = normalizedInput.split(/\s+/).filter((word) => word.length > 0)
    const correctWords = normalizedCorrect.split(/\s+/).filter((word) => word.length > 0)

    if (inputWords.length === 0 || correctWords.length === 0) return 0

    // Count matching words
    let matches = 0
    for (const inputWord of inputWords) {
      if (correctWords.includes(inputWord)) {
        matches++
      }
    }

    // Calculate accuracy percentage
    return Math.round((matches / correctWords.length) * 100)
  }

  // Focus textarea on mount
  useEffect(() => {
    if (!showResults && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 300)
    }
  }, [showResults])

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-900">
      <MobileHeader
        title={exercise.title}
        subtitle="Listen and type what you hear"
        onClose={onClose}
        showTabs={true}
        activeTab={activeTab}
        onTabChange={onTabChange}
        hasReadingAnalysis={hasReadingAnalysis}
        completionCount={exercise.completionCount}
        isCompleted={exercise.isCompleted}
        showResults={showResults}
      />

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={exercise.audioUrl}
        preload="auto"
        onCanPlay={() => setAudioLoaded(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={handleAudioError}
      />

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Audio Status */}
          <div
            className={`p-3 rounded-lg flex items-center justify-center ${audioError ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300" : audioLoaded ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
          >
            {audioError ? (
              <>
                <VolumeX className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Audio failed to load</span>
              </>
            ) : !audioLoaded ? (
              <>
                <div className="h-5 w-5 mr-2 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
                <span className="text-sm">Loading audio...</span>
              </>
            ) : (
              <>
                <Volume2 className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">{isPlaying ? "Audio is playing..." : "Audio ready to play"}</span>
              </>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300 font-medium">Dictation Practice</span>
              <span className="text-blue-600 dark:text-blue-400">{userInput.length} characters</span>
            </div>
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type what you hear:</label>
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Start typing here..."
              className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-base"
              autoFocus
            />
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Press <span className="font-medium">Play</span> to listen to the audio, then type what you hear. When
              you're ready, click <span className="font-medium">Check Answer</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Virtual Keyboard - Fixed at bottom */}
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
        audioLoaded={audioLoaded}
        audioError={audioError}
      />
    </div>
  )
}

// Mobile Results Screen with Tabs
const MobileResultsScreen: React.FC<{
  exercise: Exercise
  userInput: string
  accuracy: number
  onTryAgain: () => void
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  onClose: () => void
  hasReadingAnalysis: boolean
  showConfetti: boolean
}> = ({
  exercise,
  userInput,
  accuracy,
  onTryAgain,
  activeTab,
  onTabChange,
  onClose,
  hasReadingAnalysis,
  showConfetti,
}) => {
  const [resultsTab, setResultsTab] = useState<ResultsTab>(ResultsTab.SUMMARY)
  const [vocabularyItems, setVocabularyItems] = useState<
    Array<{ word: string; translation: string; partOfSpeech: string }>
  >([])
  const [isLoadingVocabulary, setIsLoadingVocabulary] = useState(false)
  const [vocabularyError, setVocabularyError] = useState<string | null>(null)
  const [savedWords, setSavedWords] = useState<string[]>([])

  // Compare user input with correct text
  const getComparison = () => {
    const userWords = userInput
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0)
    const correctWords = exercise.text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0)

    const comparison = correctWords.map((correctWord, index) => {
      const userWord = userWords[index] || ""
      return {
        correct: correctWord,
        user: userWord,
        isMatch: correctWord === userWord,
        index,
      }
    })

    return comparison
  }

  const comparison = getComparison()

  // Extract vocabulary directly from text
  const extractVocabularyFromText = (text: string) => {
    // Remove punctuation and split into words
    const words = text
      .toLowerCase()
      .replace(/[.,!?;:()[\]{}""'']/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2)

    // Get unique words
    const uniqueWords = [...new Set(words)]

    // Create vocabulary items
    return uniqueWords.slice(0, 15).map((word) => ({
      word,
      translation: "", // Will be filled if available from database
      partOfSpeech: "", // Will be filled if available from database
    }))
  }

  // Load vocabulary when the vocabulary tab is selected
  useEffect(() => {
    const fetchVocabulary = async () => {
      if (resultsTab !== ResultsTab.VOCABULARY) return

      try {
        setIsLoadingVocabulary(true)
        setVocabularyError(null)

        // Get vocabulary from the exercise text
        const text = exercise.text
        if (!text) {
          setVocabularyError("No text available for vocabulary analysis")
          return
        }

        // First, extract basic vocabulary from text
        const basicVocabulary = extractVocabularyFromText(text)

        // Try to fetch enhanced vocabulary data from database
        try {
          const words = basicVocabulary.map((item) => item.word)

          // Use correct column names - let's try common variations
          const { data: vocabularyData, error } = await supabase
            .from("vocabulary")
            .select("word, meaning, pos")
            .in("word", words)
            .eq("language", exercise.language)

          if (error) {
            console.error("Database error:", error)
            // Try alternative column names
            const { data: altVocabularyData, error: altError } = await supabase
              .from("vocabulary")
              .select("word, definition, part_of_speech")
              .in("word", words)
              .eq("language", exercise.language)

            if (altError) {
              console.error("Alternative database error:", altError)
              // Continue with basic vocabulary
            } else if (altVocabularyData && altVocabularyData.length > 0) {
              // Create a map for quick lookup
              const vocabMap = new Map()
              altVocabularyData.forEach((item: any) => {
                vocabMap.set(item.word, {
                  translation: item.definition || "",
                  partOfSpeech: item.part_of_speech || "",
                })
              })

              // Enhance basic vocabulary with database data where available
              const enhancedVocabulary = basicVocabulary.map((item) => {
                const dbData = vocabMap.get(item.word)
                return {
                  word: item.word,
                  translation: dbData?.translation || "Translation not available",
                  partOfSpeech: dbData?.partOfSpeech || "unknown",
                }
              })

              setVocabularyItems(enhancedVocabulary)
              return
            }
          } else if (vocabularyData && vocabularyData.length > 0) {
            // Create a map for quick lookup
            const vocabMap = new Map()
            vocabularyData.forEach((item: any) => {
              vocabMap.set(item.word, {
                translation: item.meaning || "",
                partOfSpeech: item.pos || "",
              })
            })

            // Enhance basic vocabulary with database data where available
            const enhancedVocabulary = basicVocabulary.map((item) => {
              const dbData = vocabMap.get(item.word)
              return {
                word: item.word,
                translation: dbData?.translation || "Translation not available",
                partOfSpeech: dbData?.partOfSpeech || "unknown",
              }
            })

            setVocabularyItems(enhancedVocabulary)
            return
          }
        } catch (dbError) {
          console.error("Error fetching from database:", dbError)
          // Continue with basic vocabulary
        }

        // If we reach here, use the basic vocabulary
        setVocabularyItems(
          basicVocabulary.map((item) => ({
            ...item,
            translation: "Translation not available",
            partOfSpeech: "unknown",
          })),
        )
      } catch (error) {
        console.error("Error in vocabulary processing:", error)
        setVocabularyError("An error occurred while processing vocabulary")
      } finally {
        setIsLoadingVocabulary(false)
      }
    }

    fetchVocabulary()
  }, [resultsTab, exercise])

  // Handle saving words to vocabulary list
  const toggleSaveWord = (word: string) => {
    setSavedWords((prev) => {
      if (prev.includes(word)) {
        return prev.filter((w) => w !== word)
      } else {
        return [...prev, word]
      }
    })
  }

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-900">
      {showConfetti && <Confetti />}

      <MobileHeader
        title={exercise.title}
        subtitle="Dictation Results"
        onClose={onClose}
        showTabs={true}
        activeTab={activeTab}
        onTabChange={onTabChange}
        hasReadingAnalysis={hasReadingAnalysis}
        completionCount={exercise.completionCount}
        isCompleted={exercise.isCompleted}
        showResults={true}
      />

      {/* Results Sub-tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => setResultsTab(ResultsTab.SUMMARY)}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            resultsTab === ResultsTab.SUMMARY
              ? "border-green-500 text-green-600 dark:text-green-400 bg-white dark:bg-gray-900"
              : "border-transparent text-gray-500 dark:text-gray-400"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Summary</span>
          </div>
        </button>
        <button
          onClick={() => setResultsTab(ResultsTab.COMPARISON)}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            resultsTab === ResultsTab.COMPARISON
              ? "border-green-500 text-green-600 dark:text-green-400 bg-white dark:bg-gray-900"
              : "border-transparent text-gray-500 dark:text-gray-400"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <GitCompare className="h-4 w-4" />
            <span>Comparison</span>
          </div>
        </button>
        <button
          onClick={() => setResultsTab(ResultsTab.VOCABULARY)}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            resultsTab === ResultsTab.VOCABULARY
              ? "border-green-500 text-green-600 dark:text-green-400 bg-white dark:bg-gray-900"
              : "border-transparent text-gray-500 dark:text-gray-400"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <BookMarked className="h-4 w-4" />
            <span>Vocabulary</span>
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {resultsTab === ResultsTab.SUMMARY && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg border ${accuracy >= 80 ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3
                  className={`font-semibold text-lg ${accuracy >= 80 ? "text-green-800 dark:text-green-200" : "text-amber-800 dark:text-amber-200"}`}
                >
                  Performance Summary
                </h3>
                <span
                  className={`text-sm font-bold px-2 py-1 rounded ${accuracy >= 80 ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200" : "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200"}`}
                >
                  {accuracy}% Accuracy
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Words Correct:</span>
                  <span className="font-medium">
                    {comparison.filter((c) => c.isMatch).length}/{comparison.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Character Count:</span>
                  <span className="font-medium">{userInput.length} characters</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Progress:</span>
                  <ProgressIndicator completionCount={exercise.completionCount} isCompleted={exercise.isCompleted} />
                </div>
              </div>

              {accuracy >= 80 ? (
                <div className="mt-4 bg-green-100 dark:bg-green-900/30 p-3 rounded text-sm text-green-800 dark:text-green-200">
                  {exercise.isCompleted ? (
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 mr-2" />
                      Congratulations! You've mastered this exercise!
                    </div>
                  ) : (
                    "Great job! You've successfully completed this dictation exercise."
                  )}
                </div>
              ) : (
                <div className="mt-4 bg-amber-100 dark:bg-amber-900/30 p-3 rounded text-sm text-amber-800 dark:text-amber-200">
                  Keep practicing! Try listening again and focus on the words you missed.
                </div>
              )}
            </div>
          </div>
        )}

        {resultsTab === ResultsTab.COMPARISON && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Word-by-Word Comparison</h3>
              <div className="space-y-2">
                {comparison.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 rounded">
                    <span className="text-xs text-gray-500 w-8">{index + 1}.</span>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div
                        className={`p-2 rounded text-sm ${item.isMatch ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"}`}
                      >
                        <div className="text-xs text-gray-600 dark:text-gray-400">Your answer:</div>
                        <div className="font-medium">
                          {item.user || <span className="italic text-gray-400">missing</span>}
                        </div>
                      </div>
                      <div className="p-2 rounded text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Correct:</div>
                        <div className="font-medium">{item.correct}</div>
                      </div>
                    </div>
                    {item.isMatch ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {resultsTab === ResultsTab.VOCABULARY && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Key Vocabulary</h3>

              {isLoadingVocabulary ? (
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-blue-500 animate-spin mb-3"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading vocabulary...</p>
                </div>
              ) : vocabularyError ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
                  <p>{vocabularyError}</p>
                </div>
              ) : vocabularyItems.length === 0 ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
                  <p>No vocabulary items available for this exercise.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vocabularyItems.map((item, index) => {
                    const isCorrect = comparison.some(
                      (c) => c.correct.toLowerCase() === item.word.toLowerCase() && c.isMatch,
                    )
                    const isSaved = savedWords.includes(item.word)

                    return (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-blue-800 dark:text-blue-200">{item.word}</div>
                          <div className="flex items-center space-x-2">
                            {item.partOfSpeech !== "unknown" && (
                              <div className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                {item.partOfSpeech}
                              </div>
                            )}
                            <button
                              onClick={() => toggleSaveWord(item.word)}
                              className={`p-1 rounded-full ${isSaved ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}
                            >
                              <Star className={`h-4 w-4 ${isSaved ? "fill-yellow-500" : ""}`} />
                            </button>
                          </div>
                        </div>
                        {item.translation !== "Translation not available" && (
                          <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">{item.translation}</div>
                        )}
                        <div className="text-xs text-blue-500 dark:text-blue-400 mt-2 flex items-center">
                          {isCorrect ? (
                            <>
                              <Check className="h-3 w-3 mr-1" /> Correctly identified
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3 mr-1" /> Review this word
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tap the star icon to save words to your vocabulary list for future practice.
              </p>
            </div>
          </div>
        )}

        <div className="flex space-x-3 mt-6">
          <Button
            onClick={onTryAgain}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            type="button"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => onTabChange(MobileTab.DICTATION)}
            variant="outline"
            className="flex-1 h-12 border-gray-300 dark:border-gray-600"
            type="button"
          >
            <Mic className="h-4 w-4 mr-2" />
            Back to Practice
          </Button>
        </div>
      </div>
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

  // Mobile-specific state
  const [mobileTab, setMobileTab] = useState<MobileTab>(MobileTab.SELECTION)
  const [userInput, setUserInput] = useState("")
  const [accuracy, setAccuracy] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

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

          if (isMobile) {
            setMobileTab(MobileTab.DICTATION)
          } else {
            setPracticeStage(PracticeStage.DICTATION)
          }
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

          if (isMobile) {
            setMobileTab(MobileTab.SELECTION)
          } else {
            setPracticeStage(PracticeStage.PROMPT)
          }
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

  const handleComplete = (accuracyScore: number) => {
    setAccuracy(accuracyScore)
    onComplete(accuracyScore)
    setShowResults(true)

    if (updatedExercise && accuracyScore >= 95) {
      const newCompletionCount = Math.min(3, updatedExercise.completionCount + 1)
      const isCompleted = newCompletionCount >= 3

      // Show confetti if exercise is completed (3/3)
      if (isCompleted && !updatedExercise.isCompleted) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 5000) // Hide confetti after 5 seconds
      }

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
      setUserInput("")
      setAccuracy(0)
      setShowConfetti(false)
      if (isMobile) {
        setMobileTab(MobileTab.SELECTION)
      }
    }
  }, [isOpen, exercise, exercises, isMobile])

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
  }

  const handleStartDictation = () => {
    if (isMobile) {
      setMobileTab(MobileTab.DICTATION)
    } else {
      setPracticeStage(PracticeStage.DICTATION)
    }
  }

  const handleStartReadingAnalysis = () => {
    if (isMobile) {
      setMobileTab(MobileTab.READING)
    } else {
      setPracticeStage(PracticeStage.READING)
    }
  }

  const handleViewReadingAnalysis = () => {
    if (isMobile) {
      setMobileTab(MobileTab.READING)
    } else if (practiceStage === PracticeStage.DICTATION) {
      setPracticeStage(PracticeStage.READING)
    }
  }

  const handleTryAgain = () => {
    setShowResults(false)
    setUserInput("")
    setAccuracy(0)
    setShowConfetti(false)
    if (isMobile) {
      setMobileTab(MobileTab.DICTATION)
    }
  }

  const handleMobileTabChange = (tab: MobileTab) => {
    setMobileTab(tab)
  }

  if (!updatedExercise || updatedExercise.language !== settings.selectedLanguage) return null

  // Mobile view - completely custom fullscreen implementation
  if (isMobile) {
    return (
      <MobileModalWrapper isOpen={isOpen} onClose={() => handleOpenChange(false)}>
        {mobileTab === MobileTab.SELECTION && (
          <MobileSelectionScreen
            exercise={updatedExercise}
            onSelectReading={handleStartReadingAnalysis}
            onSelectDictation={handleStartDictation}
            onClose={() => handleOpenChange(false)}
            analysisAllowed={analysisAllowed}
            loadingAnalysisCheck={loadingAnalysisCheck}
            subscription={subscription}
          />
        )}

        {mobileTab === MobileTab.READING && (
          <MobileReadingAnalysisWrapper
            exercise={updatedExercise}
            onComplete={handleStartDictation}
            existingAnalysisId={analysisId || undefined}
            activeTab={mobileTab}
            onTabChange={handleMobileTabChange}
            onClose={() => handleOpenChange(false)}
            hasReadingAnalysis={hasExistingAnalysis}
            showResults={showResults}
          />
        )}

        {mobileTab === MobileTab.DICTATION && (
          <MobileDictationPractice
            exercise={updatedExercise}
            onComplete={handleComplete}
            showResults={showResults}
            onTryAgain={handleTryAgain}
            activeTab={mobileTab}
            onTabChange={handleMobileTabChange}
            onClose={() => handleOpenChange(false)}
            hasReadingAnalysis={hasExistingAnalysis}
            userInput={userInput}
            setUserInput={setUserInput}
            accuracy={accuracy}
          />
        )}

        {mobileTab === MobileTab.RESULTS && showResults && (
          <MobileResultsScreen
            exercise={updatedExercise}
            userInput={userInput}
            accuracy={accuracy}
            onTryAgain={handleTryAgain}
            activeTab={mobileTab}
            onTabChange={handleMobileTabChange}
            onClose={() => handleOpenChange(false)}
            hasReadingAnalysis={hasExistingAnalysis}
            showConfetti={showConfetti}
          />
        )}
      </MobileModalWrapper>
    )
  }

  // Desktop view - original Dialog implementation
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">{updatedExercise.title} Practice</DialogTitle>

        {practiceStage === PracticeStage.PROMPT && (
          <div className="px-6 py-8 space-y-4 md:space-y-6 flex-1 overflow-y-auto">
            <div className="mb-2 md:mb-4">
              <h2 className="text-2xl font-bold mb-1 md:mb-2">{updatedExercise.title}</h2>
              <div className="text-sm md:text-base">
                <p className="text-lg font-medium mb-1 md:mb-2">Boost Your Understanding Before You Start</p>
                <p className="text-base">
                  Dive into a Reading Analysis to see how words and grammar work — or skip straight to dictation.
                </p>
                {loadingAnalysisCheck && (
                  <div className="mt-2 text-sm font-medium">Checking for existing analysis...</div>
                )}
              </div>
            </div>

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

        {practiceStage === PracticeStage.READING && (
          <div className="flex-1 overflow-hidden">
            <ReadingAnalysis
              exercise={updatedExercise}
              onComplete={handleStartDictation}
              existingAnalysisId={analysisId || undefined}
            />
          </div>
        )}

        {practiceStage === PracticeStage.DICTATION && (
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
      </DialogContent>
    </Dialog>
  )
}

export default PracticeModal