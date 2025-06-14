
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SelectionPopup } from './SelectionPopup';
import { TextHighlighter } from './TextHighlighter';

interface TextSelectionManagerProps {
  children: React.ReactNode;
  onCreateDictation: (selectedText: string) => void;
  onCreateBidirectional: (selectedText: string) => void;
  disabled?: boolean;
}

export const TextSelectionManager: React.FC<TextSelectionManagerProps> = ({
  children,
  onCreateDictation,
  onCreateBidirectional,
  disabled = false
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectionTimeout, setSelectionTimeout] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectionChange = useCallback((selection: Selection | null, range: Range | null) => {
    if (disabled || !selection || !range) return;

    const text = range.toString().trim();
    
    if (text.length > 0) {
      // Get the bounding rectangle of the selection for positioning
      const rect = range.getBoundingClientRect();
      
      // Calculate optimal position for the popup
      const x = rect.left + rect.width / 2;
      const y = rect.top;

      setSelectedText(text);
      setSelectionPosition({ x, y });
      setIsSelecting(true);
      
      // Show popup after a brief delay to ensure selection is stable
      setTimeout(() => {
        setShowPopup(true);
      }, 150);
    } else {
      clearSelection();
    }
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    if (disabled) return;

    // Clear any existing timeout
    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
    }

    // Small delay to ensure selection is complete
    const timeout = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const text = range.toString().trim();

      if (text.length > 0 && containerRef.current?.contains(range.commonAncestorContainer)) {
        // Selection will be handled by TextHighlighter
        setIsSelecting(true);
      } else {
        clearSelection();
      }
    }, 100);

    setSelectionTimeout(timeout);
  }, [disabled, selectionTimeout]);

  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      clearSelection();
    }
  }, [disabled]);

  const clearSelection = useCallback(() => {
    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
      setSelectionTimeout(null);
    }
    setSelectedText('');
    setSelectionPosition(null);
    setIsSelecting(false);
    setShowPopup(false);
    window.getSelection()?.removeAllRanges();
  }, [selectionTimeout]);

  const handleCreateDictation = useCallback(() => {
    if (selectedText) {
      onCreateDictation(selectedText);
      clearSelection();
    }
  }, [selectedText, onCreateDictation, clearSelection]);

  const handleCreateBidirectional = useCallback(() => {
    if (selectedText) {
      onCreateBidirectional(selectedText);
      clearSelection();
    }
  }, [selectedText, onCreateBidirectional, clearSelection]);

  // Enhanced click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't clear if clicking on the selection popup
      const isClickingOnPopup = target && (
        target.nodeType === Node.ELEMENT_NODE &&
        (target as Element).closest('[role="dialog"]')
      );
      
      if (isClickingOnPopup) return;
      
      if (containerRef.current && !containerRef.current.contains(target)) {
        clearSelection();
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopup, clearSelection]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPopup) {
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPopup, clearSelection]);

  // Enhanced touch support for mobile
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (disabled) return;
    
    // Allow default touch behavior for text selection
    setTimeout(() => {
      handleMouseUp();
    }, 100);
  }, [disabled, handleMouseUp]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchend', handleTouchEnd);
      return () => container.removeEventListener('touchend', handleTouchEnd);
    }
  }, [handleTouchEnd]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
    };
  }, [selectionTimeout]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDown}
      style={{ 
        userSelect: disabled ? 'none' : 'text',
        WebkitUserSelect: disabled ? 'none' : 'text',
        MozUserSelect: disabled ? 'none' : 'text'
      }}
    >
      <TextHighlighter
        isSelecting={isSelecting}
        onSelectionChange={handleSelectionChange}
      >
        {children}
      </TextHighlighter>
      
      {/* Portal-based popup */}
      {selectionPosition && (
        <SelectionPopup
          position={selectionPosition}
          selectedText={selectedText}
          onCreateDictation={handleCreateDictation}
          onCreateBidirectional={handleCreateBidirectional}
          onClose={clearSelection}
          isVisible={showPopup}
        />
      )}
    </div>
  );
};
