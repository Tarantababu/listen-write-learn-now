
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DifficultyLevel } from '@/types/sentence-mining';
import { Brain, Zap, Star, Clock, BookOpen, Target } from 'lucide-react';

interface DifficultyCharacteristicsProps {
  difficulty: DifficultyLevel;
  className?: string;
}

const difficultySpecs = {
  beginner: {
    icon: Zap,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    characteristics: [
      { icon: Clock, label: 'Sentence Length', value: '5-8 words', desc: 'Short, simple sentences' },
      { icon: BookOpen, label: 'Vocabulary', value: 'High-frequency', desc: 'Common, everyday words' },
      { icon: Target, label: 'Context Clues', value: 'Clear & Direct', desc: 'Obvious meaning indicators' },
      { icon: Brain, label: 'Hints Available', value: '3-4 hints', desc: 'Multiple assistance options' }
    ],
    description: 'Perfect for building confidence with familiar vocabulary and simple sentence structures.'
  },
  intermediate: {
    icon: Brain,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    characteristics: [
      { icon: Clock, label: 'Sentence Length', value: '8-12 words', desc: 'Moderate complexity' },
      { icon: BookOpen, label: 'Vocabulary', value: 'Mixed levels', desc: 'Common + some challenging words' },
      { icon: Target, label: 'Context Clues', value: 'Balanced', desc: 'Some context dependency' },
      { icon: Brain, label: 'Hints Available', value: '2-3 hints', desc: 'Guided assistance' }
    ],
    description: 'Balanced challenge with varied vocabulary and moderate sentence complexity.'
  },
  advanced: {
    icon: Star,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    characteristics: [
      { icon: Clock, label: 'Sentence Length', value: '12+ words', desc: 'Complex, nuanced sentences' },
      { icon: BookOpen, label: 'Vocabulary', value: 'Sophisticated', desc: 'Advanced & specialized terms' },
      { icon: Target, label: 'Context Clues', value: 'Subtle', desc: 'Requires deeper understanding' },
      { icon: Brain, label: 'Hints Available', value: '1-2 hints', desc: 'Minimal assistance' }
    ],
    description: 'Challenge yourself with complex vocabulary and sophisticated sentence structures.'
  }
};

export const DifficultyCharacteristics: React.FC<DifficultyCharacteristicsProps> = ({
  difficulty,
  className
}) => {
  const spec = difficultySpecs[difficulty];
  const Icon = spec.icon;

  return (
    <Card className={`${spec.bgColor} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg capitalize">
          <Icon className={`h-5 w-5 ${spec.color}`} />
          {difficulty} Level
        </CardTitle>
        <p className="text-sm text-muted-foreground">{spec.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {spec.characteristics.map((char, index) => {
            const CharIcon = char.icon;
            return (
              <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-white/50">
                <CharIcon className={`h-4 w-4 mt-0.5 ${spec.color} flex-shrink-0`} />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {char.label}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {char.value}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{char.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
