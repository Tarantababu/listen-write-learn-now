
import React from 'react';
import { SynchronizedText } from './SynchronizedText';
import { TextSelectionManager } from './TextSelectionManager';
import { Language } from '@/types';

interface AudioSyncModeTextProps {
  text: string;
  highlightedWordIndex: number;
  onWordClick?: (wordIndex: number, word: string) => void;
  enableWordHighlighting?: boolean;
  highlightColor?: string;
  onCreateDictation: (selectedText: string) => void;
  onCreateBidirectional: (selectedText: string) => void;
  exerciseId?: string;
  exerciseLanguage?: Language;
  enableVocabulary?: boolean;
  enhancedHighlighting?: boolean;
  vocabularyIntegration?: boolean;
  enableContextMenu?: boolean;
}

export const AudioSyncModeText: React.FC<AudioSyncModeTextProps> = ({
  text,
  highlightedWordIndex,
  onWordClick,
  enableWordHighlighting = true,
  highlightColor = 'bg-yellow-300',
  onCreateDictation,
  onCreateBidirectional,
  exerciseId,
  exerciseLanguage,
  enableVocabulary = false,
  enhancedHighlighting = false,
  vocabularyIntegration = false,
  enableContextMenu = true
}) => {
  console.log('AudioSyncModeText rendering:', {
    highlightedWordIndex,
    enableWordHighlighting,
    textLength: text.length
  });

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
        className="leading-relaxed"
      />
    </TextSelectionManager>
  );
};
