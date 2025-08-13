
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, BookOpen, Eye, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MasteryLevel = 'new' | 'learning' | 'review' | 'mastered';

interface WordMasteryIndicatorProps {
  word: string;
  masteryLevel: MasteryLevel;
  encounters: number;
  correctCount: number;
  className?: string;
  showProgress?: boolean;
}

const masteryConfig = {
  new: {
    label: 'New',
    icon: Eye,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    progressColor: 'bg-blue-500',
    description: 'First encounter'
  },
  learning: {
    label: 'Learning',
    icon: BookOpen,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    progressColor: 'bg-orange-500',
    description: 'Building familiarity'
  },
  review: {
    label: 'Review',
    icon: Star,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    progressColor: 'bg-purple-500',
    description: 'Reinforcing knowledge'
  },
  mastered: {
    label: 'Mastered',
    icon: Trophy,
    color: 'bg-green-100 text-green-800 border-green-200',
    progressColor: 'bg-green-500',
    description: 'Well learned'
  }
};

export const WordMasteryIndicator: React.FC<WordMasteryIndicatorProps> = ({
  word,
  masteryLevel,
  encounters,
  correctCount,
  className,
  showProgress = true
}) => {
  const config = masteryConfig[masteryLevel];
  const Icon = config.icon;
  const accuracy = encounters > 0 ? (correctCount / encounters) * 100 : 0;
  
  // Calculate progress towards next level
  const getProgressValue = () => {
    switch (masteryLevel) {
      case 'new': return Math.min((encounters / 2) * 100, 100);
      case 'learning': return Math.min((correctCount / 3) * 100, 100);
      case 'review': return Math.min((accuracy / 80) * 100, 100);
      case 'mastered': return 100;
      default: return 0;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={cn("text-xs font-medium", config.color)}
        >
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
        <span className="text-sm font-medium">{word}</span>
      </div>
      
      {showProgress && (
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{config.description}</span>
            <span>{encounters} encounters • {Math.round(accuracy)}% accuracy</span>
          </div>
          <Progress 
            value={getProgressValue()} 
            className="h-2"
          />
        </div>
      )}
    </div>
  );
};

// Helper function to determine mastery level based on performance
export const calculateMasteryLevel = (
  encounters: number, 
  correctCount: number
): MasteryLevel => {
  if (encounters === 0) return 'new';
  
  const accuracy = (correctCount / encounters) * 100;
  
  if (encounters >= 5 && accuracy >= 80) return 'mastered';
  if (encounters >= 3 && accuracy >= 60) return 'review';
  if (encounters >= 1) return 'learning';
  
  return 'new';
};
