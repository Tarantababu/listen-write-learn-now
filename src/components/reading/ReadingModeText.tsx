
import React from 'react';
import { PureReadingModeText } from './PureReadingModeText';
import { Language } from '@/types';

interface ReadingModeTextProps {
  text: string;
  onCreateDictation: (selectedText: string) => void;
  onCreateBidirectional: (selectedText: string) => void;
  exerciseId?: string;
  exerciseLanguage?: Language;
  enableVocabulary?: boolean;
  enhancedHighlighting?: boolean;
  vocabularyIntegration?: boolean;
  enableContextMenu?: boolean;
}

export const ReadingModeText: React.FC<ReadingModeTextProps> = ({
  text,
  onCreateDictation,
  onCreateBidirectional,
  exerciseId,
  exerciseLanguage,
  enableVocabulary = false,
  vocabularyIntegration = false,
  enableContextMenu = true
}) => {
  console.log('ReadingModeText rendering with pure approach:', {
    textLength: text.length,
    enableContextMenu,
    vocabularyIntegration
  });

  return (
    <PureReadingModeText
      text={text}
      onCreateDictation={onCreateDictation}
      onCreateBidirectional={onCreateBidirectional}
      exerciseId={exerciseId}
      exerciseLanguage={exerciseLanguage}
      enableVocabulary={enableVocabulary}
      vocabularyIntegration={vocabularyIntegration}
      enableContextMenu={enableContextMenu}
    />
  );
};
