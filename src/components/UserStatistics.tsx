import React, { useEffect, useState, useMemo } from 'react';
import { format, subDays, isSameDay, subMonths } from 'date-fns';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, BookOpen, CalendarDays, GraduationCap, Target, TrendingUp, Sparkles, ArrowRight, Play, Plus, X, HelpCircle, Compass, Zap, Info } from 'lucide-react';
import StatsCard from './StatsCard';
import StatsHeatmap from './StatsHeatmap';
import { getUserLevel, getLevelProgress } from '@/utils/levelSystem';
import LanguageLevelDisplay from './LanguageLevelDisplay';
import { compareWithPreviousDay } from '@/utils/trendUtils';
import SkeletonUserStats from './SkeletonUserStats';
import { useDelayedLoading } from '@/hooks/use-delayed-loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import { useCurriculumExercises } from '@/hooks/use-curriculum-exercises';
import { isStreakActive } from '@/utils/visitorTracking';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ... (keeping all existing interfaces and component structure)

const UserStatistics: React.FC = () => {
  // ... (keeping all existing state and hooks)

  // NEW: Enhanced guidance banner component
  const renderGuidanceBanner = () => {
    const bannerVariant = isFirstTimeUser ? 'primary' : 'secondary';
    
    if (isFirstTimeUser) {
      return (
        <Alert className="border-2 border-[#6F6BF2]/30 bg-gradient-to-r from-[#6F6BF2]/10 via-[#491BF2]/5 to-[#AB96D9]/10 shadow-lg">
          <Compass className="h-5 w-5 text-[#491BF2]" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-[#1F0459] text-base sm:text-lg">
                🎯 Ready to start your language journey?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We'll help you choose the perfect learning path based on your goals and experience level.
              </p>
            </div>
            <Button 
              onClick={() => setShowStartModal(true)}
              className="bg-gradient-to-r from-[#491BF2] to-[#6D49F2] hover:from-[#6D49F2] hover:to-[#6F6BF2] text-white shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
            >
              <Zap className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border border-[#AB96D9]/30 bg-gradient-to-r from-[#AB96D9]/5 to-[#6F6BF2]/5">
        <Info className="h-4 w-4 text-[#491BF2]" />
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <h3 className="font-medium text-[#1F0459]">
              Need help deciding what to practice next?
            </h3>
            <p className="text-sm text-muted-foreground">
              Get personalized recommendations for your learning journey.
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={() => setShowStartModal(true)}
            className="border-[#491BF2]/30 hover:border-[#491BF2]/50 hover:bg-[#6F6BF2]/10 text-[#1F0459] whitespace-nowrap"
          >
            <Compass className="h-4 w-4 mr-2" />
            Get Guidance
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  // ENHANCED: Better modal content with clearer next steps
  const renderEnhancedModal = () => (
    <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] w-full mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-[#1F0459]">
            <Sparkles className="h-5 w-5 text-[#491BF2]" />
            {isFirstTimeUser ? "Welcome! Let's Get You Started" : "Choose Your Next Steps"}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {isFirstTimeUser 
              ? "We've designed two paths to help you succeed. Choose the one that fits your learning style:"
              : "Here are the best ways to continue your language learning journey:"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {/* Structured Learning Path */}
          <div 
            onClick={handleStartLearningPlan}
            className="p-4 border-2 border-[#6F6BF2]/30 rounded-lg hover:border-[#491BF2]/50 hover:bg-[#6F6BF2]/5 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-[#491BF2]/20 to-[#6D49F2]/20 rounded-lg group-hover:from-[#491BF2]/30 group-hover:to-[#6D49F2]/30 transition-all">
                <GraduationCap className="h-6 w-6 text-[#491BF2]" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1 text-[#1F0459]">
                      {isFirstTimeUser ? "📚 Guided Learning Plan" : "📚 Continue Learning Plan"}
                    </h3>
                    <div className="space-y-2 mb-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isFirstTimeUser 
                          ? "Perfect for beginners! Follow our step-by-step curriculum designed by language experts."
                          : "Continue with your structured path and track your progress."
                        }
                      </p>
                      {isFirstTimeUser && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-[#6F6BF2]/10 text-[#491BF2] px-2 py-1 rounded-full">✓ Structured</span>
                          <span className="bg-[#6F6BF2]/10 text-[#491BF2] px-2 py-1 rounded-full">✓ Progressive</span>
                          <span className="bg-[#6F6BF2]/10 text-[#491BF2] px-2 py-1 rounded-full">✓ Expert-designed</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#491BF2]">
                      {isFirstTimeUser ? "Recommended for beginners →" : "Continue where you left off →"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Exercise Path */}
          <div 
            onClick={handleCreateOwnExercise}
            className="p-4 border-2 border-muted hover:border-[#491BF2]/40 hover:bg-[#6F6BF2]/5 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-muted group-hover:bg-[#491BF2]/20 rounded-lg transition-all">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-[#491BF2] transition-colors" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1 text-[#1F0459]">
                      🎯 Create Custom Exercise
                    </h3>
                    <div className="space-y-2 mb-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isFirstTimeUser 
                          ? "Jump right in! Create exercises with your own content or specific topics you want to practice."
                          : "Add personalized exercises to supplement your learning plan."
                        }
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full">✓ Flexible</span>
                        <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full">✓ Personalized</span>
                        <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full">✓ Your content</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {isFirstTimeUser ? "Great for self-directed learners →" : "Add to your routine →"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional helpful tip for first-time users */}
          {isFirstTimeUser && (
            <div className="mt-6 p-3 bg-[#AB96D9]/10 rounded-lg border border-[#AB96D9]/30">
              <p className="text-sm text-[#1F0459] text-center">
                💡 <strong>New to language learning?</strong> Start with the Guided Learning Plan. 
                You can always create custom exercises later!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  if (showLoading) {
    return <SkeletonUserStats />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F0459] leading-tight">
          {isFirstTimeUser ? "Welcome to Your Language Journey" : "Your Learning Journey"}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {isFirstTimeUser 
            ? "Let's get you started on the path to language mastery" 
            : "Track your progress and continue building your language skills"
          }
        </p>
      </div>
      
      {/* PROMINENT GUIDANCE BANNER - Always visible at top */}
      {renderGuidanceBanner()}
      
      {/* Conditional Language Level Display - only show for existing users */}
      {hasStartedLearning && <LanguageLevelDisplay masteredWords={totalMasteredWords} />}
      
      {/* Learning Plan Progress Card - Adaptive based on user status */}
      {isFirstTimeUser ? renderFirstTimeUserCard() : renderExistingUserCard()}

      {/* Enhanced Start Modal */}
      {renderEnhancedModal()}
    </div>
  );
};

export default UserStatistics;