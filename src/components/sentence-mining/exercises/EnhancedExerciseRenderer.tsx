
import React from 'react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { TranslationExercise } from './TranslationExercise';
import { VocabularyMarkingExercise } from './VocabularyMarkingExercise';
import { ClozeExercise } from './ClozeExercise';

interface EnhancedExerciseRendererProps {
  exercise: SentenceMiningExercise;
  userResponse: string;
  selectedWords: string[];
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
  onPlayAudio?: () => void;
  audioLoading?: boolean;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  onResponseChange: (response: string) => void;
  onWordSelect: (word: string) => void;
  onSubmit: () => void;
  onNext: () => void;
}

export const EnhancedExerciseRenderer: React.FC<EnhancedExerciseRendererProps> = ({
  exercise,
  userResponse,
  selectedWords,
  showResult,
  isCorrect,
  loading,
  onPlayAudio,
  audioLoading,
  showTranslation,
  onToggleTranslation,
  onResponseChange,
  onWordSelect,
  onSubmit,
  onNext
}) => {
  const commonProps = {
    exercise,
    showResult,
    isCorrect,
    loading,
    onPlayAudio,
    audioLoading,
    showTranslation,
    onToggleTranslation,
    onNext
  };

  switch (exercise.exerciseType) {
    case 'translation':
      return (
        <TranslationExercise 
          {...commonProps}
          userResponse={userResponse}
          onResponseChange={onResponseChange}
          onSubmit={onSubmit}
        />
      );

    case 'vocabulary_marking':
      return (
        <VocabularyMarkingExercise 
          {...commonProps}
          selectedWords={selectedWords}
          onWordSelect={onWordSelect}
          onSubmit={onSubmit}
        />
      );

    case 'cloze':
      return (
        <ClozeExercise 
          {...commonProps}
          userResponse={userResponse}
          onResponseChange={onResponseChange}
          onSubmit={onSubmit}
        />
      );

    default:
      return (
        <div className="p-4 text-center text-muted-foreground">
          Unknown exercise type: {exercise.exerciseType}
        </div>
      );
  }
};
