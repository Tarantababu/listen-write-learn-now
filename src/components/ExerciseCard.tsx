
import React, { useState } from 'react';
import { Exercise } from '@/types';
import { useDirectoryContext } from '@/contexts/DirectoryContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Check, Move } from 'lucide-react';
import MoveExerciseModal from './MoveExerciseModal';

interface ExerciseCardProps {
  exercise: Exercise;
  onPractice: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onPractice,
  onEdit,
  onDelete
}) => {
  const { title, text, tags, completionCount, isCompleted, language } = exercise;
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const { directories } = useDirectoryContext();
  
  // Get directory name if exercise is in a directory
  const directoryName = exercise.directoryId 
    ? directories.find(dir => dir.id === exercise.directoryId)?.name 
    : null;
  
  return (
    <>
      <Card className={`overflow-hidden ${isCompleted ? 'border-success border-2' : ''}`}>
        <CardContent className="p-4">
          <div className="mb-2 flex justify-between items-center">
            <h3 className="font-medium text-lg">{title}</h3>
            <div className="flex gap-2">
              {directoryName && (
                <span className="text-xs px-2 py-1 bg-muted/70 rounded-full truncate max-w-[100px]">
                  {directoryName}
                </span>
              )}
              <span className="text-xs px-2 py-1 bg-muted rounded-full capitalize">
                {language}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {text}
          </p>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map(tag => (
                <span 
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-muted rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="mt-4 flex items-center">
            {isCompleted ? (
              <div className="flex items-center text-success gap-1 text-sm">
                <Check className="h-4 w-4" />
                <span>Completed</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Progress: {completionCount}/3 successful attempts
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between gap-2">
          <Button 
            onClick={onPractice} 
            className="flex-1"
            variant="default"
          >
            <Play className="h-4 w-4 mr-2" /> Practice
          </Button>
          
          <Button 
            onClick={() => setIsMoveModalOpen(true)}
            variant="outline" 
            size="icon"
            title="Move to folder"
          >
            <span className="sr-only">Move</span>
            <Move className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={onEdit} 
            variant="outline" 
            size="icon"
          >
            <span className="sr-only">Edit</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>
          </Button>
          
          <Button 
            onClick={onDelete} 
            variant="outline" 
            size="icon"
          >
            <span className="sr-only">Delete</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>
          </Button>
        </CardFooter>
      </Card>
      
      <MoveExerciseModal
        exercise={exercise}
        isOpen={isMoveModalOpen}
        onOpenChange={setIsMoveModalOpen}
      />
    </>
  );
};

export default ExerciseCard;
