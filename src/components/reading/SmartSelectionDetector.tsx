
import React, { useCallback, useRef } from 'react';

interface SelectionBoundary {
  startWordIndex: number;
  endWordIndex: number;
  selectedWords: string[];
  selectionType: 'single' | 'phrase' | 'sentence' | 'paragraph';
}

interface SmartSelectionDetectorProps {
  children: React.ReactNode;
  onSelectionChange: (boundary: SelectionBoundary | null) => void;
  onSmartSelect: (wordIndex: number, selectionType: 'word' | 'phrase' | 'sentence') => void;
  className?: string;
}

export const SmartSelectionDetector: React.FC<SmartSelectionDetectorProps> = ({
  children,
  onSelectionChange,
  onSmartSelect,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastClickTime = useRef<number>(0);
  const clickCount = useRef<number>(0);

  const getWordsFromSelection = useCallback((selection: Selection): SelectionBoundary | null => {
    if (!selection.rangeCount || !containerRef.current) return null;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (!selectedText) return null;

    // Find word boundaries
    const containerText = containerRef.current.textContent || '';
    const words = containerText.split(/\s+/);
    const selectedWords = selectedText.split(/\s+/);
    
    // Find start and end word indices
    let startWordIndex = -1;
    let endWordIndex = -1;
    
    for (let i = 0; i <= words.length - selectedWords.length; i++) {
      const wordSlice = words.slice(i, i + selectedWords.length);
      if (wordSlice.join(' ').includes(selectedText)) {
        startWordIndex = i;
        endWordIndex = i + selectedWords.length - 1;
        break;
      }
    }

    if (startWordIndex === -1) return null;

    // Determine selection type
    let selectionType: SelectionBoundary['selectionType'] = 'single';
    if (selectedWords.length === 1) {
      selectionType = 'single';
    } else if (selectedWords.length <= 5) {
      selectionType = 'phrase';
    } else if (selectedWords.length <= 15) {
      selectionType = 'sentence';
    } else {
      selectionType = 'paragraph';
    }

    return {
      startWordIndex,
      endWordIndex,
      selectedWords,
      selectionType
    };
  }, []);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection) {
      onSelectionChange(null);
      return;
    }

    const boundary = getWordsFromSelection(selection);
    onSelectionChange(boundary);
  }, [getWordsFromSelection, onSelectionChange]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const wordElement = target.closest('[data-word-index]');
    
    if (!wordElement) return;

    const wordIndex = parseInt(wordElement.getAttribute('data-word-index') || '-1');
    if (wordIndex === -1) return;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;
    
    if (timeSinceLastClick < 500) {
      clickCount.current++;
    } else {
      clickCount.current = 1;
    }
    
    lastClickTime.current = now;

    // Smart selection based on click count
    setTimeout(() => {
      if (clickCount.current === 2) {
        // Double click - select word
        onSmartSelect(wordIndex, 'word');
      } else if (clickCount.current === 3) {
        // Triple click - select phrase/sentence
        onSmartSelect(wordIndex, 'phrase');
      }
      clickCount.current = 0;
    }, 300);
  }, [onSmartSelect]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseUp={handleSelectionChange}
      onKeyUp={handleSelectionChange}
      onClick={handleClick}
      style={{
        userSelect: 'text',
        WebkitUserSelect: 'text',
        MozUserSelect: 'text',
        cursor: 'text'
      }}
    >
      {children}
    </div>
  );
};
