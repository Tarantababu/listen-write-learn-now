
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import CurriculumExerciseCard from './CurriculumExerciseCard';

export interface CurriculumExercise {
  id: string;
  title: string;
  text: string;
  tags: string[];
  createdAt: string;
  status: 'completed' | 'in-progress' | 'not-started';
  completionCount: number;
}

interface CurriculumTagGroupProps {
  tag: string;
  exercises: CurriculumExercise[];
  onPracticeExercise: (id: string) => void;
  onAddExercise: (id: string) => void;
}

const CurriculumTagGroup: React.FC<CurriculumTagGroupProps> = ({
  tag,
  exercises,
  onPracticeExercise,
  onAddExercise
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Calculate progress
  const completedCount = exercises.filter(ex => ex.status === 'completed').length;
  const totalCount = exercises.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full" asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{exercises.length}</Badge>
                <h3 className="text-lg font-semibold">{tag}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {completedCount}/{totalCount} completed
                </span>
                <ChevronDown className={cn(
                  "h-5 w-5 transition-transform",
                  isOpen ? "transform rotate-180" : ""
                )} />
              </div>
            </div>
            
            <Progress 
              value={progressPercentage} 
              className="h-1.5 mt-2" 
              indicatorClassName={cn(
                progressPercentage === 100 ? "bg-green-500" : "bg-primary"
              )} 
            />
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercises.map(exercise => (
                <CurriculumExerciseCard
                  key={exercise.id}
                  id={exercise.id}
                  title={exercise.title}
                  text={exercise.text}
                  tags={exercise.tags}
                  createdAt={exercise.createdAt}
                  status={exercise.status}
                  completionCount={exercise.completionCount}
                  onPractice={() => onPracticeExercise(exercise.id)}
                  onAdd={() => onAddExercise(exercise.id)}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default CurriculumTagGroup;
