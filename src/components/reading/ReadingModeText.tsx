
import React from 'react';
import { TextSelectionManager } from './TextSelectionManager';
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
  enhancedHighlighting = false,
  vocabularyIntegration = false,
  enableContextMenu = true
}) => {
  console.log('ReadingModeText rendering:', {
    textLength: text.length,
    enableContextMenu,
    vocabularyIntegration
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
      <div 
        className="
          text-selectable leading-relaxed
          prose prose-sm max-w-none
          text-gray-900 dark:text-gray-100
          selection:bg-blue-200/60 selection:text-gray-900
          dark:selection:bg-blue-300/40 dark:selection:text-gray-100
        "
        style={{
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text',
          cursor: 'text'
        }}
      >
        {text}
      </div>
    </TextSelectionManager>
  );
};
