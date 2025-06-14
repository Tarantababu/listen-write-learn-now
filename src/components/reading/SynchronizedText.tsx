
import React, { useState } from 'react';
import { EnhancedWordSpan } from './EnhancedWordSpan';
import { EnhancedTextHighlighter } from './EnhancedTextHighlighter';

interface SynchronizedTextProps {
  text: string;
  highlightedWordIndex: number;
  onWordClick?: (wordIndex: number, word: string) => void;
  enableWordHighlighting?: boolean;
  highlightColor?: string;
  className?: string;
}

interface TextSegment {
  content: string;
  isWord: boolean;
  wordIndex?: number;
}

export const SynchronizedText: React.FC<SynchronizedTextProps> = ({
  text,
  highlightedWordIndex,
  onWordClick,
  enableWordHighlighting = true,
  highlightColor = 'bg-yellow-300',
  className = ''
}) => {
  const [hoveredWordIndex, setHoveredWordIndex] = useState(-1);

  // Split text into segments preserving spaces
  const createTextSegments = (text: string): TextSegment[] => {
    const segments: TextSegment[] = [];
    let wordIndex = 0;
    
    // Split on word boundaries while preserving spaces
    const parts = text.split(/(\s+)/);
    
    for (const part of parts) {
      if (/^\s+$/.test(part)) {
        // This is whitespace
        segments.push({
          content: part,
          isWord: false
        });
      } else if (part.trim().length > 0) {
        // This is a word
        segments.push({
          content: part,
          isWord: true,
          wordIndex: wordIndex
        });
        wordIndex++;
      }
    }
    
    return segments;
  };

  const segments = createTextSegments(text);

  const handleWordHover = (wordIndex: number, word: string, isHovering: boolean) => {
    setHoveredWordIndex(isHovering ? wordIndex : -1);
  };

  const handleWordClick = (wordIndex: number, word: string) => {
    onWordClick?.(wordIndex, word);
  };

  return (
    <div
      className={`relative leading-relaxed ${className}`}
      style={{
        userSelect: 'text',
        WebkitUserSelect: 'text',
        MozUserSelect: 'text',
        cursor: 'text'
      }}
    >
      <EnhancedTextHighlighter
        selectedText=""
        selectionRange={null}
        highlightedWordIndex={highlightedWordIndex}
        hoveredWordIndex={hoveredWordIndex}
        enhancedHighlighting={true}
        wordSyncColor={highlightColor}
      >
        <div className="inline">
          {segments.map((segment, index) => {
            if (!segment.isWord) {
              // Render whitespace as-is
              return <span key={`space-${index}`}>{segment.content}</span>;
            }

            // Render word with enhanced span
            const wordIndex = segment.wordIndex!;
            return (
              <EnhancedWordSpan
                key={`word-${wordIndex}-${segment.content}`}
                word={segment.content}
                index={wordIndex}
                isHighlighted={enableWordHighlighting && wordIndex === highlightedWordIndex}
                isSelected={false}
                onWordClick={handleWordClick}
                onWordHover={handleWordHover}
                highlightColor={highlightColor}
              />
            );
          })}
        </div>
      </EnhancedTextHighlighter>
    </div>
  );
};
