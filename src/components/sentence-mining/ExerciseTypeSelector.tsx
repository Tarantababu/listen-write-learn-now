
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { DifficultyLevel } from '@/types/sentence-mining';

interface ExerciseTypeSelectorProps {
  onSelectType: (type: 'cloze', difficulty: DifficultyLevel) => void;
  progress?: any;
}

export const ExerciseTypeSelector: React.FC<ExerciseTypeSelectorProps> = ({
  onSelectType,
  progress,
}) => {
  const difficulties: { level: DifficultyLevel; label: string }[] = [
    { level: 'beginner', label: 'Beginner' },
    { level: 'intermediate', label: 'Intermediate' },
    { level: 'advanced', label: 'Advanced' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Start Cloze Practice</h2>
        <p className="text-muted-foreground">
          Fill in missing words to learn vocabulary in context
        </p>
      </div>

      <Card className="hover:shadow-lg transition-shadow max-w-md mx-auto">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-full bg-orange-500 mx-auto mb-3 flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-lg">Fill in the Blank</CardTitle>
          <CardDescription className="text-sm">
            Complete sentences with missing words
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-2">
          <div className="grid gap-2">
            {difficulties.map((difficulty) => (
              <Button
                key={difficulty.level}
                onClick={() => onSelectType('cloze', difficulty.level)}
                variant="outline"
                className="w-full justify-between hover:bg-orange-600 hover:text-white"
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
    </div>
  );
};
