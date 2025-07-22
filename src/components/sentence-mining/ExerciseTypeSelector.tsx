
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages, Brain, BookOpen } from 'lucide-react';
import { ExerciseType, DifficultyLevel } from '@/types/sentence-mining';

interface ExerciseTypeSelectorProps {
  onSelectType: (type: ExerciseType, difficulty: DifficultyLevel) => void;
  progress?: any;
}

export const ExerciseTypeSelector: React.FC<ExerciseTypeSelectorProps> = ({
  onSelectType,
  progress,
}) => {
  const exerciseTypes = [
    {
      type: 'translation' as ExerciseType,
      title: 'Translation',
      description: 'Translate sentences from your target language to English',
      icon: Languages,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
    {
      type: 'vocabulary_marking' as ExerciseType,
      title: 'Vocabulary Marking',
      description: 'Mark words you don\'t know for later review',
      icon: BookOpen,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
    },
    {
      type: 'cloze' as ExerciseType,
      title: 'Fill in the Blank',
      description: 'Complete sentences with missing words',
      icon: Brain,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
    },
  ];

  const difficulties: { level: DifficultyLevel; label: string }[] = [
    { level: 'beginner', label: 'Beginner' },
    { level: 'intermediate', label: 'Intermediate' },
    { level: 'advanced', label: 'Advanced' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Exercise Type</h2>
        <p className="text-muted-foreground">
          Select the type of exercise you'd like to practice
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {exerciseTypes.map((exerciseType) => {
          const Icon = exerciseType.icon;
          
          return (
            <Card key={exerciseType.type} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-2">
                <div className={`w-12 h-12 rounded-full ${exerciseType.color} mx-auto mb-3 flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{exerciseType.title}</CardTitle>
                <CardDescription className="text-sm">
                  {exerciseType.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-2">
                <div className="grid gap-2">
                  {difficulties.map((difficulty) => (
                    <Button
                      key={difficulty.level}
                      onClick={() => onSelectType(exerciseType.type, difficulty.level)}
                      variant="outline"
                      className={`w-full justify-between ${exerciseType.hoverColor} hover:text-white`}
                    >
                      <span>{difficulty.label}</span>
                      <Badge variant="secondary" className="capitalize">
                        {difficulty.level}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
