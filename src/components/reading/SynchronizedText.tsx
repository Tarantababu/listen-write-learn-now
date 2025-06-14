
import React from 'react';
import { VirtualHighlightText } from './VirtualHighlightText';
import { EnhancedTextHighlighter } from './EnhancedTextHighlighter';

interface SynchronizedTextProps {
  text: string;
  highlightedWordIndex: number;
  onWordClick?: (wordIndex: number, word: string) => void;
  enableWordHighlighting?: boolean;
  highlightColor?: string;
  className?: string;
}

export const SynchronizedText: React.FC<SynchronizedTextProps> = ({
  text,
  highlightedWordIndex,
  onWordClick,
  enableWordHighlighting = true,
  highlightColor = 'bg-yellow-300',
  className = ''
}) => {
  return (
    <div className={`relative leading-relaxed text-selectable ${className}`}>
      <EnhancedTextHighlighter
        selectedText=""
        selectionRange={null}
        highlightedWordIndex={highlightedWordIndex}
        hoveredWordIndex={-1}
        enhancedHighlighting={true}
        wordSyncColor={highlightColor}
      >
        <VirtualHighlightText
          text={text}
          highlightedWordIndex={highlightedWordIndex}
          onWordClick={onWordClick}
          enableWordHighlighting={enableWordHighlighting}
          highlightColor={highlightColor}
          className="inline-block w-full"
        />
      </EnhancedTextHighlighter>
    </div>
  );
};
