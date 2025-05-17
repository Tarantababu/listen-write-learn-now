
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpenCheck, Copy, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CurriculumExerciseCardProps {
  id: string;
  title: string;
  text: string;
  tags: string[];
  createdAt: string;
  status: 'completed' | 'in-progress' | 'not-started';
  completionCount?: number;
  onPractice: () => void;
  onAdd: () => void;
}

const CurriculumExerciseCard: React.FC<CurriculumExerciseCardProps> = ({
  title,
  text,
  tags,
  createdAt,
  status,
  completionCount = 0,
  onPractice,
  onAdd
}) => {
  // Format the date
  const formattedDate = format(new Date(createdAt), 'MMM d, yyyy');

  // Truncate text if it's too long
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // Status styling
  const getStatusStyles = () => {
    switch(status) {
      case 'completed':
        return "border-green-500/30 bg-green-50/30 dark:bg-green-950/10";
      case 'in-progress':
        return "border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/10";
      default:
        return "";
    }
  };
  
  const getStatusIcon = () => {
    switch(status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500 shrink-0" />;
      default:
        return null;
    }
  };
  
  return (
    <Card className={cn(
      "overflow-hidden h-full flex flex-col transition-all",
      getStatusStyles()
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium line-clamp-1">
              {truncateText(title, 50)}
            </h3>
            {getStatusIcon()}
          </div>
          
          {status === 'in-progress' && (
            <Badge variant="outline" className="text-xs">
              {completionCount}/3
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <p className="text-sm text-muted-foreground line-clamp-4 mb-3">
          {truncateText(text, 200)}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {tags?.length > 0 && tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs py-0">
              {truncateText(tag, 15)}
            </Badge>
          ))}
          {tags?.length > 3 && (
            <Badge variant="outline" className="text-xs py-0">
              +{tags.length - 3} more
            </Badge>
          )}
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground mt-3">
          <span>Created: {formattedDate}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {status === 'not-started' ? (
          <Button variant="default" size="sm" onClick={onAdd} className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Add to My Exercises
          </Button>
        ) : (
          <Button variant="default" size="sm" onClick={onPractice} className="w-full">
            <BookOpenCheck className="h-4 w-4 mr-2" />
            Practice
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CurriculumExerciseCard;
