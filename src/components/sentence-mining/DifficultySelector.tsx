
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Star } from 'lucide-react';
import { DifficultyLevel } from '@/types/sentence-mining';

interface DifficultySelectorProps {
  onSelectDifficulty: (difficulty: DifficultyLevel) => void;
  progress?: {
    beginner: { attempted: number; correct: number; accuracy: number };
    intermediate: { attempted: number; correct: number; accuracy: number };
    advanced: { attempted: number; correct: number; accuracy: number };
  };
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  onSelectDifficulty,
  progress,
}) => {
  const difficultyOptions = [
    {
      level: 'beginner' as DifficultyLevel,
      title: 'Beginner',
      description: 'Common words and simple sentence structures',
      icon: Zap,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
    {
      level: 'intermediate' as DifficultyLevel,
      title: 'Intermediate',
      description: 'Moderate vocabulary with varied sentence patterns',
      icon: Brain,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
    {
      level: 'advanced' as DifficultyLevel,
      title: 'Advanced',
      description: 'Complex vocabulary and sophisticated structures',
      icon: Star,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Difficulty</h2>
        <p className="text-muted-foreground">
          Select a difficulty level to start practicing with smart sentence mining
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {difficultyOptions.map((option) => {
          const Icon = option.icon;
          const stats = progress?.[option.level];
          
          return (
            <Card key={option.level} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-2">
                <div className={`w-12 h-12 rounded-full ${option.color} mx-auto mb-3 flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-2">
                {stats && stats.attempted > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Attempted:</span>
                      <Badge variant="outline">{stats.attempted}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Accuracy:</span>
                      <Badge variant={stats.accuracy >= 70 ? 'default' : 'secondary'}>
                        {Math.round(stats.accuracy)}%
                      </Badge>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={() => onSelectDifficulty(option.level)}
                  className={`w-full ${option.color} ${option.hoverColor} text-white`}
                >
                  Start {option.title}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
