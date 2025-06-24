
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Edit, Trash2, Archive, Move } from 'lucide-react';

interface ShadowingExercise {
  id: string;
  title: string;
  difficulty_level: string;
  language: string;
  source_type: string;
  custom_text?: string;
  sentences: any[];
  archived: boolean;
  created_at: string;
}

interface ShadowingExerciseCardProps {
  exercise: ShadowingExercise;
  onPractice: (exercise: ShadowingExercise) => void;
  onEdit: (exercise: ShadowingExercise) => void;
  onDelete: (exercise: ShadowingExercise) => void;
  onMove?: (exercise: ShadowingExercise) => void;
  canEdit?: boolean;
}

const ShadowingExerciseCard: React.FC<ShadowingExerciseCardProps> = ({
  exercise,
  onPractice,
  onEdit,
  onDelete,
  onMove,
  canEdit = true
}) => {
  const sentenceCount = Array.isArray(exercise.sentences) ? exercise.sentences.length : 0;

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {exercise.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {exercise.source_type === 'custom' ? 'Custom Text' : 'From Reading Exercise'}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1 ml-2">
            <Badge variant="secondary" className="text-xs">
              {exercise.difficulty_level}
            </Badge>
            {exercise.archived && (
              <Badge variant="outline" className="text-xs">
                Archived
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 space-y-2">
          <div className="text-sm text-muted-foreground">
            {sentenceCount} sentence{sentenceCount !== 1 ? 's' : ''}
          </div>
          
          {exercise.custom_text && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {exercise.custom_text.substring(0, 100)}...
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            size="sm"
            onClick={() => onPractice(exercise)}
            className="flex items-center gap-1"
          >
            <Play className="h-3 w-3" />
            Practice
          </Button>

          {canEdit && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(exercise)}
                className="flex items-center gap-1"
              >
                <Edit className="h-3 w-3" />
                Edit
              </Button>

              {onMove && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMove(exercise)}
                  className="flex items-center gap-1"
                >
                  <Move className="h-3 w-3" />
                  Move
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(exercise)}
                className="flex items-center gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShadowingExerciseCard;
