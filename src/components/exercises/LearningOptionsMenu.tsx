import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Headphones, AlertTriangle, Clock, BookOpen, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGTM } from '@/hooks/use-gtm';
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
  return <div className="px-6 py-8 space-y-6 flex-1 overflow-y-auto practice-content">
      {/* Header Section with Enhanced Hierarchy */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{exerciseTitle}</h2>
        </div>
        
        {/* Smart Recommendation Banner */}
        <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} className="mb-6">
          <div className={`p-4 rounded-lg border-l-4 ${recommendation.type === 'upgrade' ? 'bg-amber-50 border-l-amber-400 dark:bg-amber-950/20' : 'bg-blue-50 border-l-blue-400 dark:bg-blue-950/20'}`}>
            <div className="flex items-start gap-3">
              <TrendingUp className={`h-5 w-5 mt-0.5 ${recommendation.type === 'upgrade' ? 'text-amber-600' : 'text-blue-600'}`} />
              <div>
                <p className="font-medium text-sm mb-1">💡 Smart Recommendation</p>
                <p className="text-sm text-muted-foreground">{recommendation.message}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Description */}
        <div className="space-y-3">
          <p className="text-lg font-medium mb-2">Choose Your Learning Path</p>
          <p className="text-base text-muted-foreground leading-relaxed">
            Select the approach that works best for you. Reading Analysis helps you understand vocabulary and grammar, 
            while Dictation Practice builds listening and transcription skills.
          </p>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Step 1: Choose learning mode</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-muted"></div>
              <span>Step 2: Practice & learn</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-muted"></div>
              <span>Step 3: Complete exercise</span>
            </div>
          </div>
          
          {loadingAnalysisCheck && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="flex items-center gap-2 mt-3 text-sm font-medium text-primary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Checking for existing analysis...
            </motion.div>}
        </div>
      </div>

      {/* Learning Options Grid with Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Reading Analysis Option */}
        <motion.div whileHover={{
        scale: 1.02,
        y: -2
      }} whileTap={{
        scale: 0.98
      }} transition={{
        duration: 0.2
      }} className="group relative">
          {/* Recommended Badge */}
          {recommendation.action === 'analysis' && analysisAllowed && <motion.div initial={{
          scale: 0,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} transition={{
          delay: 0.3
        }} className="absolute -top-2 -right-2 z-10">
              <Badge className="bg-green-500 text-white shadow-lg">
                Recommended
              </Badge>
            </motion.div>}
          
          <Card className={`border-2 overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:bg-muted/5 ${analysisAllowed ? 'border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10' : 'border-muted/50 bg-muted/20'} ${recommendation.action === 'analysis' && analysisAllowed ? 'ring-2 ring-primary/20' : ''}`}>
            <CardContent className="p-0">
              <Button onClick={handleReadingAnalysisClick} variant="ghost" disabled={!analysisAllowed || loadingAnalysisCheck} className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent hover:bg-transparent" data-gtm-cta-type="start_exercise" data-gtm-cta-location="learning_options_menu" data-gtm-cta-text="Reading Analysis" aria-label={`Start Reading Analysis for ${exerciseTitle}. ${analysisAllowed ? 'Available' : 'Requires upgrade'}`}>
                <div className="flex flex-col items-center text-center space-y-4 w-full">
                  {/* Icon with enhanced design */}
                  <div className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${analysisAllowed ? 'bg-primary/15 group-hover:bg-primary/25' : 'bg-muted/30'}`}>
                    <Search className={`h-7 w-7 ${analysisAllowed ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-3 w-full">
                    <div className={`font-semibold text-xl ${analysisAllowed ? 'text-primary' : 'text-muted-foreground'}`}>
                      🔍 Reading Analysis
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed px-2">
                      Explore vocabulary and grammar with AI explanations
                    </p>
                    
                    {/* Features list */}
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary"></div>
                        <span>Vocabulary explanations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary"></div>
                        <span>Grammar insights</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary"></div>
                        <span>Cultural context</span>
                      </div>
                    </div>
                    
                    {/* Time estimate */}
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-2">
                      <Clock className="h-3 w-3" />
                      <span>~5-10 minutes</span>
                    </div>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dictation Practice Option */}
        <motion.div whileHover={{
        scale: 1.02,
        y: -2
      }} whileTap={{
        scale: 0.98
      }} transition={{
        duration: 0.2
      }} className="group relative">
          {/* Recommended Badge */}
          {recommendation.action === 'dictation' && <motion.div initial={{
          scale: 0,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} transition={{
          delay: 0.3
        }} className="absolute -top-2 -right-2 z-10">
              <Badge className="bg-green-500 text-white shadow-lg">
                Recommended
              </Badge>
            </motion.div>}
          
          <Card className={`border-2 overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:bg-muted/5 bg-gradient-to-br from-muted/20 to-muted/30 border-muted hover:border-muted/60 ${recommendation.action === 'dictation' ? 'ring-2 ring-primary/20' : ''}`}>
            <CardContent className="p-0">
              <Button onClick={handleDictationClick} variant="ghost" className="h-auto py-8 px-6 w-full rounded-none border-0 flex flex-col items-center justify-center text-left bg-transparent hover:bg-transparent" data-gtm-cta-type="start_exercise" data-gtm-cta-location="learning_options_menu" data-gtm-cta-text="Dictation Practice" aria-label={`Start Dictation Practice for ${exerciseTitle}`}>
                <div className="flex flex-col items-center text-center space-y-4 w-full">
                  {/* Icon with enhanced design */}
                  <div className="flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 bg-muted/40 group-hover:bg-muted/60">
                    <Headphones className="h-7 w-7 text-foreground" />
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-3 w-full">
                    <div className="font-semibold text-xl text-foreground">🎧 Dictation Practice</div>
                    <p className="text-sm text-muted-foreground leading-relaxed px-2">
                      Practice listening and transcription skills with audio
                    </p>
                    
                    {/* Features list */}
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                        <span>Audio playback control</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                        <span>Real-time feedback</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                        <span>Accuracy scoring</span>
                      </div>
                    </div>
                    
                    {/* Time estimate and difficulty */}
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>~10-15 minutes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Social Proof Section */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.4
    }} className="flex items-center justify-center gap-6 pt-6 text-sm text-muted-foreground">
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

      {/* Upgrade Banner for Free Users */}
      {!analysisAllowed && !isSubscribed && <motion.div initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3,
      delay: 0.5
    }} className="bg-amber-50 border-2 border-amber-200 text-amber-800 p-6 rounded-lg mt-6 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-medium text-base mb-2">Reading Analysis Limit Reached</p>
              <p className="text-sm mb-3 leading-relaxed">
                You've used all 5 free Reading Analyses. Upgrade to premium for unlimited access to vocabulary 
                explanations, grammar insights, and cultural context.
              </p>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 rounded-full font-medium">
                  ✨ Premium Feature
                </span>
                <span>Unlimited analyses • Priority support • Advanced features</span>
              </div>
            </div>
          </div>
        </motion.div>}
    </div>;
};
export default LearningOptionsMenu;