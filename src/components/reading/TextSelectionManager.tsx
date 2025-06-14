
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
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionRange(null);
    setSelectionPosition(null);
    setShowPopup(false);
    // Don't clear browser selection here - let user do it naturally
  }, []);

  const processSelection = useCallback(() => {
    if (disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      clearSelection();
      return;
    }

    const range = selection.getRangeAt(0);
    const text = range.toString().trim();

    // Check if selection is within our container
    if (!containerRef.current?.contains(range.commonAncestorContainer)) {
      clearSelection();
      return;
    }

    if (text.length > 0) {
      // Get the bounding rectangle of the selection for positioning
      const rect = range.getBoundingClientRect();
      
      // Calculate optimal position for the popup (center horizontally, above selection)
      const x = rect.left + rect.width / 2;
      const y = rect.top;

      setSelectedText(text);
      setSelectionRange(range.cloneRange()); // Clone to avoid range mutation
      setSelectionPosition({ x, y });
      setShowPopup(true);
    } else {
      clearSelection();
    }
  }, [disabled, clearSelection]);

  // Handle selection changes with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleSelectionChange = () => {
      // Clear previous timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Debounce selection processing
      timeoutId = setTimeout(processSelection, 100);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [processSelection]);

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
      
      // Clear selection if clicking outside container
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

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ 
        userSelect: disabled ? 'none' : 'text',
        WebkitUserSelect: disabled ? 'none' : 'text',
        MozUserSelect: disabled ? 'none' : 'text'
      }}
    >
      <TextHighlighter
        selectedText={selectedText}
        selectionRange={selectionRange}
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
