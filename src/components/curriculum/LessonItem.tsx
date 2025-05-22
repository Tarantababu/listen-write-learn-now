
import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, Play, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonItemProps {
  lessonNumber: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  completionCount: number;
  isLocked?: boolean;
  onPractice: () => void;
  onAdd: () => void;
}

const LessonItem: React.FC<LessonItemProps> = ({
  lessonNumber,
  title,
  description,
  status,
  completionCount,
  isLocked = false,
  onPractice,
  onAdd
}) => {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in-progress';
  
  // Determine the appropriate status icon and color
  const StatusIcon = () => {
    if (isCompleted) return <Check className="h-4 w-4" />;
    if (isLocked) return <Lock className="h-4 w-4" />;
    return <Unlock className="h-4 w-4" />;
  };
  
  return (
    <div className={cn(
      "border rounded-md p-3",
      isCompleted ? "border-green-200 bg-green-50/50" : 
      isInProgress ? "border-blue-200 bg-blue-50/50" : 
      "border-gray-200",
      isLocked && "opacity-70"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center",
          isCompleted ? "bg-green-100 text-green-700" : 
          isLocked ? "bg-gray-100 text-gray-500" : 
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
                  variant="default" 
                  className="h-8 gap-1" 
                  onClick={onAdd}
                  disabled={isLocked}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs">Start</span>
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
