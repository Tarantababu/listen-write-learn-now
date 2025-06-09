import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Exercise } from '@/types';
import { BookOpenCheck, Edit, Trash2, CheckCircle, FolderInput, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { format } from 'date-fns';
import { getLanguageFlag } from '@/utils/languageUtils';
interface ExerciseCardProps {
  exercise: Exercise;
  onPractice: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  canEdit?: boolean;
  canMove?: boolean; // New prop to control move functionality visibility
}
const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onPractice,
  onEdit,
  onDelete,
  onMove,
  canEdit = true,
  canMove = true // Default to true so all users can move exercises
}) => {
  const {
    settings
  } = useUserSettingsContext();

  // Format the date
  const formattedDate = format(new Date(exercise.createdAt), 'MMM d, yyyy');

  // Truncate text if it's too long
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get language flag
  const languageFlag = getLanguageFlag(exercise.language);
  return <Card className={cn("overflow-hidden h-full flex flex-col transition-all", exercise.isCompleted && "border-green-500/30 bg-green-50/30 dark:bg-green-950/10")}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg line-clamp-1">
              {truncateText(exercise.title, 50)}
            </CardTitle>
            {exercise.isCompleted && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
          </div>
          <div className="text-lg" title={exercise.language}>
            {languageFlag}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <p className="text-sm text-muted-foreground line-clamp-4 mb-3">
          {truncateText(exercise.text, 200)}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {exercise.tags?.length > 0 && exercise.tags.slice(0, 3).map((tag, index) => <Badge key={index} variant="secondary" className="text-xs py-0">
              {truncateText(tag, 15)}
            </Badge>)}
          {exercise.tags?.length > 3 && <Badge variant="outline" className="text-xs py-0">
              +{exercise.tags.length - 3} more
            </Badge>}
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground mt-3">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{formattedDate}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="default" size="sm" onClick={onPractice}>
          <BookOpenCheck className="h-4 w-4 mr-2" />
          Practice
        </Button>
        <div className="flex gap-1">
          {onMove && canMove}
          {onEdit && canEdit && <Button variant="outline" size="icon" onClick={onEdit} className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>}
          {onDelete && <Button variant="outline" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>}
        </div>
      </CardFooter>
    </Card>;
};
export default ExerciseCard;