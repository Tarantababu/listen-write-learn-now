
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurriculumProgressSummaryProps {
  totalExercises: number;
  completedExercises: number;
  inProgressExercises: number;
  language: string;
}

const CurriculumProgressSummary: React.FC<CurriculumProgressSummaryProps> = ({
  totalExercises,
  completedExercises,
  inProgressExercises,
  language
}) => {
  const progressPercentage = totalExercises > 0 
    ? Math.round((completedExercises / totalExercises) * 100) 
    : 0;
  
  const notStartedExercises = totalExercises - completedExercises - inProgressExercises;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {language.charAt(0).toUpperCase() + language.slice(1)} Curriculum Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-medium">{progressPercentage}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
              indicatorClassName={cn(
                progressPercentage === 100 ? "bg-green-500" : "bg-primary"
              )}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">{completedExercises} Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{inProgressExercises} In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{notStartedExercises} Not Started</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurriculumProgressSummary;
