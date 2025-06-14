
import React, { useRef, useEffect, useState } from 'react';

interface HighlightOverlay {
  rect: DOMRect;
  id: string;
}

interface TextHighlighterProps {
  children: React.ReactNode;
  isSelecting: boolean;
  onSelectionChange?: (selection: Selection | null, range: Range | null) => void;
}

export const TextHighlighter: React.FC<TextHighlighterProps> = ({
  children,
  isSelecting,
  onSelectionChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightOverlays, setHighlightOverlays] = useState<HighlightOverlay[]>([]);

  useEffect(() => {
    if (!isSelecting) {
      setHighlightOverlays([]);
      return;
    }

    const updateHighlights = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setHighlightOverlays([]);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!containerRef.current?.contains(range.commonAncestorContainer)) {
        setHighlightOverlays([]);
        return;
      }

      // Create highlight overlays for the selection
      const rects = range.getClientRects();
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      if (!containerRect) return;

      const overlays: HighlightOverlay[] = Array.from(rects).map((rect, index) => ({
        rect: {
          ...rect,
          x: rect.x - containerRect.x,
          y: rect.y - containerRect.y,
        } as DOMRect,
        id: `highlight-${index}`
      }));

      setHighlightOverlays(overlays);
      onSelectionChange?.(selection, range);
    };

    const handleSelectionChange = () => {
      // Small delay to ensure selection is complete
      setTimeout(updateHighlights, 50);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [isSelecting, onSelectionChange]);

  return (
    <div ref={containerRef} className="relative">
      {children}
      
      {/* Highlight overlays */}
      {highlightOverlays.map((overlay) => (
        <div
          key={overlay.id}
          className="absolute pointer-events-none bg-blue-200/40 border border-blue-300/50 rounded-sm transition-all duration-200"
          style={{
            left: overlay.rect.x,
            top: overlay.rect.y,
            width: overlay.rect.width,
            height: overlay.rect.height,
          }}
        />
      ))}
    </div>
  );
};
