
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
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    if (disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = range.toString().trim();

    if (text.length > 0 && containerRef.current?.contains(range.commonAncestorContainer)) {
      // Get the bounding rectangle of the selection
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Position the actions relative to the container
      const x = rect.left + rect.width / 2 - containerRect.left;
      const y = rect.top - containerRect.top - 10; // Position above selection

      setSelectedText(text);
      setSelectionPosition({ x, y });
      setIsSelecting(true);
    } else {
      clearSelection();
    }
  }, [disabled]);

  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      clearSelection();
    }
  }, [disabled]);

  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionPosition(null);
    setIsSelecting(false);
    window.getSelection()?.removeAllRanges();
  }, []);

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

  // Clear selection when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDown}
      style={{ userSelect: disabled ? 'none' : 'text' }}
    >
      {children}
      
      {isSelecting && selectionPosition && (
        <SelectionActions
          position={selectionPosition}
          selectedText={selectedText}
          onCreateDictation={handleCreateDictation}
          onCreateBidirectional={handleCreateBidirectional}
          onClose={clearSelection}
        />
      )}
    </div>
  );
};
