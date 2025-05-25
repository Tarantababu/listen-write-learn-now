// Enhanced UserStatistics component with improved guidance system

import React, { useEffect, useState, useMemo } from 'react';
import { format, subDays, isSameDay, subMonths } from 'date-fns';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useVocabularyContext } from '@/contexts/VocabularyContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Trophy, BookOpen, CalendarDays, GraduationCap, Target, TrendingUp, 
  Sparkles, ArrowRight, Play, Plus, X, HelpCircle, Compass, 
  CheckCircle, Clock, Star, Zap
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

// ... (keep all existing interfaces and component setup)

const UserStatistics: React.FC = () => {
  // ... (keep all existing state and hooks)

  // Enhanced guidance logic
  const getGuidanceRecommendation = () => {
    if (isFirstTimeUser) {
      return {
        title: "Start Your Journey",
        description: "Begin with our structured learning plan",
        action: "Start Learning",
        priority: "high",
        icon: Sparkles
      };
    }
    
    if (stats.inProgress > 0) {
      return {
        title: "Continue Learning",
        description: `You have ${stats.inProgress} exercises in progress`,
        action: "Continue",
        priority: "medium",
        icon: Play
      };
    }
    
    if (streakData.currentStreak === 0 && streakData.longestStreak > 0) {
      return {
        title: "Rebuild Your Streak",
        description: "Get back on track with daily practice",
        action: "Practice Now",
        priority: "high",
        icon: Zap
      };
    }
    
    if (stats.completed > 0 && stats.completed < stats.total) {
      return {
        title: "Keep Going",
        description: `${stats.total - stats.completed} exercises remaining`,
        action: "Continue Plan",
        priority: "medium",
        icon: Target
      };
    }
    
    return {
      title: "Explore More",
      description: "Create custom exercises or review completed ones",
      action: "Explore",
      priority: "low",
      icon: Compass
    };
  };

  const guidance = getGuidanceRecommendation();

  // Enhanced Guidance Banner Component
  const renderGuidanceBanner = () => {
    const IconComponent = guidance.icon;
    const priorityColors = {
      high: "from-[#491BF2] to-[#6D49F2]",
      medium: "from-[#6F6BF2] to-[#AB96D9]",
      low: "from-[#AB96D9] to-[#D4A5F7]"
    };

    return (
      <Card className={`w-full border-2 bg-gradient-to-r ${priorityColors[guidance.priority]} text-white shadow-lg hover:shadow-xl transition-all duration-300`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="p-2 sm:p-3 bg-white/20 rounded-full flex-shrink-0">
                <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg mb-1 leading-tight">
                  {guidance.title}
                </h3>
                <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                  {guidance.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-4">
              <Button 
                onClick={() => setShowStartModal(true)}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 font-semibold px-3 sm:px-4 py-2 h-auto"
              >
                <span className="hidden sm:inline">{guidance.action}</span>
                <ArrowRight className="h-4 w-4 sm:ml-2" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 p-1"
                onClick={() => {/* Add dismiss functionality if needed */}}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Quick Actions Component
  const renderQuickActions = () => {
    const actions = [
      {
        icon: Play,
        label: "Continue Learning",
        description: "Resume your current exercises",
        action: () => navigate('/dashboard/curriculum'),
        show: stats.inProgress > 0,
        color: "bg-[#491BF2]"
      },
      {
        icon: Plus,
        label: "Create Exercise",
        description: "Build custom practice",
        action: () => navigate('/dashboard/exercises'),
        show: true,
        color: "bg-[#6D49F2]"
      },
      {
        icon: BookOpen,
        label: "Review Words",
        description: "Study vocabulary",
        action: () => navigate('/dashboard/vocabulary'),
        show: totalMasteredWords > 0,
        color: "bg-[#6F6BF2]"
      },
      {
        icon: Trophy,
        label: "View Progress",
        description: "Check achievements",
        action: () => navigate('/dashboard/statistics'),
        show: stats.completed > 0,
        color: "bg-[#AB96D9]"
      }
    ].filter(action => action.show);

    if (actions.length === 0) return null;

    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#1F0459]">
            <Compass className="h-5 w-5 text-[#491BF2]" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {actions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-3 flex-col gap-2 hover:bg-[#6F6BF2]/10 hover:border-[#491BF2]/40 transition-all duration-200"
                  onClick={action.action}
                >
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-xs leading-tight">{action.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                      {action.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Enhanced Start Modal with better guidance
  const renderEnhancedStartModal = () => (
    <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
      <DialogContent className="sm:max-w-lg max-w-[90vw] w-full mx-4 sm:mx-auto rounded-lg">
        <DialogHeader className="px-1 sm:px-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl text-[#1F0459] leading-tight">
            <Compass className="h-5 w-5 text-[#491BF2] flex-shrink-0" />
            Your Learning Path
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base leading-relaxed">
            {guidance.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {/* Recommended Action - Highlighted */}
          <div className="p-4 bg-gradient-to-r from-[#491BF2]/10 to-[#6D49F2]/10 border-2 border-[#491BF2]/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Badge className="bg-[#491BF2] text-white text-xs px-2 py-1 mb-2">
                Recommended
              </Badge>
            </div>
            <div 
              onClick={handleStartLearningPlan}
              className="cursor-pointer hover:bg-[#6F6BF2]/5 p-2 -m-2 rounded-lg transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#491BF2]/20 rounded-lg group-hover:bg-[#491BF2]/30 transition-colors flex-shrink-0">
                  <Play className="h-5 w-5 text-[#491BF2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 text-[#1F0459] leading-tight">
                    {isFirstTimeUser ? "Start Learning Plan" : "Continue Learning Plan"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    {isFirstTimeUser 
                      ? "Follow our expertly designed curriculum with structured exercises."
                      : "Continue with your structured curriculum and track progress."
                    }
                  </p>
                  {stats.total > 0 && (
                    <div className="flex items-center gap-2 text-xs text-[#491BF2]">
                      <CheckCircle className="h-3 w-3" />
                      {stats.completed} completed • {stats.inProgress} in progress
                    </div>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#491BF2] transition-colors flex-shrink-0 mt-1" />
              </div>
            </div>
          </div>

          {/* Alternative Option */}
          <div 
            onClick={handleCreateOwnExercise}
            className="p-4 border-2 border-muted hover:border-[#491BF2]/40 hover:bg-[#6F6BF2]/5 cursor-pointer transition-all duration-200 group rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-muted group-hover:bg-[#491BF2]/20 rounded-lg transition-colors flex-shrink-0">
                <Plus className="h-5 w-5 text-muted-foreground group-hover:text-[#491BF2] transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1 text-[#1F0459] leading-tight">
                  Create Custom Exercise
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isFirstTimeUser 
                    ? "Jump right in with exercises tailored to your specific needs."
                    : "Create additional exercises to supplement your learning."
                  }
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#491BF2] transition-colors flex-shrink-0 mt-1" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (showLoading) {
    return <SkeletonUserStats />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      {/* Page Header */}
      <div className="space-y-1 sm:space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F0459] leading-tight">
          {isFirstTimeUser ? "Welcome to Your Language Journey" : "Your Learning Dashboard"}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {isFirstTimeUser 
            ? "Let's get you started on the path to language mastery" 
            : "Track your progress and continue building your language skills"
          }
        </p>
      </div>

      {/* Guidance Banner - Always visible at top */}
      {renderGuidanceBanner()}
      
      {/* Language Level Display - only show for existing users */}
      {hasStartedLearning && <LanguageLevelDisplay masteredWords={totalMasteredWords} />}
      
      {/* Quick Actions - Show for existing users */}
      {hasStartedLearning && renderQuickActions()}
      
      {/* Learning Plan Progress Card */}
      {isFirstTimeUser ? renderFirstTimeUserCard() : renderExistingUserCard()}

      {/* Enhanced Start Modal */}
      {renderEnhancedStartModal()}

      {/* Keep existing stats components below */}
      {hasStartedLearning && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatsCard 
              title="Current Streak" 
              value={streak} 
              icon={<Trophy className="h-5 w-5" />}
              trend={compareWithPreviousDay(streak, 0)}
              suffix=" days"
            />
            <StatsCard 
              title="Words Mastered" 
              value={totalMasteredWords} 
              icon={<BookOpen className="h-5 w-5" />}
              trend={null}
            />
            <StatsCard 
              title="Exercises Done" 
              value={completions.length} 
              icon={<CalendarDays className="h-5 w-5" />}
              trend={null}
            />
            <StatsCard 
              title="Learning Level" 
              value={getUserLevel(totalMasteredWords).level} 
              icon={<GraduationCap className="h-5 w-5" />}
              trend={null}
            />
          </div>
          
          <StatsHeatmap 
            dailyActivities={dailyActivities}
            language={currentLanguage}
          />
        </>
      )}
    </div>
  );
};

export default UserStatistics;