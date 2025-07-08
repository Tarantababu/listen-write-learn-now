

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Headphones, AlertTriangle, Clock, BookOpen, TrendingUp, Users, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGTM } from '@/hooks/use-gtm';
import { useIsMobile } from '@/hooks/use-mobile';

interface LearningOptionsMenuProps {
  onStartReadingAnalysis: () => void;
  onStartDictation: () => void;
  exerciseTitle?: string;
  analysisAllowed?: boolean;
  isSubscribed?: boolean;
  loadingAnalysisCheck?: boolean;
}

const LearningOptionsMenu: React.FC<LearningOptionsMenuProps> = ({
  onStartReadingAnalysis,
  onStartDictation,
  exerciseTitle,
  analysisAllowed = true,
  isSubscribed = false,
  loadingAnalysisCheck = false
}) => {
  const {
    trackFeatureUsed,
    trackCTAClick
  } = useGTM();
  const isMobile = useIsMobile();

  const handleReadingAnalysisClick = () => {
    trackFeatureUsed({
      feature_name: 'reading_analysis_start',
      feature_category: 'exercise',
      additional_data: {
        exercise_title: exerciseTitle,
        is_subscribed: isSubscribed
      }
    });
    trackCTAClick({
      cta_type: 'start_exercise',
      cta_location: 'learning_options_menu',
      cta_text: 'Reading Analysis'
    });
    onStartReadingAnalysis();
  };

  const handleDictationClick = () => {
    trackFeatureUsed({
      feature_name: 'dictation_practice_start',
      feature_category: 'exercise',
      additional_data: {
        exercise_title: exerciseTitle,
        is_subscribed: isSubscribed
      }
    });
    trackCTAClick({
      cta_type: 'start_exercise',
      cta_location: 'learning_options_menu',
      cta_text: 'Dictation Practice'
    });
    onStartDictation();
  };

  // Smart recommendations based on user status
  const getRecommendation = () => {
    if (!analysisAllowed && !isSubscribed) {
      return {
        type: 'upgrade',
        message: 'Start with Dictation Practice, then upgrade for unlimited Reading Analysis',
        action: 'dictation'
      };
    }
    return {
      type: 'beginner',
      message: 'New to this text? Start with Reading Analysis for better understanding',
      action: 'analysis'
    };
  };

  const recommendation = getRecommendation();

  return (
    <>
      {/* Custom styles to override global button hover states */}
      <style jsx>{`
        .learning-options-button:hover,
        .learning-options-button:hover *,
        .learning-options-button:hover .text-muted-foreground,
        .learning-options-button:hover [class*="text-muted-foreground"] {
          color: inherit !important;
          background-color: transparent !important;
        }
        
        .learning-options-button:hover {
          background-color: transparent !important;
        }
        
        .learning-options-button.reading-analysis-enabled:hover {
          color: hsl(var(--primary)) !important;
        }
        
        .learning-options-button.reading-analysis-enabled:hover *,
        .learning-options-button.reading-analysis-enabled:hover .text-muted-foreground,
        .learning-options-button.reading-analysis-enabled:hover [class*="text-muted-foreground"] {
          color: hsl(var(--primary)) !important;
        }
        
        .learning-options-button.dictation-practice:hover {
          color: hsl(var(--foreground)) !important;
        }
        
        .learning-options-button.dictation-practice:hover *,
        .learning-options-button.dictation-practice:hover .text-muted-foreground,
        .learning-options-button.dictation-practice:hover [class*="text-muted-foreground"] {
          color: hsl(var(--foreground)) !important;
        }
        
        .learning-options-button:disabled,
        .learning-options-button:disabled:hover,
        .learning-options-button:disabled:hover * {
          color: hsl(var(--muted-foreground)) !important;
          opacity: 0.5;
        }
      `}</style>
      
      <div className={`flex flex-col h-full max-h-[85vh] bg-background ${isMobile ? 'rounded-none p-0 max-h-[100vh]' : ''}`}>
        {/* Header Section */}
        <div className={`flex-shrink-0 ${isMobile?'px-3 pt-3 pb-2 border-b':'px-6 pt-6 pb-4 border-b border-border/50'}`}>
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm ${isMobile?"min-w-[40px] min-h-[40px]":""}`}>
                <BookOpen className={`h-5 w-5 text-primary`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`font-bold truncate ${isMobile?'text-lg':'text-xl'} text-foreground`}>{exerciseTitle}</h2>
                <p className="text-xs text-muted-foreground">Choose your learning approach</p>
              </div>
            </div>

            {/* Smart Recommendation Banner */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className={`mb-2 ${isMobile?'py-1':'mb-4'}`}
            >
              <div className={`
                p-2 md:p-3 rounded-xl border-l-4
                ${recommendation.type === 'upgrade' 
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-amber-400 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-l-amber-400' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-blue-400 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-l-blue-400'
                }
              `}>
                <div className="flex items-start gap-2 md:gap-3">
                  <TrendingUp className={`h-5 w-5 mt-0.5 ${
                    recommendation.type === 'upgrade' 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`} />
                  <div>
                    <p className="font-medium text-sm mb-0">💡 Smart Recommendation</p>
                    <p className="text-xs text-muted-foreground">{recommendation.message}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Description */}
            <div className={`space-y-1 md:space-y-3`}>
              <p className={`font-medium ${isMobile?'text-base':'text-base'}`}>Choose Your Learning Path</p>
              <p className={`text-xs md:text-sm text-muted-foreground leading-relaxed`}>
                Select the approach that works best for you. Reading Analysis helps you understand vocabulary and grammar, 
                while Dictation Practice builds listening and transcription skills.
              </p>
              <div className={`flex items-center gap-2 md:gap-3 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 mt-2`}>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className={isMobile?'text-xs':'font-medium'}>Step 1: Choose learning mode</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted"></div>
                  <span>Step 2: Practice</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted"></div>
                  <span>Step 3: Complete</span>
                </div>
              </div>
              {loadingAnalysisCheck && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex items-center justify-center gap-2 mt-2 text-sm font-medium text-primary bg-primary/10 rounded-lg p-2"
                >
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Checking analysis...
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-2 pt-2 pb-10' : 'px-6 py-6'} space-y-4 md:space-y-6 practice-content`}>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-6'} mt-0`}>
            {/* Reading Analysis Option */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }} 
              whileTap={{ scale: 0.98 }} 
              transition={{ duration: 0.2 }} 
              className={`group relative`}
            >
              {recommendation.action === 'analysis' && analysisAllowed && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  transition={{ delay: 0.3 }} 
                  className="absolute -top-2 -right-2 z-10"
                >
                  <Badge className="bg-green-500 text-white shadow-lg">
                    Recommended
                  </Badge>
                </motion.div>
              )}
              <Card className={`
                border-2 overflow-hidden transition-all duration-300 hover:shadow-lg
                ${analysisAllowed 
                  ? 'border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10 hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/20' 
                  : 'border-muted/50 bg-muted/20'
                }
                ${recommendation.action === 'analysis' && analysisAllowed ? 'ring-2 ring-primary/20' : ''}
                ${isMobile?'rounded-xl':''}
              `}>
                <CardContent className="p-0">
                  <Button 
                    onClick={handleReadingAnalysisClick} 
                    variant="ghost" 
                    disabled={!analysisAllowed || loadingAnalysisCheck} 
                    className={`
                      learning-options-button ${analysisAllowed ? 'reading-analysis-enabled' : ''}
                      h-auto py-7 px-2 md:px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent hover:bg-transparent touch-manipulation
                      transition-all group-hover:scale-100
                    `}
                    data-gtm-cta-type="start_exercise" 
                    data-gtm-cta-location="learning_options_menu" 
                    data-gtm-cta-text="Reading Analysis" 
                    aria-label={`Start Reading Analysis for ${exerciseTitle}. ${analysisAllowed ? 'Available' : 'Requires upgrade'}`}
                  >
                    <div className="flex flex-col items-center text-center space-y-3 md:space-y-4 w-full">
                      <div className={`
                        flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full transition-all
                        ${analysisAllowed ? 'bg-primary/15 group-hover:bg-primary/25':'bg-muted/30'}`}>
                        <Search className={`h-6 w-6 md:h-7 md:w-7 ${analysisAllowed ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="space-y-2 md:space-y-3 w-full">
                        <div className={`font-semibold text-base md:text-xl ${analysisAllowed ? 'text-primary' : 'text-muted-foreground'}`}>🔍 Reading Analysis</div>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed px-0 md:px-2">
                          Explore vocabulary and grammar with AI explanations
                        </p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-primary"></div>
                            <span>Vocabulary explanations</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-primary"></div>
                            <span>Grammar insights</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-primary"></div>
                            <span>Cultural context</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-1 md:pt-2">
                          <Clock className="h-3 w-3" />
                          <span>~5-10 minutes</span>
                        </div>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            {/* Dictation Option */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }} 
              whileTap={{ scale: 0.98 }} 
              transition={{ duration: 0.2 }} 
              className="group relative"
            >
              {recommendation.action === 'dictation' && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  transition={{ delay: 0.3 }} 
                  className="absolute -top-2 -right-2 z-10"
                >
                  <Badge className="bg-green-500 text-white shadow-lg">
                    Recommended
                  </Badge>
                </motion.div>
              )}
              <Card className={`border-2 overflow-hidden transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-muted/20 to-muted/30 border-muted hover:border-muted/60 hover:bg-gradient-to-br hover:from-muted/30 hover:to-muted/40
                ${recommendation.action === 'dictation' ? 'ring-2 ring-primary/20' : ''}
                ${isMobile?'rounded-xl':''}
              `}>
                <CardContent className="p-0">
                  <Button 
                    onClick={handleDictationClick}
                    variant="ghost"
                    className="learning-options-button dictation-practice h-auto py-7 px-2 md:px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent hover:bg-transparent touch-manipulation transition-all group-hover:scale-100"
                    data-gtm-cta-type="start_exercise"
                    data-gtm-cta-location="learning_options_menu"
                    data-gtm-cta-text="Dictation Practice"
                    aria-label={`Start Dictation Practice for ${exerciseTitle}`}
                  >
                    <div className="flex flex-col items-center text-center space-y-3 md:space-y-4 w-full">
                      <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted/40 group-hover:bg-muted/60">
                        <Headphones className="h-6 w-6 md:h-7 md:w-7 text-foreground" />
                      </div>
                      <div className="space-y-2 md:space-y-3 w-full">
                        <div className="font-semibold text-base md:text-xl text-foreground">🎧 Dictation Practice</div>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed px-0 md:px-2">
                          Practice listening and transcription skills with audio
                        </p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                            <span>Audio playback control</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                            <span>Real-time feedback</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                            <span>Accuracy scoring</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1 md:pt-2">
                          <Clock className="h-3 w-3" />
                          <span>~10-15 minutes</span>
                        </div>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          {/* Social Proof - only on desktop */}
          {!isMobile && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-6 pt-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Join 10k+ learners</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>95% completion rate</span>
              </div>
            </motion.div>
          )}
        </div>
        {/* Fixed Footer - Upgrade Premium Banner */}
        {!analysisAllowed && !isSubscribed && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3, delay: 0.5 }} 
            className={`flex-shrink-0 border-t border-border/50 bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300 ${isMobile?'p-3':'p-6'}`}
          >
            <div className="flex items-start gap-3 md:gap-4">
              <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className={`font-medium ${isMobile?'text-base':'text-base'} mb-1 md:mb-2`}>Reading Analysis Limit Reached</p>
                <p className="text-xs md:text-sm mb-1 md:mb-3 leading-relaxed">
                  You've used all 5 free Reading Analyses. Upgrade to premium for unlimited access to vocabulary explanations, grammar insights, and cultural context.
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 rounded-full font-medium">
                    ✨ Premium Feature
                  </span>
                  <span>Unlimited analyses • Priority support • Advanced features</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default LearningOptionsMenu;

