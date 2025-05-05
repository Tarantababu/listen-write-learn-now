import React, { useState, useEffect } from 'react';
import { Exercise } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Edit, Trash, Play, Check, Move } from 'lucide-react';
import { formatDateTime } from '@/utils/trendUtils';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface ExerciseCardProps {
  exercise: Exercise;
  onPractice: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove?: () => void;
  disableEdit?: boolean;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ 
  exercise, 
  onPractice, 
  onEdit, 
  onDelete,
  onMove,
  disableEdit = false
}) => {
  const { title, text, tags, completionCount, isCompleted, createdAt } = exercise;
  
  // Add state to track progress updates
  const [progressPercentage, setProgressPercentage] = useState(Math.min(100, (completionCount / 3) * 100));
  
  // Update progress percentage when exercise changes
  useEffect(() => {
    setProgressPercentage(Math.min(100, (completionCount / 3) * 100));
  }, [completionCount]);
  
  // Truncate text for display
  const truncatedText = text.length > 100 ? `${text.substring(0, 100)}...` : text;
  
  return (
    <Card className={`h-full flex flex-col transition-all ${isCompleted ? 'border-primary/30 shadow-sm' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium flex items-center gap-1">
            {title}
            {isCompleted && <Check className="h-4 w-4 text-primary ml-1" />}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Created on {formatDateTime(createdAt)}
        </p>
      </CardHeader>
      <CardContent className="pb-2 flex-1">
        <p className="text-sm text-muted-foreground mb-4">{truncatedText}</p>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-muted text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex flex-col gap-2">
        {/* Progress indicator */}
        <div className="w-full">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{completionCount}/3 completions</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
            indicatorClassName={isCompleted ? "bg-primary" : "bg-primary/70"}
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-between w-full">
          <div className="flex-1">
            <Button
              onClick={onPractice}
              className="w-full"
              size="sm"
              variant="outline"
            >
              <Play className="h-4 w-4 mr-1" /> Practice
            </Button>
          </div>
          <div className="flex gap-2">
            {onMove && (
              <Button onClick={onMove} size="icon" variant="ghost">
                <Move className="h-4 w-4" />
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onEdit}
                    size="icon"
                    variant="ghost"
                    className={disableEdit ? 'opacity-50 cursor-not-allowed' : ''}
                    disabled={disableEdit}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                {disableEdit && (
                  <TooltipContent>
                    <p>Upgrade to premium to edit exercises</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <Button onClick={onDelete} size="icon" variant="ghost">
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ExerciseCard;
