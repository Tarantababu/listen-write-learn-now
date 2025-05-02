
import React, { useState } from 'react';
import { Exercise } from '@/types';
import { useDirectoryContext } from '@/contexts/DirectoryContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MoreVertical, Check } from 'lucide-react';
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
  
  // Since duration isn't in the Exercise type, we generate it here
  const duration = (Math.floor(Math.random() * 4) + 2) + ":" + (Math.floor(Math.random() * 60)).toString().padStart(2, '0') + " min";
  
  // Format progress status
  const getProgressStatus = () => {
    if (isCompleted) {
      return { text: "Completed", color: "text-green-600" };
    }
    if (completionCount > 0) {
      return { text: `In progress (${completionCount}/3)`, color: "text-amber-500" };
    }
    return { text: "Not started", color: "text-gray-400" };
  };
  
  const progressStatus = getProgressStatus();
  
  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-all duration-200">
        <CardContent className="p-4 flex-grow">
          <div className="flex justify-between items-start mb-2">
            <div>
              {/* Language and tag pills */}
              <div className="flex gap-1 mb-2">
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full capitalize">
                  {language}
                </span>
                {tags.length > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                    {tags[0]}
                  </span>
                )}
              </div>
              
              {/* Exercise title */}
              <h3 className="font-medium text-lg mb-1">{title}</h3>
              
              {/* Exercise description */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {text}
              </p>
            </div>
            
            {/* Menu (three dots) */}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => {}}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center justify-between text-xs mt-auto">
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{duration}</span>
            </div>
            
            <div className={`flex items-center gap-1 ${progressStatus.color}`}>
              {isCompleted && <Check className="h-3.5 w-3.5" />}
              <span>{progressStatus.text}</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t p-4 flex justify-center bg-gray-50">
          <Button 
            onClick={onPractice} 
            variant="outline"
            className="w-full"
          >
            {completionCount > 0 && !isCompleted ? 'Continue Dictation' : 'Start Dictation'}
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
