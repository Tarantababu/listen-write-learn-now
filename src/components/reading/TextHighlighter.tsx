
import React, { useRef, useEffect, useState } from 'react';

interface HighlightOverlay {
  rect: DOMRect;
  id: string;
}

interface TextHighlighterProps {
  children: React.ReactNode;
  selectedText: string;
  selectionRange: Range | null;
  enhancedHighlighting?: boolean; // New prop for enhanced highlighting
  highlightColor?: string; // Customizable highlight color
  animateHighlight?: boolean; // Animation option
}

export const TextHighlighter: React.FC<TextHighlighterProps> = ({
  children,
  selectedText,
  selectionRange,
  enhancedHighlighting = false,
  highlightColor = 'bg-blue-200/40',
  animateHighlight = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightOverlays, setHighlightOverlays] = useState<HighlightOverlay[]>([]);

  useEffect(() => {
    if (!selectedText || !selectionRange) {
      setHighlightOverlays([]);
      return;
    }

    if (!containerRef.current?.contains(selectionRange.commonAncestorContainer)) {
      setHighlightOverlays([]);
      return;
    }

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

  // Enhanced highlight styling based on prop
  const getHighlightClasses = () => {
    const baseClasses = `absolute pointer-events-none rounded-sm`;
    
    if (enhancedHighlighting) {
      return `${baseClasses} ${highlightColor} border border-blue-300/50 shadow-sm ${
        animateHighlight ? 'transition-all duration-200 animate-pulse' : ''
      }`;
    }
    
    // Default highlighting for backward compatibility
    return `${baseClasses} ${highlightColor} border border-blue-300/50 transition-all duration-200`;
  };

  return (
    <div ref={containerRef} className="relative">
      {children}
      
      {highlightOverlays.map((overlay) => (
        <div
          key={overlay.id}
          className={getHighlightClasses()}
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
