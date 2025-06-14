
import React from 'react';
import { NewSynchronizedTextWithSelection } from './NewSynchronizedTextWithSelection';
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

export const SynchronizedTextWithSelection: React.FC<SynchronizedTextWithSelectionProps> = (props) => {
  // For now, use the new implementation directly
  // This maintains backward compatibility while using the fixed version
  return <NewSynchronizedTextWithSelection {...props} />;
};
