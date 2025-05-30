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
import { AlertTriangle, Search, Headphones } from "lucide-react"
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

  // Prevent body scroll on mobile when modal is open
  useEffect(() => {
    if (isMobile && isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = "hidden"
      document.body.style.position = "fixed"
      document.body.style.width = "100%"
      document.body.style.height = "100%"

      return () => {
        document.body.style.overflow = originalStyle
        document.body.style.position = ""
        document.body.style.width = ""
        document.body.style.height = ""
      }
    }
  }, [isMobile, isOpen])

  // Handle mobile viewport height changes
  useEffect(() => {
    if (isMobile && isOpen) {
      const setVH = () => {
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty("--vh", `${vh}px`)
      }

      setVH()
      window.addEventListener("resize", setVH)
      window.addEventListener("orientationchange", setVH)

      return () => {
        window.removeEventListener("resize", setVH)
        window.removeEventListener("orientationchange", setVH)
      }
    }
  }, [isMobile, isOpen])

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

          setPracticeStage(PracticeStage.DICTATION)
        } else {
          setHasExistingAnalysis(false)
          setAnalysisId(null)

          // Check free user limits
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

          setPracticeStage(PracticeStage.PROMPT)
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
  }, [exercise, user, isOpen, subscription.isSubscribed, hasReadingAnalysis])

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

  // Reset results when modal opens
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

  // Don't render if exercise doesn't match selected language
  if (!updatedExercise || updatedExercise.language !== settings.selectedLanguage) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={
          isMobile
            ? "fixed inset-0 w-full h-full max-w-none max-h-none m-0 p-0 border-0 rounded-none bg-background flex flex-col z-50 overflow-hidden"
            : "max-w-4xl max-h-[90vh] flex flex-col"
        }
        style={
          isMobile
            ? {
                height: "calc(var(--vh, 1vh) * 100)",
                minHeight: "-webkit-fill-available",
                WebkitOverflowScrolling: "touch",
              }
            : undefined
        }
      >
        <DialogTitle className="sr-only">{updatedExercise.title} Practice</DialogTitle>

        {/* Stage: Initial Prompt */}
        {practiceStage === PracticeStage.PROMPT && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header - Fixed */}
            <div
              className={`flex-shrink-0 ${isMobile ? "px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" : "px-6 py-6"}`}
            >
              <DialogHeader>
                <h2 className={`font-bold mb-2 ${isMobile ? "text-lg" : "text-xl md:text-2xl"}`}>
                  {updatedExercise.title}
                </h2>
                <DialogDescription>
                  <p className={`font-medium mb-2 ${isMobile ? "text-sm" : "text-base md:text-lg"}`}>
                    Boost Your Understanding Before You Start
                  </p>
                  <p className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm md:text-base"}`}>
                    Dive into a Reading Analysis to see how words and grammar work — or skip straight to dictation.
                  </p>
                  {loadingAnalysisCheck && (
                    <div className={`mt-2 font-medium ${isMobile ? "text-xs" : "text-sm"}`}>
                      Checking for existing analysis...
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className={`${isMobile ? "p-4 pb-6" : "p-6"}`}>
                <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 md:gap-6"}`}>
                  {/* Reading Analysis Card */}
                  <Card className="border-muted hover:bg-muted/5 transition-colors">
                    <CardContent className="p-0">
                      <Button
                        onClick={handleStartReadingAnalysis}
                        variant="ghost"
                        disabled={!analysisAllowed || loadingAnalysisCheck}
                        className={`h-auto w-full rounded-lg flex flex-col items-center justify-center space-y-3 bg-transparent hover:bg-transparent ${isMobile ? "py-4 px-3 min-h-[100px]" : "py-6 px-4"}`}
                      >
                        <div
                          className={`flex items-center justify-center bg-primary/10 rounded-full ${isMobile ? "w-10 h-10" : "w-12 h-12"}`}
                        >
                          <Search className={`text-primary ${isMobile ? "h-5 w-5" : "h-6 w-6"}`} />
                        </div>
                        <div className="text-center">
                          <div className={`font-semibold mb-1 ${isMobile ? "text-sm" : "text-base md:text-lg"}`}>
                            🔍 Start with Reading Analysis
                          </div>
                          <p
                            className={`text-muted-foreground ${isMobile ? "text-xs leading-tight" : "text-xs md:text-sm"}`}
                          >
                            Explore vocabulary and grammar with AI explanations
                          </p>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Dictation Card */}
                  <Card className="border-muted hover:bg-muted/5 transition-colors">
                    <CardContent className="p-0">
                      <Button
                        onClick={handleStartDictation}
                        variant="ghost"
                        className={`h-auto w-full rounded-lg flex flex-col items-center justify-center space-y-3 bg-transparent hover:bg-transparent ${isMobile ? "py-4 px-3 min-h-[100px]" : "py-6 px-4"}`}
                      >
                        <div
                          className={`flex items-center justify-center bg-muted/40 rounded-full ${isMobile ? "w-10 h-10" : "w-12 h-12"}`}
                        >
                          <Headphones className={`text-muted-foreground ${isMobile ? "h-5 w-5" : "h-6 w-6"}`} />
                        </div>
                        <div className="text-center">
                          <div className={`font-semibold mb-1 ${isMobile ? "text-sm" : "text-base md:text-lg"}`}>
                            🎧 Start Dictation Now
                          </div>
                          <p
                            className={`text-muted-foreground ${isMobile ? "text-xs leading-tight" : "text-xs md:text-sm"}`}
                          >
                            Practice listening and transcription skills with audio
                          </p>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Warning Message */}
                {!analysisAllowed && !subscription.isSubscribed && (
                  <div
                    className={`bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md flex items-start mt-6 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300 ${isMobile ? "p-3" : ""}`}
                  >
                    <AlertTriangle
                      className={`text-amber-600 dark:text-amber-400 mr-3 flex-shrink-0 mt-0.5 ${isMobile ? "h-4 w-4" : "h-5 w-5"}`}
                    />
                    <div>
                      <p className={`font-medium ${isMobile ? "text-xs" : "text-sm md:text-base"}`}>
                        Free user limit reached
                      </p>
                      <p className={`mt-1 ${isMobile ? "text-xs leading-tight" : "text-xs md:text-sm"}`}>
                        You've reached the limit of 5 reading analyses for free users. Upgrade to premium for unlimited
                        analyses.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stage: Reading Analysis */}
        {practiceStage === PracticeStage.READING && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ReadingAnalysis
              exercise={updatedExercise}
              onComplete={handleStartDictation}
              existingAnalysisId={analysisId || undefined}
            />
          </div>
        )}

        {/* Stage: Dictation Practice */}
        {practiceStage === PracticeStage.DICTATION && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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