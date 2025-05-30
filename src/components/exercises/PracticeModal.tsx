import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Exercise } from '@/types';
import DictationPractice from '@/components/DictationPractice';
import ReadingAnalysis from '@/components/ReadingAnalysis';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, BookOpen, Search, Headphones } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface PracticeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: Exercise | null;
  onComplete: (accuracy: number) => void;
}

enum PracticeStage {
  PROMPT,    // Ask user if they want Reading Analysis
  READING,   // Reading Analysis mode
  DICTATION, // Dictation Practice mode
}

const PracticeModal: React.FC<PracticeModalProps> = ({
  isOpen,
  onOpenChange,
  exercise,
  onComplete
}) => {
  const [showResults, setShowResults] = useState(false);
  const [updatedExercise, setUpdatedExercise] = useState<Exercise | null>(exercise);
  const [practiceStage, setPracticeStage] = useState<PracticeStage>(PracticeStage.PROMPT);
  const [hasExistingAnalysis, setHasExistingAnalysis] = useState<boolean>(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisAllowed, setAnalysisAllowed] = useState<boolean>(true);
  const [loadingAnalysisCheck, setLoadingAnalysisCheck] = useState<boolean>(false);
  
  // Mobile keyboard handling states
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [initialViewportHeight, setInitialViewportHeight] = useState<number>(0);
  const hasInitializedRef = useRef<boolean>(false);
  const isMobile = useIsMobile();
  
  const {
    settings
  } = useUserSettingsContext();
  
  const {
    exercises,
    hasReadingAnalysis
  } = useExerciseContext();
  
  const {
    user
  } = useAuth();
  
  const {
    subscription
  } = useSubscription();

  // Mobile keyboard detection and viewport management
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    // Store initial viewport height when modal opens
    const initialHeight = window.visualViewport?.height || window.innerHeight;
    setInitialViewportHeight(initialHeight);

    const handleViewportChange = () => {
      if (!window.visualViewport) return;
      
      const currentHeight = window.visualViewport.height;
      const heightDifference = initialHeight - currentHeight;
      
      // Consider keyboard open if viewport shrunk by more than 150px
      const keyboardThreshold = 150;
      const isKeyboardNowOpen = heightDifference > keyboardThreshold;
      
      setIsKeyboardOpen(isKeyboardNowOpen);
      
      // Update CSS custom property for dynamic height adjustment
      document.documentElement.style.setProperty(
        '--viewport-height', 
        `${currentHeight}px`
      );
    };

    // Set up viewport change listener
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      handleViewportChange(); // Call once to set initial values
    }

    // Fallback for browsers without visualViewport
    const handleWindowResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      const keyboardThreshold = 150;
      const isKeyboardNowOpen = heightDifference > keyboardThreshold;
      
      setIsKeyboardOpen(isKeyboardNowOpen);
      document.documentElement.style.setProperty(
        '--viewport-height', 
        `${currentHeight}px`
      );
    };

    if (!window.visualViewport) {
      window.addEventListener('resize', handleWindowResize);
      handleWindowResize();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleWindowResize);
      }
      
      // Clean up CSS custom property
      document.documentElement.style.removeProperty('--viewport-height');
    };
  }, [isMobile, isOpen]);

  // Prevent body scroll when modal is open on mobile
  useEffect(() => {
    if (!isMobile) return;

    if (isOpen) {
      // Prevent body scroll and handle iOS Safari bounce
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
      
      // Prevent pull-to-refresh on mobile
      document.body.style.overscrollBehavior = 'none';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.overscrollBehavior = '';
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [isOpen, isMobile]);

  // Update the local exercise state immediately when the prop changes or when exercises are updated 
  useEffect(() => {
    if (exercise) {
      // If there's an exercise, find the latest version from the exercises context
      const latestExerciseData = exercises.find(ex => ex.id === exercise.id);
      setUpdatedExercise(latestExerciseData || exercise);
    } else {
      setUpdatedExercise(null);
    }
  }, [exercise, exercises]);

  // Check if the user has an existing reading analysis for this exercise
  // ONLY do this check when the modal opens initially, not on every render
  useEffect(() => {
    const checkExistingAnalysis = async () => {
      if (!exercise || !user || !isOpen) return;
      
      try {
        setLoadingAnalysisCheck(true);
        console.log('Checking for existing analysis for exercise:', exercise.id, 'user:', user.id);
        
        // Use the hasReadingAnalysis function from the ExerciseContext
        const hasAnalysis = await hasReadingAnalysis(exercise.id);
        console.log('Analysis check result:', hasAnalysis);
        
        if (hasAnalysis) {
          console.log('Existing analysis found');
          setHasExistingAnalysis(true);
          
          // Get the analysis ID
          const {
            data: analysisData,
            error: analysisError
          } = await supabase.from('reading_analyses')
            .select('id')
            .eq('exercise_id', exercise.id)
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (!analysisError && analysisData) {
            setAnalysisId(analysisData.id);
            console.log('Existing analysis ID:', analysisData.id);
          }
          
          // If user has done reading analysis before, skip to dictation directly
          setPracticeStage(PracticeStage.DICTATION);
        } else {
          console.log('No existing analysis found');
          setHasExistingAnalysis(false);
          setAnalysisId(null);

          // For free users, check if they've reached their limit
          if (!subscription.isSubscribed) {
            const {
              data: profileData,
              error: profileError
            } = await supabase.from('profiles').select('reading_analyses_count').eq('id', user.id).maybeSingle();
            
            if (profileError) {
              console.error('Error checking profile:', profileError);
              return;
            }

            // Free users are limited to 5 analyses
            if (profileData && profileData.reading_analyses_count >= 5) {
              setAnalysisAllowed(false);
              toast({
                title: "Free user limit reached",
                description: "Free users are limited to 5 reading analyses. Upgrade to premium for unlimited analyses.",
                variant: "destructive"
              });
              // We still show the prompt, but the reading analysis option will be disabled
            }
          }
          
          setPracticeStage(PracticeStage.PROMPT);
        }
      } catch (error) {
        console.error('Error in analysis check:', error);
      } finally {
        setLoadingAnalysisCheck(false);
      }
    };
    
    // Only check when modal opens AND we haven't initialized yet
    if (isOpen && !hasInitializedRef.current) {
      checkExistingAnalysis();
      hasInitializedRef.current = true;
    }
    
    // Reset the initialization ref when modal closes
    if (!isOpen) {
      hasInitializedRef.current = false;
    }
  }, [exercise, user, isOpen, subscription.isSubscribed, hasReadingAnalysis]);
  
  const handleComplete = (accuracy: number) => {
    // Update progress and show results
    onComplete(accuracy);
    setShowResults(true);

    // Update local exercise state to reflect progress immediately
    if (updatedExercise && accuracy >= 95) {
      const newCompletionCount = Math.min(3, updatedExercise.completionCount + 1);
      const isCompleted = newCompletionCount >= 3;
      setUpdatedExercise({
        ...updatedExercise,
        completionCount: newCompletionCount,
        isCompleted
      });
    }
  };

  // Only reset the state when the modal opens, not during interactions
  useEffect(() => {
    if (isOpen) {
      // Refresh exercise data when modal opens
      const latestExerciseData = exercises.find(ex => ex?.id === exercise?.id);
      setUpdatedExercise(latestExerciseData || exercise);
      // We don't reset practiceStage or showResults here to preserve state during the session
    } else {
      // Reset showResults when modal is fully closed to prepare for next opening
      setShowResults(false);
      setIsKeyboardOpen(false); // Reset keyboard state
    }
  }, [isOpen, exercise, exercises]);

  // Safe handling of modal open state change
  const handleOpenChange = (open: boolean) => {
    // If closing, we just pass it through without resetting states
    // This ensures dictation results remain visible until the modal fully closes
    onOpenChange(open);
  };
  
  const handleStartDictation = () => {
    setPracticeStage(PracticeStage.DICTATION);
  };
  
  const handleStartReadingAnalysis = () => {
    setPracticeStage(PracticeStage.READING);
  };
  
  const handleViewReadingAnalysis = () => {
    // If we're already in dictation mode, we need to switch to reading analysis
    if (practiceStage === PracticeStage.DICTATION) {
      setPracticeStage(PracticeStage.READING);
    }
  };

  const handleTryAgain = () => {
    setShowResults(false);
    // Important: Don't reset to prompt stage here - stay in dictation mode
  };

  // If the exercise doesn't match the selected language, don't render
  if (!updatedExercise || updatedExercise.language !== settings.selectedLanguage) return null;
  
  // Dynamic classes for mobile keyboard handling
  const getMobileDialogClasses = () => {
    if (!isMobile) return 'max-w-4xl max-h-[90vh]';
    
    return `
      w-[100vw] max-w-none rounded-none m-0 p-0 border-0
      ${isKeyboardOpen 
        ? 'h-[var(--viewport-height,100vh)] max-h-[var(--viewport-height,100vh)]' 
        : 'h-[100vh] max-h-[100vh]'
      }
    `;
  };

  const getMobileContentClasses = () => {
    if (!isMobile) return '';
    
    return `
      ${isKeyboardOpen ? 'keyboard-open' : ''}
      touch-manipulation
      overscroll-none
    `;
  };
  
  // Mobile swipe gesture handling for audio control during dictation
  useEffect(() => {
    if (!isMobile || !isOpen || practiceStage !== PracticeStage.DICTATION) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Only handle swipes outside of input/textarea elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Only handle swipes outside of input/textarea elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleAudioSwipeGesture();
    };

    const handleAudioSwipeGesture = () => {
      const swipeThreshold = 50; // Minimum distance for a swipe
      const maxVerticalDistance = 100; // Maximum vertical movement to still count as horizontal swipe
      
      const horizontalDistance = touchEndX - touchStartX;
      const verticalDistance = Math.abs(touchEndY - touchStartY);
      
      // Only process horizontal swipes
      if (Math.abs(horizontalDistance) > swipeThreshold && verticalDistance < maxVerticalDistance) {
        if (horizontalDistance > 0) {
          // Swipe right → Seek forward in audio (or next audio segment)
          handleAudioSwipeRight();
        } else {
          // Swipe left → Seek backward in audio (or previous audio segment)
          handleAudioSwipeLeft();
        }
      }
    };

    const handleAudioSwipeRight = () => {
      // Seek forward in audio or go to next segment
      const audioElement = document.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        // Skip forward by 5 seconds
        audioElement.currentTime = Math.min(audioElement.currentTime + 5, audioElement.duration);
        
        // Provide haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        
        // Visual feedback
        showAudioFeedback('⏭️ +5s');
      }
    };

    const handleAudioSwipeLeft = () => {
      // Seek backward in audio or go to previous segment
      const audioElement = document.querySelector('audio') as HTMLAudioElement;
      if (audioElement) {
        // Skip backward by 5 seconds
        audioElement.currentTime = Math.max(audioElement.currentTime - 5, 0);
        
        // Provide haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        
        // Visual feedback
        showAudioFeedback('⏮️ -5s');
      }
    };

    const showAudioFeedback = (message: string) => {
      // Create or update feedback element
      let feedbackElement = document.getElementById('audio-swipe-feedback');
      if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'audio-swipe-feedback';
        feedbackElement.className = 'audio-swipe-feedback';
        document.body.appendChild(feedbackElement);
      }
      
      feedbackElement.textContent = message;
      feedbackElement.classList.add('show');
      
      // Hide after 1.5 seconds
      setTimeout(() => {
        feedbackElement?.classList.remove('show');
      }, 1500);
    };

    // Add touch event listeners to the modal content (but not input elements)
    const modalElement = document.querySelector('[data-modal-content]');
    if (modalElement) {
      modalElement.addEventListener('touchstart', handleTouchStart, { passive: true });
      modalElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (modalElement) {
        modalElement.removeEventListener('touchstart', handleTouchStart);
        modalElement.removeEventListener('touchend', handleTouchEnd);
      }
      
      // Clean up feedback element
      const feedbackElement = document.getElementById('audio-swipe-feedback');
      if (feedbackElement) {
        feedbackElement.remove();
      }
    };
  }, [isMobile, isOpen, practiceStage]);

  // Inject mobile-specific styles
  useEffect(() => {
    if (!isMobile) return;

    const styleId = 'practice-modal-mobile-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      .keyboard-open {
        /* Optimize for keyboard interaction */
        transform: translate3d(0, 0, 0) !important;
        backface-visibility: hidden !important;
      }
      
      /* Prevent zoom on input focus for iOS */
      input[type="text"],
      textarea {
        font-size: 16px !important;
        transform: translate3d(0, 0, 0) !important;
      }
      
      /* Smooth transitions for viewport changes */
      .mobile-modal-content {
        transition: height 0.2s ease-out !important;
      }
      
      /* Prevent overscroll bounce on iOS */
      .mobile-modal-content {
        overscroll-behavior: none !important;
        -webkit-overflow-scrolling: touch !important;
      }

      /* Audio swipe gesture optimization */
      .mobile-modal-content {
        touch-action: pan-y pinch-zoom;
        user-select: none;
        -webkit-user-select: none;
      }
      
      /* Allow text selection in input areas */
      .mobile-modal-content input,
      .mobile-modal-content textarea,
      .mobile-modal-content [contenteditable] {
        touch-action: manipulation;
        user-select: text;
        -webkit-user-select: text;
      }

      /* Audio swipe feedback styles */
      .audio-swipe-feedback {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }
      
      .audio-swipe-feedback.show {
        opacity: 1;
      }

      /* Improve dictation text area experience */
      .mobile-modal-content textarea,
      .mobile-modal-content input[type="text"] {
        /* Prevent autocorrect/autocomplete during dictation */
        autocomplete: off;
        autocapitalize: off;
        autocorrect: off;
        spellcheck: false;
        
        /* Better focus styles for mobile */
        outline: none;
        border: 2px solid transparent;
        transition: border-color 0.2s ease;
      }
      
      .mobile-modal-content textarea:focus,
      .mobile-modal-content input[type="text"]:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    `;

    return () => {
      // Clean up styles when component unmounts
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isMobile]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent 
          data-modal-content
          className={`
            ${getMobileDialogClasses()} 
            overflow-hidden flex flex-col
            ${isMobile ? getMobileContentClasses() + ' mobile-modal-content' : ''}
          `}
          style={isMobile ? {
            // Use viewport units for better mobile support
            height: isKeyboardOpen ? 'var(--viewport-height, 100vh)' : '100vh',
            maxHeight: isKeyboardOpen ? 'var(--viewport-height, 100vh)' : '100vh',
          } : undefined}
        >
          <DialogTitle className="sr-only">{updatedExercise.title} Practice</DialogTitle>
          
          {/* Conditionally render based on practice stage */}
          {practiceStage === PracticeStage.PROMPT && (
            <div className={`
              ${isMobile ? 'px-4 py-4' : 'px-6 py-8'} 
              space-y-4 md:space-y-6 flex-1 overflow-y-auto
              ${isMobile ? 'overscroll-none' : ''}
            `}>
              <DialogHeader className="mb-2 md:mb-4">
                <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-1 md:mb-2`}>
                  {updatedExercise.title}
                </h2>
                <DialogDescription className="text-sm md:text-base">
                  <p className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mb-1 md:mb-2`}>
                    Boost Your Understanding Before You Start
                  </p>
                  <p className={`${isMobile ? 'text-sm' : 'text-base'}`}>
                    Dive into a Reading Analysis to see how words and grammar work — or skip straight to dictation.
                  </p>
                  {loadingAnalysisCheck && (
                    <div className="mt-2 text-sm font-medium">
                      Checking for existing analysis...
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className={`grid grid-cols-1 ${isMobile ? 'gap-3 mt-4' : 'md:grid-cols-2 gap-6 mt-6'}`}>
                <Card className="border-muted overflow-hidden hover:bg-muted/5 transition-colors dark:hover:bg-muted/10">
                  <CardContent className="p-0">
                    <Button 
                      onClick={handleStartReadingAnalysis} 
                      variant="ghost" 
                      disabled={!analysisAllowed || loadingAnalysisCheck} 
                      className={`h-auto ${isMobile ? 'py-4 px-3' : 'py-8 px-6'} w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent`}
                    >
                      <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                        <div className={`flex items-center justify-center bg-primary/10 ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full`}>
                          <Search className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-primary`} />
                        </div>
                        <div className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                          🔍 Start with Reading Analysis
                        </div>
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
                      className={`h-auto ${isMobile ? 'py-4 px-3' : 'py-8 px-6'} w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent`}
                    >
                      <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                        <div className={`flex items-center justify-center bg-muted/40 ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full`}>
                          <Headphones className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-muted-foreground`} />
                        </div>
                        <div className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                          🎧 Start Dictation Now
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground px-2">
                          Practice listening and transcription skills with audio
                        </p>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              {!analysisAllowed && !subscription.isSubscribed && (
                <div className={`bg-amber-50 border border-amber-200 text-amber-800 p-3 md:p-4 rounded-md flex items-start ${isMobile ? 'mt-4' : 'mt-6'} dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300`}>
                  <AlertTriangle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-amber-600 dark:text-amber-400 mr-2 md:mr-3 flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>Free user limit reached</p>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>
                      You've reached the limit of 5 reading analyses for free users. 
                      Upgrade to premium for unlimited analyses.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {practiceStage === PracticeStage.READING && (
            <div className={isMobile ? 'flex-1 overflow-hidden' : ''}>
              <ReadingAnalysis 
                exercise={updatedExercise} 
                onComplete={handleStartDictation} 
                existingAnalysisId={analysisId || undefined} 
              />
            </div>
          )}
          
          {practiceStage === PracticeStage.DICTATION && (
            <div className={isMobile ? 'flex-1 overflow-hidden' : ''}>
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
    );
};

export default PracticeModal;