
import React, { useState } from 'react';
import { Language } from '@/types';
import { cn } from '@/lib/utils';

interface SynchronizedTextWithSelectionProps {
  text: string;
  highlightedWordIndex: number;
  onWordClick?: (wordIndex: number, word: string) => void;
  enableWordHighlighting?: boolean;
  highlightColor?: string;
  className?: string;
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
  const [selectedText, setSelectedText] = useState('');

  console.log('SynchronizedTextWithSelection - Simplified format:', {
    enableTextSelection,
    enableContextMenu,
    textLength: text.length,
    hasText: !!text
  });

  const handleTextSelection = () => {
    if (enableTextSelection) {
      const selection = window.getSelection();
      const selectionText = selection?.toString().trim();
      if (selectionText && selectionText.length > 2) {
        setSelectedText(selectionText);
      }
    }
  };

  const handleCreateDictation = () => {
    if (selectedText) {
      onCreateDictation(selectedText);
      setSelectedText('');
    }
  };

  const handleCreateBidirectional = () => {
    if (selectedText) {
      onCreateBidirectional(selectedText);
      setSelectedText('');
    }
  };

  if (!enableTextSelection) {
    console.log('Text selection disabled, rendering basic text');
    return (
      <div className={cn("text-gray-900 dark:text-gray-100 leading-relaxed w-full", className)}>
        {text}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div 
        className={cn(
          "text-gray-900 dark:text-gray-100 leading-relaxed w-full cursor-text select-text",
          enableTextSelection && "hover:bg-blue-50 p-2 rounded transition-colors"
        )}
        onMouseUp={handleTextSelection}
        style={{ lineHeight: '1.8' }}
      >
        {text}
      </div>
      
      {/* Selection Actions */}
      {selectedText && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-blue-800">
              Selected: "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateDictation}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
            >
              Create Dictation
            </button>
            <button
              onClick={handleCreateBidirectional}
              className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded transition-colors"
            >
              Create Translation
            </button>
            <button
              onClick={() => setSelectedText('')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
