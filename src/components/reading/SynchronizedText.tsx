
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

interface SelectionBoundary {
  startWordIndex: number;
  endWordIndex: number;
  selectedWords: string[];
  selectionType: 'single' | 'phrase' | 'sentence' | 'paragraph';
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
  const [selectionBoundary, setSelectionBoundary] = useState<SelectionBoundary | null>(null);

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
  const words = segments.filter(seg => seg.isWord).map(seg => seg.content);

  const handleWordHover = (wordIndex: number, word: string, isHovering: boolean) => {
    setHoveredWordIndex(isHovering ? wordIndex : -1);
  };

  const handleSelectionChange = () => {
    // Simplified selection handling - let TextSelectionManager handle the actual selection logic
    // This component just focuses on rendering and word highlighting
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setSelectionBoundary(null);
      return;
    }

    const selectedText = selection.toString();
    if (!selectedText.trim()) {
      setSelectionBoundary(null);
      return;
    }

    // Simple boundary detection for visual feedback only
    const selectedWords = selectedText.trim().split(/\s+/);
    const boundary: SelectionBoundary = {
      startWordIndex: 0,
      endWordIndex: selectedWords.length - 1,
      selectedWords,
      selectionType: selectedWords.length === 1 ? 'single' : 
                   selectedWords.length <= 5 ? 'phrase' : 
                   selectedWords.length <= 15 ? 'sentence' : 'paragraph'
    };
    
    setSelectionBoundary(boundary);
  };

  const handleSmartSelect = (wordIndex: number, selectionType: 'word' | 'phrase' | 'sentence') => {
    const word = words[wordIndex];
    
    if (selectionType === 'word') {
      // Select single word
      const range = document.createRange();
      const wordElement = document.querySelector(`[data-word-index="${wordIndex}"]`);
      if (wordElement) {
        range.selectNodeContents(wordElement);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    } else if (selectionType === 'phrase') {
      // Select phrase (5 words around the clicked word)
      const startIndex = Math.max(0, wordIndex - 2);
      const endIndex = Math.min(words.length - 1, wordIndex + 2);
      
      const startElement = document.querySelector(`[data-word-index="${startIndex}"]`);
      const endElement = document.querySelector(`[data-word-index="${endIndex}"]`);
      
      if (startElement && endElement) {
        const range = document.createRange();
        range.setStartBefore(startElement);
        range.setEndAfter(endElement);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
    
    onWordClick?.(wordIndex, word);
  };

  const isWordSelected = (index: number) => {
    if (!selectionBoundary) return false;
    return index >= selectionBoundary.startWordIndex && index <= selectionBoundary.endWordIndex;
  };

  return (
    <div
      className={`relative leading-relaxed ${className}`}
      onMouseUp={handleSelectionChange}
      onKeyUp={handleSelectionChange}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const wordElement = target.closest('[data-word-index]');
        
        if (!wordElement) return;

        const wordIndex = parseInt(wordElement.getAttribute('data-word-index') || '-1');
        if (wordIndex === -1) return;

        const now = Date.now();
        const timeSinceLastClick = now - (handleSmartSelect as any).lastClickTime || 0;
        
        if (timeSinceLastClick < 500) {
          (handleSmartSelect as any).clickCount = ((handleSmartSelect as any).clickCount || 0) + 1;
        } else {
          (handleSmartSelect as any).clickCount = 1;
        }
        
        (handleSmartSelect as any).lastClickTime = now;

        // Smart selection based on click count
        setTimeout(() => {
          const clickCount = (handleSmartSelect as any).clickCount || 0;
          if (clickCount === 2) {
            handleSmartSelect(wordIndex, 'word');
          } else if (clickCount === 3) {
            handleSmartSelect(wordIndex, 'phrase');
          }
          (handleSmartSelect as any).clickCount = 0;
        }, 300);
      }}
      style={{
        userSelect: 'text',
        WebkitUserSelect: 'text',
        MozUserSelect: 'text',
        cursor: 'text'
      }}
    >
      <EnhancedTextHighlighter
        selectedText={selectionBoundary?.selectedWords.join(' ') || ''}
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
                isSelected={isWordSelected(wordIndex)}
                onWordClick={onWordClick}
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
