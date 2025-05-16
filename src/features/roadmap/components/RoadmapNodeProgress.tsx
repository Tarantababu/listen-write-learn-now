
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface RoadmapNodeProgressProps {
  title: string;
  description?: string;
  completionCount: number;
  isCompleted: boolean;
  lastPracticedAt?: Date;
  className?: string;
}

const RoadmapNodeProgress: React.FC<RoadmapNodeProgressProps> = ({
  title,
  description,
  completionCount,
  isCompleted,
  lastPracticedAt,
  className
}) => {
  const progressPercentage = isCompleted ? 100 : Math.min((completionCount / 3) * 100, 99);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{title}</CardTitle>
            {isCompleted ? (
              <Badge className="bg-primary hover:bg-primary/90">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            ) : (
              <Badge variant="outline">
                In Progress
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{completionCount}/3 completions</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <span>
                  {isCompleted ? (
                    <span className="text-primary font-medium">Mastered</span>
                  ) : (
                    <span>Need {3 - completionCount} more</span>
                  )}
                </span>
              </div>
              
              {lastPracticedAt && (
                <div className="flex items-center justify-end">
                  <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(lastPracticedAt, { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoadmapNodeProgress;
