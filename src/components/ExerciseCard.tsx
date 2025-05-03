
import React from 'react';
import { Exercise } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Edit, Trash, Play } from 'lucide-react';
import LevelBadge from './LevelBadge';
import { formatDateTime } from '@/utils/trendUtils';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExerciseCardProps {
  exercise: Exercise;
  onPractice: () => void;
  onEdit: () => void;
  onDelete: () => void;
  disableEdit?: boolean;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ 
  exercise, 
  onPractice, 
  onEdit, 
  onDelete,
  disableEdit = false
}) => {
  const { title, text, tags, completionCount, isCompleted, createdAt } = exercise;
  
  // Truncate text for display
  const truncatedText = text.length > 100 ? `${text.substring(0, 100)}...` : text;
  
  return (
    <Card className={`h-full flex flex-col transition-all ${isCompleted ? 'border-primary/30 shadow-sm' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">
            {title}
          </CardTitle>
          <LevelBadge masteredWords={completionCount} />
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
      <CardFooter className="pt-2 flex justify-between gap-2">
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
      </CardFooter>
    </Card>
  );
};

export default ExerciseCard;
