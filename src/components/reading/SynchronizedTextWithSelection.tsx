
import React from 'react';
import { SynchronizedText } from './SynchronizedText';
import { TextSelectionManager } from './TextSelectionManager';
import { Language } from '@/types';

interface SynchronizedTextWithSelectionProps {
  text: string;
  highlightedWordIndex: number;
  onWordClick?: (wordIndex: number, word: string) => void;
  enableWordHighlighting?: boolean;
  highlightColor?: string;
  className?: string;
  // Text selection props
  onCreateDictation: (selectedText: string) => void;
  onCreateBidirectional: (selectedText: string) => void;
  exerciseId?: string;
  exerciseLanguage?: Language;
  enableTextSelection?: boolean;
  enableVocabulary?: boolean;
  enhancedHighlighting?: boolean;
  vocabularyIntegration?: boolean;
  enableContextMenu?: boolean;
}

export const SynchronizedTextWithSelection: React.FC<SynchronizedTextWithSelectionProps> = ({
  text,
  highlightedWordIndex,
  onWordClick,
  enableWordHighlighting = true,
  highlightColor = 'bg-yellow-300',
  className = '',
  onCreateDictation,
  onCreateBidirectional,
  exerciseId,
  exerciseLanguage,
  enableTextSelection = true,
  enableVocabulary = false,
  enhancedHighlighting = false,
  vocabularyIntegration = false,
  enableContextMenu = true
}) => {
  console.log('SynchronizedTextWithSelection props:', {
    enableTextSelection,
    enableContextMenu,
    vocabularyIntegration,
    textLength: text.length
  });

  if (!enableTextSelection) {
    // If text selection is disabled, just render the synchronized text
    return (
      <SynchronizedText
        text={text}
        highlightedWordIndex={highlightedWordIndex}
        onWordClick={onWordClick}
        enableWordHighlighting={enableWordHighlighting}
        highlightColor={highlightColor}
        className={className}
      />
    );
  }

  // Wrap synchronized text with selection capabilities
  return (
    <TextSelectionManager
      onCreateDictation={onCreateDictation}
      onCreateBidirectional={onCreateBidirectional}
      disabled={false}
      exerciseId={exerciseId}
      exerciseLanguage={exerciseLanguage}
      enableVocabulary={enableVocabulary}
      enhancedHighlighting={enhancedHighlighting}
      vocabularyIntegration={vocabularyIntegration}
      enableContextMenu={enableContextMenu}
    >
      <SynchronizedText
        text={text}
        highlightedWordIndex={highlightedWordIndex}
        onWordClick={onWordClick}
        enableWordHighlighting={enableWordHighlighting}
        highlightColor={highlightColor}
        className={className}
      />
    </TextSelectionManager>
  );
};
