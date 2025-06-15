
import React from 'react';
import { TextSelectionPanel } from './TextSelectionPanel';
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
  className?: string;
}

export const ReadingModeText: React.FC<ReadingModeTextProps> = ({
  text,
  onCreateDictation,
  onCreateBidirectional,
  exerciseId,
  exerciseLanguage,
  enableVocabulary = false,
  vocabularyIntegration = false,
  className
}) => {
  console.log('ReadingModeText rendering with enhanced bidirectional support:', {
    textLength: text.length,
    vocabularyIntegration,
    exerciseLanguage
  });

  return (
    <div className={className}>
      <TextSelectionPanel
        text={text}
        onCreateDictation={onCreateDictation}
        onCreateBidirectional={onCreateBidirectional}
        exerciseId={exerciseId}
        exerciseLanguage={exerciseLanguage}
        enableVocabulary={enableVocabulary}
        vocabularyIntegration={vocabularyIntegration}
      />
    </div>
  );
};
