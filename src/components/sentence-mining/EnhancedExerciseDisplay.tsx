
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SentenceMiningExercise, DifficultyLevel } from '@/types/sentence-mining';
import { WordMasteryIndicator, calculateMasteryLevel } from './WordMasteryIndicator';
import { Eye, EyeOff, Lightbulb, Volume2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedExerciseDisplayProps {
  exercise: SentenceMiningExercise;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  className?: string;
}

const getDifficultyFeatures = (difficulty: DifficultyLevel) => {
  switch (difficulty) {
    case 'beginner':
      return {
        maxHints: 4,
        showWordMastery: true,
        autoShowTranslation: true,
        contextEmphasis: 'high',
        fontSize: 'text-lg',
        spacing: 'space-y-4'
      };
    case 'intermediate':
      return {
        maxHints: 3,
        showWordMastery: true,
        autoShowTranslation: false,
        contextEmphasis: 'medium',
        fontSize: 'text-base',
        spacing: 'space-y-3'
      };
    case 'advanced':
      return {
        maxHints: 2,
        showWordMastery: false,
        autoShowTranslation: false,
        contextEmphasis: 'low',
        fontSize: 'text-sm',
        spacing: 'space-y-2'
      };
    default:
      return {
        maxHints: 3,
        showWordMastery: true,
        autoShowTranslation: false,
        contextEmphasis: 'medium',
        fontSize: 'text-base',
        spacing: 'space-y-3'
      };
  }
};

export const EnhancedExerciseDisplay: React.FC<EnhancedExerciseDisplayProps> = ({
  exercise,
  showTranslation,
  onToggleTranslation,
  className
}) => {
  const [showHints, setShowHints] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  
  const features = getDifficultyFeatures(exercise.difficulty);
  const availableHints = exercise.hints?.slice(0, features.maxHints) || [];
  
  // Mock word mastery data (in real app, this would come from the backend)
  const mockMasteryLevel = calculateMasteryLevel(3, 2);

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'beginner': return 'border-green-200 bg-green-50';
      case 'intermediate': return 'border-blue-200 bg-blue-50';
      case 'advanced': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getContextEmphasis = () => {
    switch (features.contextEmphasis) {
      case 'high': return 'bg-amber-50 border-amber-200 p-4 rounded-lg';
      case 'medium': return 'bg-blue-50 border-blue-200 p-3 rounded-lg';
      case 'low': return 'bg-gray-50 border-gray-200 p-2 rounded-lg';
      default: return 'bg-gray-50 border-gray-200 p-3 rounded-lg';
    }
  };

  return (
    <Card className={cn(`${getDifficultyColor(exercise.difficulty)} ${className}`)}>
      <CardContent className={`pt-6 ${features.spacing}`}>
        {/* Exercise Header */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="capitalize">
            {exercise.difficulty} Level
          </Badge>
          
          {features.showWordMastery && exercise.targetWord && (
            <WordMasteryIndicator
              word={exercise.targetWord}
              masteryLevel={mockMasteryLevel}
              encounters={3}
              correctCount={2}
              showProgress={false}
              className="flex-shrink-0"
            />
          )}
        </div>

        {/* Main Sentence */}
        <div className={`${features.fontSize} font-medium text-center p-4 bg-white rounded-lg border`}>
          {exercise.clozeSentence || exercise.sentence}
        </div>

        {/* Target Word Translation (for beginners) */}
        {exercise.targetWordTranslation && exercise.difficulty === 'beginner' && (
          <div className="text-center">
            <Badge variant="secondary" className="text-sm">
              Target: {exercise.targetWordTranslation}
            </Badge>
          </div>
        )}

        {/* Context (emphasized based on difficulty) */}
        {exercise.context && (
          <div className={getContextEmphasis()}>
            <div className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium">Context: </span>
                <span className="text-sm text-muted-foreground">{exercise.context}</span>
              </div>
            </div>
          </div>
        )}

        {/* Hints Section */}
        {availableHints.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHints(!showHints)}
                className="flex items-center gap-2"
              >
                <Lightbulb className="h-4 w-4" />
                {showHints ? 'Hide' : 'Show'} Hints ({availableHints.length})
              </Button>
              
              {hintsUsed > 0 && (
                <Badge variant="outline" className="text-xs">
                  {hintsUsed} hints used
                </Badge>
              )}
            </div>
            
            {showHints && (
              <div className="space-y-2">
                {availableHints.map((hint, index) => (
                  <div 
                    key={index}
                    className="text-sm p-2 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <span className="font-medium">Hint {index + 1}: </span>
                    {hint}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Translation Section */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTranslation}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            {showTranslation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showTranslation ? 'Hide' : 'Show'} Full Translation
          </Button>

          {(showTranslation || (features.autoShowTranslation && exercise.difficulty === 'beginner')) && exercise.translation && (
            <div className="text-sm text-muted-foreground italic p-3 bg-white/50 rounded-lg border">
              {exercise.translation}
            </div>
          )}
        </div>

        {/* Audio Button (if available) */}
        {exercise.difficulty === 'beginner' && (
          <div className="flex justify-center">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Listen to Pronunciation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
