
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, Play, Plus, Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Exercise } from '@/types';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

interface LessonItemProps {
  lessonNumber: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  completionCount: number;
  isLocked?: boolean;
  onPractice: () => void;
  onAdd: () => void;
  exercise?: Exercise; // The actual exercise data for opening modal
}

const LessonItem: React.FC<LessonItemProps> = ({
  lessonNumber,
  title,
  description,
  status,
  completionCount,
  isLocked = false,
  onPractice,
  onAdd,
  exercise
}) => {
  const { canAddMoreDefaultExercises, userDefaultExerciseCount, defaultExerciseLimit } = useExerciseContext();
  const { subscription } = useSubscription();
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in-progress';
  const isNotStarted = status === 'not-started';
  
  // Check if this lesson is blocked due to default exercise limit
  const isBlockedByLimit = isNotStarted && !canAddMoreDefaultExercises && !subscription.isSubscribed;
  
  // Determine the appropriate status icon and color
  const StatusIcon = () => {
    if (isCompleted) return <Check className="h-4 w-4" />;
    if (isLocked) return <Lock className="h-4 w-4" />;
    if (isBlockedByLimit) return <Crown className="h-4 w-4" />;
    return <Unlock className="h-4 w-4" />;
  };

  const handleAddClick = () => {
    if (isBlockedByLimit) {
      toast.error(`You've reached the limit of ${defaultExerciseLimit} learning plan exercises. Upgrade to premium for unlimited access.`);
      return;
    }
    onAdd();
  };
  
  return (
    <div className={cn(
      "border rounded-md p-3",
      isCompleted ? "border-green-200 bg-green-50/50" : 
      isInProgress ? "border-blue-200 bg-blue-50/50" : 
      isBlockedByLimit ? "border-amber-200 bg-amber-50/50" :
      "border-gray-200",
      (isLocked || isBlockedByLimit) && "opacity-70"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center",
          isCompleted ? "bg-green-100 text-green-700" : 
          isLocked ? "bg-gray-100 text-gray-500" : 
          isBlockedByLimit ? "bg-amber-100 text-amber-700" :
          "bg-blue-100 text-blue-700"
        )}>
          <StatusIcon />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-semibold">
                Lesson {lessonNumber} — {title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
              
              {/* Show limitation message for blocked lessons */}
              {isBlockedByLimit && (
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  Premium required ({userDefaultExerciseCount}/{defaultExerciseLimit} lessons used)
                </p>
              )}
            </div>
            
            <div className="flex items-center ml-2">
              {isCompleted ? (
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={onPractice}>
                  <Play className="h-3.5 w-3.5" />
                  <span className="text-xs">Review</span>
                </Button>
              ) : isInProgress ? (
                <Button size="sm" variant="default" className="h-8 gap-1" onClick={onPractice}>
                  <Play className="h-3.5 w-3.5" />
                  <span className="text-xs">Continue ({completionCount}/3)</span>
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant={isBlockedByLimit ? "outline" : "default"}
                  className={cn(
                    "h-8 gap-1",
                    isBlockedByLimit && "border-amber-200 text-amber-700 hover:bg-amber-50"
                  )}
                  onClick={handleAddClick}
                  disabled={isLocked}
                >
                  {isBlockedByLimit ? (
                    <>
                      <Crown className="h-3.5 w-3.5" />
                      <span className="text-xs">Premium</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span className="text-xs">Start</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {isInProgress && (
            <div className="mt-2 flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i < completionCount ? "bg-primary" : "bg-gray-200"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonItem;
