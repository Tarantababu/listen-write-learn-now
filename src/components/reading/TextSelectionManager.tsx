
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SelectionActions } from './SelectionActions';

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
  const [selectionTimeout, setSelectionTimeout] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        // Get the bounding rectangle of the selection
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Position the actions above the selection with better centering
        const x = rect.left + rect.width / 2;
        const y = rect.top - 60; // Position above selection with more space

        setSelectedText(text);
        setSelectionPosition({ x, y });
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
      
      // Don't clear if clicking on the selection actions popup
      const isClickingOnActions = target && (
        target.nodeType === Node.ELEMENT_NODE &&
        (target as Element).closest('[data-selection-actions]')
      );
      
      if (isClickingOnActions) return;
      
      if (containerRef.current && !containerRef.current.contains(target)) {
        clearSelection();
      }
    };

    if (isSelecting) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSelecting, clearSelection]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSelecting) {
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelecting, clearSelection]);

  // Enhanced touch support for mobile
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (disabled) return;
    
    // Prevent default touch behavior that might interfere with selection
    event.preventDefault();
    
    // Trigger the same logic as mouse up
    handleMouseUp();
  }, [disabled, handleMouseUp]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
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
      {children}
      
      {isSelecting && selectionPosition && (
        <div data-selection-actions>
          <SelectionActions
            position={selectionPosition}
            selectedText={selectedText}
            onCreateDictation={handleCreateDictation}
            onCreateBidirectional={handleCreateBidirectional}
            onClose={clearSelection}
          />
        </div>
      )}
    </div>
  );
};
