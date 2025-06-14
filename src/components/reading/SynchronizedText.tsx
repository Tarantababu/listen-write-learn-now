
import React, { useState } from 'react';
import { EnhancedWordSpan } from './EnhancedWordSpan';
import { SmartSelectionDetector } from './SmartSelectionDetector';
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

  const words = text.split(/\s+/);

  const handleWordHover = (wordIndex: number, word: string, isHovering: boolean) => {
    setHoveredWordIndex(isHovering ? wordIndex : -1);
  };

  const handleSelectionChange = (boundary: SelectionBoundary | null) => {
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
    <SmartSelectionDetector
      onSelectionChange={handleSelectionChange}
      onSmartSelect={handleSmartSelect}
      className={`leading-relaxed ${className}`}
    >
      <EnhancedTextHighlighter
        selectedText={selectionBoundary?.selectedWords.join(' ') || ''}
        selectionRange={null} // Will be handled by the detector
        highlightedWordIndex={highlightedWordIndex}
        hoveredWordIndex={hoveredWordIndex}
        enhancedHighlighting={true}
        wordSyncColor={highlightColor}
      >
        <div className="flex flex-wrap items-baseline gap-x-1 gap-y-2">
          {words.map((word, index) => (
            <EnhancedWordSpan
              key={`${index}-${word}`}
              word={word}
              index={index}
              isHighlighted={enableWordHighlighting && index === highlightedWordIndex}
              isSelected={isWordSelected(index)}
              onWordClick={onWordClick}
              onWordHover={handleWordHover}
              highlightColor={highlightColor}
            />
          ))}
        </div>
      </EnhancedTextHighlighter>
    </SmartSelectionDetector>
  );
};
