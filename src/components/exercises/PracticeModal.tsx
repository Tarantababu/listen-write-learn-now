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
  PROMPT = 0, // Ask user if they want Reading Analysis
  READING = 1, // Reading Analysis mode
  DICTATION = 2, // Dictation Practice mode
}

const PracticeModal: React.FC<PracticeModalProps> = ({ isOpen, onOpenChange, exercise, onComplete }) => {
  const [showResults, setShowResults] = useState(false)
  const [updatedExercise, setUpdatedExercise] = useState<Exercise | null>(exercise)
  const [practiceStage, setPracticeStage] = useState<PracticeStage>(PracticeStage.PROMPT)
  const [hasExistingAnalysis, setHasExistingAnalysis] = useState<boolean>(false)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [analysisAllowed, setAnalysisAllowed] = useState<boolean>(true)
  const [loadingAnalysisCheck, setLoadingAnalysisCheck] = useState<boolean>(false)
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false)
  const [mobileLayoutState, setMobileLayoutState] = useState<{
    safeAreaHeight: number
    viewportHeight: number
    keyboardHeight: number
    isLandscape: boolean
  }>({
    safeAreaHeight: 0,
    viewportHeight: 0,
    keyboardHeight: 0,
    isLandscape: false
  })
  
  const hasInitializedRef = useRef<boolean>(false)
  const isMobile = useIsMobile()
  const initialViewportHeight = useRef<number>(0)
  const resizeTimeoutRef = useRef<NodeJS.Timeout>()
  const orientationChangeTimeoutRef = useRef<NodeJS.Timeout>()

  const { settings } = useUserSettingsContext()
  const { exercises, hasReadingAnalysis } = useExerciseContext()
  const { user } = useAuth()
  const { subscription } = useSubscription()

  // Enhanced mobile keyboard and viewport detection
  useEffect(() => {
    if (!isMobile) return

    // Store initial viewport measurements
    const initialHeight = window.visualViewport?.height || window.innerHeight
    const initialScreenHeight = window.screen?.height || initialHeight
    initialViewportHeight.current = initialHeight

    const updateMobileLayout = () => {
      // Clear any pending timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }

      // Debounce rapid changes
      resizeTimeoutRef.current = setTimeout(() => {
        const currentViewportHeight = window.visualViewport?.height || window.innerHeight
        const currentScreenHeight = window.screen?.height || currentViewportHeight
        const currentInnerHeight = window.innerHeight
        
        // Detect orientation
        const isCurrentlyLandscape = window.screen?.orientation?.angle === 90 || 
                                   window.screen?.orientation?.angle === -90 || 
                                   window.innerWidth > window.innerHeight

        // Calculate keyboard height using multiple methods for accuracy
        const heightDifferenceFromInitial = initialViewportHeight.current - currentViewportHeight
        const heightDifferenceFromScreen = currentScreenHeight - currentViewportHeight
        const heightDifferenceFromInner = currentInnerHeight - currentViewportHeight

        // Use the most reliable measurement
        let keyboardHeight = Math.max(
          heightDifferenceFromInitial,
          heightDifferenceFromScreen,
          heightDifferenceFromInner
        )

        // Minimum threshold for keyboard detection (more reliable than 150px)
        const keyboardThreshold = isCurrentlyLandscape ? 100 : 200
        const isKeyboardCurrentlyVisible = keyboardHeight > keyboardThreshold

        // Safe area calculations
        const safeAreaHeight = Math.min(currentViewportHeight, currentInnerHeight)

        setMobileLayoutState({
          safeAreaHeight,
          viewportHeight: currentViewportHeight,
          keyboardHeight: Math.max(0, keyboardHeight),
          isLandscape: isCurrentlyLandscape
        })

        setKeyboardVisible(isKeyboardCurrentlyVisible)

        console.log('Mobile layout update:', {
          isKeyboardVisible: isKeyboardCurrentlyVisible,
          keyboardHeight,
          safeAreaHeight,
          isLandscape: isCurrentlyLandscape,
          currentViewportHeight,
          threshold: keyboardThreshold
        })
      }, 100)
    }

    // Multiple event listeners for comprehensive detection
    const eventListeners: Array<{ target: any, event: string, handler: () => void }> = []

    // Visual Viewport API (most reliable when available)
    if (window.visualViewport) {
      const handler = () => updateMobileLayout()
      window.visualViewport.addEventListener("resize", handler)
      eventListeners.push({ target: window.visualViewport, event: "resize", handler })
    }

    // Window resize fallback
    const windowResizeHandler = () => updateMobileLayout()
    window.addEventListener("resize", windowResizeHandler)
    eventListeners.push({ target: window, event: "resize", handler: windowResizeHandler })

    // Orientation change detection
    const orientationHandler = () => {
      if (orientationChangeTimeoutRef.current) {
        clearTimeout(orientationChangeTimeoutRef.current)
      }
      // Delay to allow for orientation change to complete
      orientationChangeTimeoutRef.current = setTimeout(updateMobileLayout, 300)
    }

    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener("change", orientationHandler)
      eventListeners.push({ target: window.screen.orientation, event: "change", handler: orientationHandler })
    }

    // Focus/blur detection for input elements
    const focusHandler = () => {
      setTimeout(updateMobileLayout, 300) // Delay for keyboard animation
    }
    const blurHandler = () => {
      setTimeout(updateMobileLayout, 100)
    }

    document.addEventListener("focusin", focusHandler)
    document.addEventListener("focusout", blurHandler)
    eventListeners.push({ target: document, event: "focusin", handler: focusHandler })
    eventListeners.push({ target: document, event: "focusout", handler: blurHandler })

    // Initial measurement
    updateMobileLayout()

    // Cleanup function
    return () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current)
      if (orientationChangeTimeoutRef.current) clearTimeout(orientationChangeTimeoutRef.current)
      
      eventListeners.forEach(({ target, event, handler }) => {
        target?.removeEventListener(event, handler)
      })
    }
  }, [isMobile])

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setKeyboardVisible(false)
      setMobileLayoutState({
        safeAreaHeight: 0,
        viewportHeight: 0,
        keyboardHeight: 0,
        isLandscape: false
      })
    }
  }, [isOpen])

  // Update the local exercise state immediately when the prop changes or when exercises are updated
  useEffect(() => {
    if (exercise) {
      // If there's an exercise, find the latest version from the exercises context
      const latestExerciseData = exercises.find((ex) => ex.id === exercise.id)
      setUpdatedExercise(latestExerciseData || exercise)
    } else {
      setUpdatedExercise(null)
    }
  }, [exercise, exercises])

  // Check if the user has an existing reading analysis for this exercise
  // ONLY do this check when the modal opens initially, not on every render
  useEffect(() => {
    const checkExistingAnalysis = async () => {
      if (!exercise || !user || !isOpen) return

      try {
        setLoadingAnalysisCheck(true)
        console.log("Checking for existing analysis for exercise:", exercise.id, "user:", user.id)

        // Use the hasReadingAnalysis function from the ExerciseContext
        const hasAnalysis = await hasReadingAnalysis(exercise.id)
        console.log("Analysis check result:", hasAnalysis)

        if (hasAnalysis) {
          console.log("Existing analysis found")
          setHasExistingAnalysis(true)

          // Get the analysis ID
          const { data: analysisData, error: analysisError } = await supabase
            .from("reading_analyses")
            .select("id")
            .eq("exercise_id", exercise.id)
            .eq("user_id", user.id)
            .maybeSingle()

          if (!analysisError && analysisData) {
            setAnalysisId(analysisData.id)
            console.log("Existing analysis ID:", analysisData.id)
          }

          // On mobile, skip directly to dictation regardless of existing analysis
          // On desktop, skip to dictation if user has done reading analysis before
          setPracticeStage(isMobile ? PracticeStage.DICTATION : PracticeStage.DICTATION)
        } else {
          console.log("No existing analysis found")
          setHasExistingAnalysis(false)
          setAnalysisId(null)

          // For free users, check if they've reached their limit
          if (!subscription.isSubscribed) {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("reading_analyses_count")
              .eq("id", user.id)
              .maybeSingle()

            if (profileError) {
              console.error("Error checking profile:", profileError)
              return
            }

            // Free users are limited to 5 analyses
            if (profileData && profileData.reading_analyses_count >= 5) {
              setAnalysisAllowed(false)
              toast({
                title: "Free user limit reached",
                description: "Free users are limited to 5 reading analyses. Upgrade to premium for unlimited analyses.",
                variant: "destructive",
              })
              // We still show the prompt, but the reading analysis option will be disabled
            }
          }

          // On mobile, go directly to dictation. On desktop, show prompt
          setPracticeStage(isMobile ? PracticeStage.DICTATION : PracticeStage.PROMPT)
        }
      } catch (error) {
        console.error("Error in analysis check:", error)
      } finally {
        setLoadingAnalysisCheck(false)
      }
    }

    // Only check when modal opens AND we haven't initialized yet
    if (isOpen && !hasInitializedRef.current) {
      checkExistingAnalysis()
      hasInitializedRef.current = true
    }

    // Reset the initialization ref when modal closes
    if (!isOpen) {
      hasInitializedRef.current = false
    }
  }, [exercise, user, isOpen, subscription.isSubscribed, hasReadingAnalysis, isMobile])

  const handleComplete = (accuracy: number) => {
    // Update progress and show results
    onComplete(accuracy)
    setShowResults(true)

    // Update local exercise state to reflect progress immediately
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

  // Only reset the state when the modal opens, not during interactions
  useEffect(() => {
    if (isOpen) {
      // Refresh exercise data when modal opens
      const latestExerciseData = exercises.find((ex) => ex?.id === exercise?.id)
      setUpdatedExercise(latestExerciseData || exercise)
      // We don't reset practiceStage or showResults here to preserve state during the session
    } else {
      // Reset showResults when modal is fully closed to prepare for next opening
      setShowResults(false)
    }
  }, [isOpen, exercise, exercises])

  // Safe handling of modal open state change
  const handleOpenChange = (open: boolean) => {
    // If closing, we just pass it through without resetting states
    // This ensures dictation results remain visible until the modal fully closes
    onOpenChange(open)
  }

  const handleStartDictation = () => {
    setPracticeStage(PracticeStage.DICTATION)
  }

  const handleStartReadingAnalysis = () => {
    setPracticeStage(PracticeStage.READING)
  }

  const handleViewReadingAnalysis = () => {
    // If we're already in dictation mode, we need to switch to reading analysis
    if (practiceStage === PracticeStage.DICTATION) {
      setPracticeStage(PracticeStage.READING)
    }
  }

  const handleTryAgain = () => {
    setShowResults(false)
    // Important: Don't reset to prompt stage here - stay in dictation mode
  }

  // If the exercise doesn't match the selected language, don't render
  if (!updatedExercise || updatedExercise.language !== settings.selectedLanguage) return null

  // Enhanced mobile styling calculations
  const getMobileStyles = () => {
    if (!isMobile) return {}

    const { safeAreaHeight, keyboardHeight, isLandscape } = mobileLayoutState

    if (keyboardVisible && safeAreaHeight > 0) {
      // Calculate optimal height considering keyboard and safe areas
      const availableHeight = safeAreaHeight
      const minHeight = isLandscape ? 300 : 400 // Minimum usable height
      const optimalHeight = Math.max(minHeight, availableHeight - 10) // Reduced margin

      return {
        height: `${optimalHeight}px`,
        maxHeight: `${optimalHeight}px`,
        transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    }

    return {
      height: '100vh',
      maxHeight: '100vh',
      transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }
  }

  return (
    <>
      {/* Enhanced mobile CSS for elegant and minimalistic design */}
      {isMobile && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @media (max-width: 768px) {
              .mobile-practice-modal {
                position: fixed !important;
                inset: 0 !important;
                margin: 0 !important;
                border-radius: 0 !important;
                border: none !important;
                background: hsl(var(--background)) !important;
                display: flex !important;
                flex-direction: column !important;
                overflow: hidden !important;
                transform: none !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                box-shadow: none !important;
              }
              
              .mobile-practice-content {
                flex: 1 !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                -webkit-overflow-scrolling: touch !important;
                scroll-behavior: smooth !important;
                padding: 16px !important;
                margin: 0 !important;
                background: hsl(var(--background)) !important;
              }
              
              .mobile-keyboard-adjusted {
                padding-bottom: ${keyboardVisible ? '8px' : 'env(safe-area-inset-bottom, 16px)'} !important;
              }
              
              /* Minimalistic spacing overrides */
              .mobile-practice-content .space-y-4 > :not([hidden]) ~ :not([hidden]) {
                margin-top: 16px !important;
              }
              
              .mobile-practice-content .space-y-3 > :not([hidden]) ~ :not([hidden]) {
                margin-top: 12px !important;
              }
              
              .mobile-practice-content .space-y-2 > :not([hidden]) ~ :not([hidden]) {
                margin-top: 8px !important;
              }
              
              /* Clean padding and margins */
              .mobile-practice-content .p-6 {
                padding: 16px !important;
              }
              
              .mobile-practice-content .p-4 {
                padding: 12px !important;
              }
              
              .mobile-practice-content .p-3 {
                padding: 8px !important;
              }
              
              .mobile-practice-content .py-8 {
                padding-top: 16px !important;
                padding-bottom: 16px !important;
              }
              
              .mobile-practice-content .py-6 {
                padding-top: 12px !important;
                padding-bottom: 12px !important;
              }
              
              .mobile-practice-content .py-4 {
                padding-top: 8px !important;
                padding-bottom: 8px !important;
              }
              
              .mobile-practice-content .px-6 {
                padding-left: 16px !important;
                padding-right: 16px !important;
              }
              
              .mobile-practice-content .px-4 {
                padding-left: 12px !important;
                padding-right: 12px !important;
              }
              
              /* Elegant margins */
              .mobile-practice-content .mb-6 {
                margin-bottom: 16px !important;
              }
              
              .mobile-practice-content .mb-4 {
                margin-bottom: 12px !important;
              }
              
              .mobile-practice-content .mt-6 {
                margin-top: 16px !important;
              }
              
              .mobile-practice-content .mt-4 {
                margin-top: 12px !important;
              }
              
              /* Clean input focus behavior */
              .mobile-practice-content textarea:focus,
              .mobile-practice-content input:focus {
                scroll-margin-bottom: 60px !important;
                outline: 2px solid hsl(var(--ring)) !important;
                outline-offset: 2px !important;
              }
              
              /* Landscape optimization */
              @media (orientation: landscape) {
                .mobile-practice-content {
                  padding: 12px !important;
                }
                
                .mobile-keyboard-adjusted {
                  padding-bottom: ${keyboardVisible ? '6px' : '12px'} !important;
                }
              }
            }
          `,
          }}
        />
      )}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className={`
            ${
              isMobile
                ? "mobile-practice-modal"
                : "max-w-4xl max-h-[90vh]"
            } 
            overflow-hidden flex flex-col
          `}
          style={getMobileStyles()}
        >
          <DialogTitle className="sr-only">{updatedExercise.title} Practice</DialogTitle>

          {/* Desktop: Conditionally render based on practice stage */}
          {/* Mobile: Always show dictation directly */}
          {!isMobile && practiceStage === PracticeStage.PROMPT && (
            <div className="px-6 py-8 space-y-4 md:space-y-6 flex-1 overflow-y-auto practice-content">
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
            <div className="flex-1 overflow-hidden practice-content">
              <ReadingAnalysis
                exercise={updatedExercise}
                onComplete={handleStartDictation}
                existingAnalysisId={analysisId || undefined}
              />
            </div>
          )}

          {/* Show dictation for both mobile (always) and desktop (when in dictation stage) */}
          {(isMobile || practiceStage === PracticeStage.DICTATION) && (
            <div className={`
              flex-1 overflow-hidden 
              ${isMobile ? 'mobile-practice-content mobile-keyboard-adjusted' : 'practice-content'}
            `}>
              <DictationPractice
                exercise={updatedExercise}
                onComplete={handleComplete}
                showResults={showResults}
                onTryAgain={handleTryAgain}
                hasReadingAnalysis={hasExistingAnalysis}
                onViewReadingAnalysis={!isMobile && hasExistingAnalysis ? handleViewReadingAnalysis : undefined}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PracticeModal
