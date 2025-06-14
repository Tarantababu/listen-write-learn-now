
import React from 'react';
import { SimplifiedSynchronizedText } from './SimplifiedSynchronizedText';
import { SimplifiedTextSelectionManager } from './SimplifiedTextSelectionManager';
import { Language } from '@/types';

interface NewSynchronizedTextWithSelectionProps {
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

export const NewSynchronizedTextWithSelection: React.FC<NewSynchronizedTextWithSelectionProps> = ({
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
  console.log('NewSynchronizedTextWithSelection props:', {
    enableTextSelection,
    enableContextMenu,
    vocabularyIntegration,
    textLength: text.length
  });

  if (!enableTextSelection) {
    // If text selection is disabled, just render the simplified synchronized text
    return (
      <SimplifiedSynchronizedText
        text={text}
        highlightedWordIndex={highlightedWordIndex}
        onWordClick={onWordClick}
        enableWordHighlighting={enableWordHighlighting}
        highlightColor={highlightColor}
        className={className}
      />
    );
  }

  // Wrap simplified synchronized text with selection capabilities
  return (
    <SimplifiedTextSelectionManager
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
      <SimplifiedSynchronizedText
        text={text}
        highlightedWordIndex={highlightedWordIndex}
        onWordClick={onWordClick}
        enableWordHighlighting={enableWordHighlighting}
        highlightColor={highlightColor}
        className={className}
      />
    </SimplifiedTextSelectionManager>
  );
};
