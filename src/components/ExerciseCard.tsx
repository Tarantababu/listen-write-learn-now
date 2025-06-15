
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
import { useIsMobile } from '@/hooks/use-mobile';

interface ExerciseCardProps {
  exercise: Exercise;
  onPractice: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  canEdit?: boolean;
  canMove?: boolean;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onPractice,
  onEdit,
  onDelete,
  onMove,
  canEdit = true,
  canMove = true
}) => {
  const { settings } = useUserSettingsContext();
  const isMobile = useIsMobile();

  // Format the date
  const formattedDate = format(new Date(exercise.createdAt), 'MMM d, yyyy');

  // Truncate text if it's too long
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get language flag
  const languageFlag = getLanguageFlag(exercise.language);

  return (
    <Card className={cn(
      "overflow-hidden h-full flex flex-col transition-all",
      exercise.isCompleted && "border-green-500/30 bg-green-50/30 dark:bg-green-950/10",
      isMobile && "mx-2 my-2"
    )}>
      <CardHeader className={isMobile ? "pb-2 px-4 pt-4" : "pb-2"}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <CardTitle className={`line-clamp-1 ${
              isMobile ? 'text-base' : 'text-lg'
            }`}>
              {truncateText(exercise.title, isMobile ? 40 : 50)}
            </CardTitle>
            {exercise.isCompleted && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
          </div>
          <div className="text-lg" title={exercise.language}>
            {languageFlag}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`flex-grow ${isMobile ? 'pb-2 px-4' : 'pb-2'}`}>
        <p className={`text-muted-foreground line-clamp-4 mb-3 ${
          isMobile ? 'text-sm' : 'text-sm'
        }`}>
          {truncateText(exercise.text, isMobile ? 150 : 200)}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {exercise.tags?.length > 0 && exercise.tags.slice(0, isMobile ? 2 : 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs py-0">
              {truncateText(tag, isMobile ? 12 : 15)}
            </Badge>
          ))}
          {exercise.tags?.length > (isMobile ? 2 : 3) && (
            <Badge variant="outline" className="text-xs py-0">
              +{exercise.tags.length - (isMobile ? 2 : 3)} more
            </Badge>
          )}
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground mt-3">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{formattedDate}</span>
        </div>
      </CardContent>
      
      <CardFooter className={`flex justify-between pt-2 ${
        isMobile ? 'px-4 pb-4 flex-col gap-2' : ''
      }`}>
        <Button 
          variant="default" 
          size={isMobile ? "default" : "sm"} 
          onClick={onPractice}
          className={isMobile ? 'w-full h-10' : ''}
        >
          <BookOpenCheck className="h-4 w-4 mr-2" />
          Practice
        </Button>
        
        {(onEdit || onDelete) && (
          <div className={`flex gap-1 ${isMobile ? 'w-full justify-center' : ''}`}>
            {onEdit && canEdit && (
              <Button 
                variant="outline" 
                size={isMobile ? "default" : "icon"} 
                onClick={onEdit} 
                className={isMobile ? 'flex-1 h-10' : 'h-8 w-8'}
              >
                <Edit className="h-4 w-4" />
                {isMobile && <span className="ml-2">Edit</span>}
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="outline" 
                size={isMobile ? "default" : "icon"} 
                onClick={onDelete} 
                className={cn(
                  "text-destructive hover:text-destructive",
                  isMobile ? 'flex-1 h-10' : 'h-8 w-8'
                )}
              >
                <Trash2 className="h-4 w-4" />
                {isMobile && <span className="ml-2">Delete</span>}
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ExerciseCard;
