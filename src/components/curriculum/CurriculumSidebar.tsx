
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, BookOpen, Crown, Zap, Star } from 'lucide-react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getRemainingDefaultExercises } from '@/utils/defaultExerciseUtils';
import { Link } from 'react-router-dom';

interface CurriculumSidebarProps {
  totalLessons: number;
  completedLessons: number;
  language: string;
}

const CurriculumSidebar: React.FC<CurriculumSidebarProps> = ({
  totalLessons,
  completedLessons,
  language
}) => {
  const { userDefaultExerciseCount, defaultExerciseLimit } = useExerciseContext();
  const { subscription } = useSubscription();
  
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const remainingLessons = getRemainingDefaultExercises(
    userDefaultExerciseCount, 
    subscription.isSubscribed, 
    defaultExerciseLimit
  );

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Lessons Completed</span>
              <span className="font-medium">{completedLessons}/{totalLessons}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progressPercentage.toFixed(1)}% of {language} curriculum complete
            </p>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Course Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-green-50 rounded-lg p-2">
                <div className="text-lg font-bold text-green-700">{completedLessons}</div>
                <div className="text-xs text-green-600">Completed</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <div className="text-lg font-bold text-blue-700">{totalLessons - completedLessons}</div>
                <div className="text-xs text-blue-600">Remaining</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Plan Access */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Learning Plan Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.isSubscribed ? (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Crown className="h-5 w-5" />
                <span className="font-semibold">Premium Access</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Unlimited access to all learning plan exercises
              </p>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                ∞ Lessons Available
              </Badge>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{remainingLessons}</div>
                <p className="text-sm text-muted-foreground">
                  lessons remaining in your free plan
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used</span>
                  <span className="font-medium">{userDefaultExerciseCount}/{defaultExerciseLimit}</span>
                </div>
                <Progress 
                  value={(userDefaultExerciseCount / defaultExerciseLimit) * 100} 
                  className="h-2" 
                />
              </div>

              {remainingLessons <= 3 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-700 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Running Low</span>
                  </div>
                  <p className="text-xs text-amber-600">
                    You're almost at your limit. Upgrade to continue learning!
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Prompt for Free Users */}
      {!subscription.isSubscribed && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Unlock More Learning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span>Unlimited learning plan access</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span>Create unlimited exercises</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span>Advanced learning features</span>
              </div>
            </div>
            
            <Button asChild className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary">
              <Link to="/dashboard/subscription">
                Upgrade to Premium
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">💡 Study Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Complete lessons in order for best results</li>
            <li>• Practice each lesson 3 times to master it</li>
            <li>• Review completed lessons regularly</li>
            <li>• Take breaks between study sessions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurriculumSidebar;
