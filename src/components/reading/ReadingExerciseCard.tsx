
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Volume2, Brain, Play, Trash2, Edit } from 'lucide-react';
import { ReadingExercise } from '@/types/reading';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReadingExerciseCardProps {
  exercise: ReadingExercise;
  progress?: number;
  onPractice: (exercise: ReadingExercise) => void;
  onDelete: (exercise: ReadingExercise) => void;
  onEdit?: (exercise: ReadingExercise) => void;
}

export const ReadingExerciseCard: React.FC<ReadingExerciseCardProps> = ({
  exercise,
  progress = 0,
  onPractice,
  onDelete,
  onEdit
}) => {
  const isMobile = useIsMobile();

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const estimatedReadingTime = Math.ceil((exercise.content.analysis?.wordCount || exercise.target_length) / 200);

  return (
    <Card className={`h-full hover:shadow-md transition-all duration-200 ${isMobile ? 'touch-manipulation' : ''}`}>
      <CardHeader className={isMobile ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className={`truncate ${isMobile ? 'text-sm' : 'text-base'}`}>
              {exercise.title}
            </CardTitle>
            <CardDescription className={`line-clamp-2 mt-1 ${isMobile ? 'text-xs' : ''}`}>
              Topic: {exercise.topic}
              {exercise.grammar_focus && ` • Focus: ${exercise.grammar_focus}`}
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={`${getDifficultyColor(exercise.difficulty_level)} shrink-0 capitalize ${isMobile ? 'text-xs' : 'text-xs'}`}
          >
            {exercise.difficulty_level}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={`space-y-4 ${isMobile ? 'space-y-3' : ''}`}>
        {/* Exercise Stats */}
        <div className={`grid grid-cols-3 gap-3 text-center ${isMobile ? 'gap-2' : ''}`}>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <BookOpen className={`text-muted-foreground ${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
            </div>
            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
              {exercise.content.sentences?.length || 0} sentences
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Clock className={`text-muted-foreground ${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
            </div>
            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
              ~{estimatedReadingTime} min
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Brain className={`text-muted-foreground ${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
            </div>
            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
              {exercise.content.analysis?.wordCount || exercise.target_length} words
            </p>
          </div>
        </div>

        {/* Progress */}
        {progress > 0 && (
          <div className="space-y-2">
            <div className={`flex justify-between text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Features */}
        <div className={`flex items-center gap-2 text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
          <Volume2 className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
          <span>Interactive audio</span>
          <span>•</span>
          <Brain className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
          <span>Clickable words</span>
        </div>

        {/* Actions */}
        <div className={`flex gap-2 pt-2 ${isMobile ? 'flex-col' : ''}`}>
          <Button 
            onClick={() => onPractice(exercise)}
            className={`${isMobile ? 'w-full py-3' : 'flex-1'}`}
            size={isMobile ? 'default' : 'sm'}
          >
            <Play className={`mr-1 ${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
            {progress > 0 ? 'Continue' : 'Start'}
          </Button>
          
          <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
            {onEdit && (
              <Button
                variant="ghost"
                size={isMobile ? 'default' : 'sm'}
                onClick={() => onEdit(exercise)}
                className={`text-muted-foreground hover:text-primary ${isMobile ? 'flex-1 py-3' : ''}`}
              >
                <Edit className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                {isMobile && <span className="ml-2">Edit</span>}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size={isMobile ? 'default' : 'sm'}
              onClick={() => onDelete(exercise)}
              className={`text-muted-foreground hover:text-destructive ${isMobile ? 'flex-1 py-3' : ''}`}
            >
              <Trash2 className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
              {isMobile && <span className="ml-2">Delete</span>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
