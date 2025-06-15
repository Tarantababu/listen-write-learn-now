
import React from 'react';
import { DualModeText } from './DualModeText';
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
    // If text selection is disabled, render basic synchronized text without selection capabilities
    console.log('Text selection disabled, rendering basic synchronized text');
    return (
      <div className={className}>
        <div className="text-gray-900 dark:text-gray-100 leading-relaxed w-full">
          {text}
        </div>
      </div>
    );
  }

  // Render the dual-mode text component with both reading and audio sync modes
  return (
    <DualModeText
      text={text}
      highlightedWordIndex={highlightedWordIndex}
      onWordClick={onWordClick}
      enableWordHighlighting={enableWordHighlighting}
      highlightColor={highlightColor}
      className={className}
      onCreateDictation={onCreateDictation}
      onCreateBidirectional={onCreateBidirectional}
      exerciseId={exerciseId}
      exerciseLanguage={exerciseLanguage}
      enableVocabulary={enableVocabulary}
      enhancedHighlighting={enhancedHighlighting}
      vocabularyIntegration={vocabularyIntegration}
      enableContextMenu={enableContextMenu}
    />
  );
};
