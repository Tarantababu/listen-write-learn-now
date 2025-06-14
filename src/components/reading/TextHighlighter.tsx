
import React, { useRef, useEffect, useState } from 'react';
import { AudioWordOverlay } from './AudioWordOverlay';

interface HighlightOverlay {
  rect: DOMRect;
  id: string;
  type: 'selection' | 'hover';
}

interface TextHighlighterProps {
  children: React.ReactNode;
  selectedText: string;
  selectionRange: Range | null;
  enhancedHighlighting?: boolean;
  highlightColor?: string;
  animateHighlight?: boolean;
  // New props for enhanced functionality
  hoveredWordIndex?: number;
  highlightedWordIndex?: number;
  wordSyncColor?: string;
  hoverColor?: string;
}

export const TextHighlighter: React.FC<TextHighlighterProps> = ({
  children,
  selectedText,
  selectionRange,
  enhancedHighlighting = false,
  highlightColor = 'bg-blue-200/40',
  animateHighlight = true,
  hoveredWordIndex = -1,
  highlightedWordIndex = -1,
  wordSyncColor = 'bg-yellow-300/80',
  hoverColor = 'bg-gray-200/30'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightOverlays, setHighlightOverlays] = useState<HighlightOverlay[]>([]);

  useEffect(() => {
    const overlays: HighlightOverlay[] = [];

    // Selection highlights
    if (selectedText && selectionRange && containerRef.current?.contains(selectionRange.commonAncestorContainer)) {
      const rects = selectionRange.getClientRects();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      if (containerRect && rects.length > 0) {
        Array.from(rects).forEach((rect, index) => {
          overlays.push({
            rect: {
              ...rect,
              x: rect.x - containerRect.x,
              y: rect.y - containerRect.y,
            } as DOMRect,
            id: `selection-${index}`,
            type: 'selection'
          });
        });
      }
    }

    // Hover highlights
    if (hoveredWordIndex >= 0 && hoveredWordIndex !== highlightedWordIndex && containerRef.current) {
      const wordElement = containerRef.current.querySelector(`[data-word-index="${hoveredWordIndex}"]`);
      if (wordElement) {
        const rect = wordElement.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        overlays.push({
          rect: {
            ...rect,
            x: rect.x - containerRect.x,
            y: rect.y - containerRect.y,
          } as DOMRect,
          id: `hover-${hoveredWordIndex}`,
          type: 'hover'
        });
      }
    }

    setHighlightOverlays(overlays);
  }, [selectedText, selectionRange, highlightedWordIndex, hoveredWordIndex]);

  const getHighlightClasses = (type: HighlightOverlay['type']) => {
    const baseClasses = 'absolute pointer-events-none rounded-sm transition-all duration-200';
    
    if (enhancedHighlighting) {
      switch (type) {
        case 'selection':
          return `${baseClasses} ${highlightColor} border border-blue-400/60 shadow-sm ${
            animateHighlight ? 'animate-in fade-in duration-300' : ''
          }`;
        case 'hover':
          return `${baseClasses} ${hoverColor} border border-gray-400/30 ${
            animateHighlight ? 'duration-150' : ''
          }`;
        default:
          return `${baseClasses} ${highlightColor}`;
      }
    }
    
    // Default highlighting for backward compatibility
    return `${baseClasses} ${highlightColor} border border-blue-300/50`;
  };

  return (
    <div ref={containerRef} className="relative">
      {children}
      
      {/* Audio word synchronization overlay */}
      <AudioWordOverlay
        containerRef={containerRef}
        highlightedWordIndex={highlightedWordIndex}
        highlightColor={wordSyncColor}
        animateHighlight={animateHighlight}
      />
      
      {highlightOverlays.map((overlay) => (
        <div
          key={overlay.id}
          className={getHighlightClasses(overlay.type)}
          style={{
            left: overlay.rect.x,
            top: overlay.rect.y,
            width: overlay.rect.width,
            height: overlay.rect.height,
            zIndex: overlay.type === 'selection' ? 15 : 10,
          }}
        />
      ))}
    </div>
  );
};
