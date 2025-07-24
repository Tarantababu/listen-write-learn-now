
import React from 'react';
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { TranslationExercise } from './TranslationExercise';
import { VocabularyMarkingExercise } from './VocabularyMarkingExercise';
import { ClozeExercise } from './ClozeExercise';
import { useSentenceMining } from '@/hooks/use-sentence-mining';

interface EnhancedExerciseRendererProps {
  exercise: SentenceMiningExercise;
  userResponse: string;
  selectedWords: string[];
  showResult: boolean;
  isCorrect: boolean;
  loading: boolean;
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
  showTranslation,
  onToggleTranslation,
  onResponseChange,
  onWordSelect,
  onSubmit,
  onNext
}) => {
  const { skipExercise } = useSentenceMining();

  const renderExercise = () => {
    switch (exercise.exerciseType) {
      case 'translation':
        return (
          <TranslationExercise
            exercise={exercise}
            userResponse={userResponse}
            showResult={showResult}
            isCorrect={isCorrect}
            loading={loading}
            showTranslation={showTranslation}
            onToggleTranslation={onToggleTranslation}
            onResponseChange={onResponseChange}
            onSubmit={onSubmit}
            onNext={onNext}
          />
        );
      
      case 'vocabulary_marking':
        return (
          <VocabularyMarkingExercise
            exercise={exercise}
            selectedWords={selectedWords}
            showResult={showResult}
            isCorrect={isCorrect}
            loading={loading}
            onWordSelect={onWordSelect}
            onSubmit={onSubmit}
            onSkip={skipExercise}
            onNext={onNext}
          />
        );
      
      case 'cloze':
        return (
          <ClozeExercise
            exercise={exercise}
            userResponse={userResponse}
            showResult={showResult}
            isCorrect={isCorrect}
            loading={loading}
            onResponseChange={onResponseChange}
            onSubmit={onSubmit}
            onNext={onNext}
          />
        );
      
      default:
        return <div>Unknown exercise type</div>;
    }
  };

  return <div>{renderExercise()}</div>;
};
