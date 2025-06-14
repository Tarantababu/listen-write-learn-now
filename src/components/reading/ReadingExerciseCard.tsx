
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Volume2, Brain, Play, Trash2 } from 'lucide-react';
import { ReadingExercise } from '@/types/reading';

interface ReadingExerciseCardProps {
  exercise: ReadingExercise;
  progress?: number;
  onPractice: (exercise: ReadingExercise) => void;
  onDelete: (exercise: ReadingExercise) => void;
}

export const ReadingExerciseCard: React.FC<ReadingExerciseCardProps> = ({
  exercise,
  progress = 0,
  onPractice,
  onDelete
}) => {
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
    <Card className="h-full hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{exercise.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              Topic: {exercise.topic}
              {exercise.grammar_focus && ` • Focus: ${exercise.grammar_focus}`}
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={`${getDifficultyColor(exercise.difficulty_level)} text-xs shrink-0 capitalize`}
          >
            {exercise.difficulty_level}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Exercise Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <BookOpen className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {exercise.content.sentences?.length || 0} sentences
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Clock className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              ~{estimatedReadingTime} min
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Brain className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {exercise.content.analysis?.wordCount || exercise.target_length} words
            </p>
          </div>
        </div>

        {/* Progress */}
        {progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Features */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Volume2 className="h-3 w-3" />
          <span>Audio available</span>
          <span>•</span>
          <Brain className="h-3 w-3" />
          <span>Word analysis</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={() => onPractice(exercise)}
            className="flex-1"
            size="sm"
          >
            <Play className="h-3 w-3 mr-1" />
            {progress > 0 ? 'Continue' : 'Start'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(exercise)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
