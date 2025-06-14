
import React, { useRef } from 'react';
import { EnhancedWordSpan } from './EnhancedWordSpan';
import { AudioWordOverlay } from './AudioWordOverlay';

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
  highlightColor = 'bg-yellow-300/80',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleWordClick = (wordIndex: number, word: string) => {
    onWordClick?.(wordIndex, word);
  };

  return (
    <div
      ref={containerRef}
      className={`relative leading-relaxed ${className}`}
      style={{
        userSelect: 'text',
        WebkitUserSelect: 'text',
        MozUserSelect: 'text',
        cursor: 'text'
      }}
      onClick={(e) => {
        // Handle word clicks through event delegation
        const target = e.target as HTMLElement;
        const wordIndex = target.getAttribute('data-word-index');
        const word = target.getAttribute('data-word');
        
        if (wordIndex !== null && word !== null) {
          handleWordClick(parseInt(wordIndex), word);
        }
      }}
    >
      <div className="inline">
        {segments.map((segment, index) => {
          if (!segment.isWord) {
            // Render whitespace as-is
            return <span key={`space-${index}`}>{segment.content}</span>;
          }

          // Render word with plain text span
          const wordIndex = segment.wordIndex!;
          return (
            <EnhancedWordSpan
              key={`word-${wordIndex}-${segment.content}`}
              word={segment.content}
              index={wordIndex}
            />
          );
        })}
      </div>
      
      {/* Audio word overlay for highlighting */}
      {enableWordHighlighting && (
        <AudioWordOverlay
          containerRef={containerRef}
          highlightedWordIndex={highlightedWordIndex}
          highlightColor={highlightColor}
          animateHighlight={true}
        />
      )}
    </div>
  );
};
