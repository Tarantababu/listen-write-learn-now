
import React from 'react';
import { CurriculumExercise } from './CurriculumTagGroup';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import LessonItem from './LessonItem';
import { Progress } from '@/components/ui/progress';

interface UnitAccordionProps {
  unitNumber: number;
  title: string;
  lessons: CurriculumExercise[];
  onPracticeExercise: (id: string) => void;
  onAddExercise: (id: string) => void;
}

const UnitAccordion: React.FC<UnitAccordionProps> = ({
  unitNumber,
  title,
  lessons,
  onPracticeExercise,
  onAddExercise
}) => {
  // Calculate progress for this unit
  const completedCount = lessons.filter(lesson => lesson.status === 'completed').length;
  const totalCount = lessons.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  return (
    <Accordion type="single" collapsible className="mb-4">
      <AccordionItem value={`unit-${unitNumber}`} className="border rounded-lg overflow-hidden">
        <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 transition-colors">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="rounded-full h-6 w-6 flex items-center justify-center p-0">
                {unitNumber}
              </Badge>
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            <div className="flex items-center gap-3 mr-4">
              <span className="text-sm text-muted-foreground">
                {completedCount}/{totalCount} lessons
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-1 px-4">
          <Progress 
            value={progressPercentage} 
            className="h-1.5 mb-4" 
            indicatorClassName={progressPercentage === 100 ? "bg-green-500" : undefined} 
          />
          
          <div className="space-y-2">
            {lessons.map((lesson, index) => (
              <LessonItem
                key={lesson.id}
                lessonNumber={index + 1}
                title={lesson.title}
                description={lesson.text.substring(0, 80) + (lesson.text.length > 80 ? '...' : '')}
                status={lesson.status}
                completionCount={lesson.completionCount}
                onPractice={() => onPracticeExercise(lesson.id)}
                onAdd={() => onAddExercise(lesson.id)}
                isLocked={index > 0 && lessons[index-1].status !== 'completed'}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default UnitAccordion;
