
import React, { useRef, useEffect, useState } from 'react';

interface HighlightOverlay {
  rect: DOMRect;
  id: string;
}

interface TextHighlighterProps {
  children: React.ReactNode;
  selectedText: string;
  selectionRange: Range | null;
}

export const TextHighlighter: React.FC<TextHighlighterProps> = ({
  children,
  selectedText,
  selectionRange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightOverlays, setHighlightOverlays] = useState<HighlightOverlay[]>([]);

  useEffect(() => {
    // Clear highlights if no selection
    if (!selectedText || !selectionRange) {
      setHighlightOverlays([]);
      return;
    }

    // Ensure the selection is within our container
    if (!containerRef.current?.contains(selectionRange.commonAncestorContainer)) {
      setHighlightOverlays([]);
      return;
    }

    // Create highlight overlays for the selection
    const rects = selectionRange.getClientRects();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (!containerRect || rects.length === 0) {
      setHighlightOverlays([]);
      return;
    }

    const overlays: HighlightOverlay[] = Array.from(rects).map((rect, index) => ({
      rect: {
        ...rect,
        x: rect.x - containerRect.x,
        y: rect.y - containerRect.y,
      } as DOMRect,
      id: `highlight-${index}`
    }));

    setHighlightOverlays(overlays);
  }, [selectedText, selectionRange]);

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
