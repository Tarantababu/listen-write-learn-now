
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Zap, Star, TrendingUp, Clock, BookOpen } from 'lucide-react';
import { DifficultyLevel } from '@/types/sentence-mining';
import { DifficultyCharacteristics } from './DifficultyCharacteristics';

interface DifficultyProgress {
  beginner: { attempted: number; correct: number; accuracy: number };
  intermediate: { attempted: number; correct: number; accuracy: number };
  advanced: { attempted: number; correct: number; accuracy: number };
}

interface EnhancedDifficultySelectorProps {
  onSelectDifficulty: (difficulty: DifficultyLevel) => void;
  progress?: DifficultyProgress;
  recommendedDifficulty?: DifficultyLevel;
  confidenceScore?: number;
}

export const EnhancedDifficultySelector: React.FC<EnhancedDifficultySelectorProps> = ({
  onSelectDifficulty,
  progress,
  recommendedDifficulty,
  confidenceScore = 0
}) => {
  const difficultyOptions = [
    {
      level: 'beginner' as DifficultyLevel,
      title: 'Beginner',
      description: 'Build confidence with common vocabulary',
      icon: Zap,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      borderColor: 'border-green-200',
      bgColor: 'bg-green-50',
      features: ['5-8 word sentences', 'High-frequency words', 'Multiple hints', 'Clear context']
    },
    {
      level: 'intermediate' as DifficultyLevel,
      title: 'Intermediate',
      description: 'Balanced challenge with varied vocabulary',
      icon: Brain,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50',
      features: ['8-12 word sentences', 'Mixed vocabulary', 'Guided hints', 'Moderate complexity']
    },
    {
      level: 'advanced' as DifficultyLevel,
      title: 'Advanced',
      description: 'Master sophisticated language patterns',
      icon: Star,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      borderColor: 'border-purple-200',
      bgColor: 'bg-purple-50',
      features: ['12+ word sentences', 'Complex vocabulary', 'Minimal hints', 'Nuanced context']
    },
  ];

  const getProgressStats = (level: DifficultyLevel) => {
    if (!progress) return null;
    return progress[level];
  };

  const isRecommended = (level: DifficultyLevel) => {
    return recommendedDifficulty === level;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Challenge Level</h2>
        <p className="text-muted-foreground mb-4">
          Each difficulty provides a unique learning experience tailored to your progress
        </p>
        
        {recommendedDifficulty && confidenceScore > 0.7 && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            <TrendingUp className="h-4 w-4" />
            AI suggests {recommendedDifficulty} level ({Math.round(confidenceScore * 100)}% confidence)
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {difficultyOptions.map((option) => {
          const Icon = option.icon;
          const stats = getProgressStats(option.level);
          const recommended = isRecommended(option.level);
          
          return (
            <Card 
              key={option.level} 
              className={`relative hover:shadow-lg transition-all duration-200 hover:scale-105 transform ${
                recommended ? 'ring-2 ring-primary shadow-lg' : ''
              } ${option.borderColor} ${option.bgColor}`}
            >
              {recommended && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    AI Recommended
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className={`w-12 h-12 rounded-full ${option.color} mx-auto mb-3 flex items-center justify-center transition-transform duration-200 hover:scale-110`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Features List */}
                <div className="space-y-2">
                  {option.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${option.color}`} />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Progress Stats */}
                {stats && stats.attempted > 0 && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span>Your Progress</span>
                      <Badge variant="outline">{stats.attempted} attempts</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Accuracy</span>
                        <span className={stats.accuracy >= 70 ? 'text-green-600' : 'text-orange-600'}>
                          {Math.round(stats.accuracy)}%
                        </span>
                      </div>
                      <Progress value={stats.accuracy} className="h-2" />
                    </div>
                    
                    <div className="text-xs text-muted-foreground text-center">
                      {stats.correct}/{stats.attempted} exercises completed successfully
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={() => onSelectDifficulty(option.level)}
                  className={`w-full ${option.color} ${option.hoverColor} text-white transition-transform duration-200 hover:scale-105 active:scale-95`}
                >
                  Start {option.title}
                  {recommended && ' ⭐'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Characteristics */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-center">What Makes Each Level Different</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {difficultyOptions.map((option) => (
            <DifficultyCharacteristics 
              key={option.level}
              difficulty={option.level}
              className="h-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
