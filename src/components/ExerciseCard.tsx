import React, { useState } from 'react';
import { Exercise } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Edit, 
  Trash2, 
  Move, 
  Archive,
  CheckCircle,
  Target,
  Calendar,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import LearningOptionsMenu from '@/components/exercises/LearningOptionsMenu';

interface ExerciseCardProps {
  exercise: Exercise;
  onPractice: (exercise: Exercise) => void;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exercise: Exercise) => void;
  onMove?: (exercise: Exercise) => void;
  onToggleArchive?: (exercise: Exercise) => void;
  audioProgress?: {
    isGenerating: boolean;
    progress: number;
    estimatedTimeRemaining: number;
    stage: 'initializing' | 'processing' | 'uploading' | 'finalizing' | 'complete';
    startProgress: () => void;
    completeProgress: () => void;
    resetProgress: () => void;
  };
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onPractice,
  onEdit,
  onDelete,
  onMove,
  onToggleArchive,
  audioProgress
}) => {
  const [showLearningOptions, setShowLearningOptions] = useState(false);

  const handleStartDictation = () => {
    setShowLearningOptions(false);
    onPractice(exercise);
  };

  const handleStartReadingAnalysis = () => {
    setShowLearningOptions(false);
    // This would trigger reading analysis mode
    // For now, we'll use the same practice function
    onPractice(exercise);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getCompletionStatus = () => {
    if (exercise.isCompleted) {
      return { icon: CheckCircle, color: 'text-green-600', label: 'Completed' };
    }
    if (exercise.completionCount > 0) {
      return { icon: Target, color: 'text-yellow-600', label: `${exercise.completionCount}/3` };
    }
    return { icon: Play, color: 'text-blue-600', label: 'Start' };
  };

  const status = getCompletionStatus();
  const StatusIcon = status.icon;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold mb-1 line-clamp-2">
                {exercise.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(exercise.createdAt, 'MMM d, yyyy')}</span>
              </div>
            </div>
            
            {(onEdit || onDelete || onMove || onToggleArchive) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <div className="h-4 w-4 flex flex-col justify-center">
                      <div className="w-1 h-1 bg-current rounded-full mb-0.5"></div>
                      <div className="w-1 h-1 bg-current rounded-full mb-0.5"></div>
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(exercise)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onMove && (
                    <DropdownMenuItem onClick={() => onMove(exercise)}>
                      <Move className="mr-2 h-4 w-4" />
                      Move
                    </DropdownMenuItem>
                  )}
                  {onToggleArchive && (
                    <DropdownMenuItem onClick={() => onToggleArchive(exercise)}>
                      <Archive className="mr-2 h-4 w-4" />
                      {exercise.archived ? 'Unarchive' : 'Archive'}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(exercise)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {truncateText(exercise.text)}
          </CardDescription>
          
          {/* Tags */}
          {exercise.tags && exercise.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {exercise.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {exercise.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{exercise.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          {/* Action Button */}
          <Button 
            onClick={() => setShowLearningOptions(true)}
            className="w-full"
            variant={exercise.isCompleted ? "secondary" : "default"}
          >
            <StatusIcon className={`mr-2 h-4 w-4 ${status.color}`} />
            {status.label}
          </Button>
        </CardContent>
      </Card>

      {/* Learning Options Dialog */}
      <Dialog open={showLearningOptions} onOpenChange={setShowLearningOptions}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Choose Learning Method</DialogTitle>
            <DialogDescription>
              Select how you want to practice this exercise
            </DialogDescription>
          </DialogHeader>
          <LearningOptionsMenu
            onStartReadingAnalysis={handleStartReadingAnalysis}
            onStartDictation={handleStartDictation}
            exerciseTitle={exercise.title}
            audioProgress={audioProgress}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
