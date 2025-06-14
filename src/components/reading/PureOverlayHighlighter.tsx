
import React, { useRef, useEffect, useState } from 'react';

interface HighlightRegion {
  rect: DOMRect;
  id: string;
  type: 'selection' | 'word-sync' | 'hover';
}

interface PureOverlayHighlighterProps {
  children: React.ReactNode;
  selectedText: string;
  selectionRange: Range | null;
  highlightedWordIndex: number;
  hoveredWordIndex?: number;
  enhancedHighlighting?: boolean;
  highlightColor?: string;
  wordSyncColor?: string;
  hoverColor?: string;
}

export const PureOverlayHighlighter: React.FC<PureOverlayHighlighterProps> = ({
  children,
  selectedText,
  selectionRange,
  highlightedWordIndex,
  hoveredWordIndex = -1,
  enhancedHighlighting = true,
  highlightColor = 'bg-blue-200/60',
  wordSyncColor = 'bg-yellow-300/80',
  hoverColor = 'bg-gray-200/40'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightRegions, setHighlightRegions] = useState<HighlightRegion[]>([]);

  useEffect(() => {
    const regions: HighlightRegion[] = [];

    // Add selection highlights - only if we have a valid selection within our container
    if (selectedText && selectionRange && containerRef.current) {
      const containerContainsSelection = containerRef.current.contains(selectionRange.commonAncestorContainer) ||
        containerRef.current === selectionRange.commonAncestorContainer;
      
      if (containerContainsSelection) {
        const rects = selectionRange.getClientRects();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        Array.from(rects).forEach((rect, index) => {
          regions.push({
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

    // Add word sync highlights - find the word marker elements
    if (highlightedWordIndex >= 0 && containerRef.current) {
      const wordMarker = containerRef.current.querySelector(`[data-word-index="${highlightedWordIndex}"]`);
      if (wordMarker) {
        const rect = wordMarker.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        regions.push({
          rect: {
            ...rect,
            x: rect.x - containerRect.x,
            y: rect.y - containerRect.y,
          } as DOMRect,
          id: `word-sync-${highlightedWordIndex}`,
          type: 'word-sync'
        });
      }
    }

    // Add hover highlights
    if (hoveredWordIndex >= 0 && hoveredWordIndex !== highlightedWordIndex && containerRef.current) {
      const wordMarker = containerRef.current.querySelector(`[data-word-index="${hoveredWordIndex}"]`);
      if (wordMarker) {
        const rect = wordMarker.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        regions.push({
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

    setHighlightRegions(regions);
  }, [selectedText, selectionRange, highlightedWordIndex, hoveredWordIndex]);

  const getHighlightClasses = (type: HighlightRegion['type']) => {
    const baseClasses = 'absolute pointer-events-none rounded-sm transition-all duration-200';
    
    if (!enhancedHighlighting) {
      return `${baseClasses} ${highlightColor}`;
    }
    
    switch (type) {
      case 'selection':
        return `${baseClasses} ${highlightColor} border border-blue-400/60 shadow-sm`;
      case 'word-sync':
        return `${baseClasses} ${wordSyncColor} border border-yellow-500/60 shadow-md animate-pulse`;
      case 'hover':
        return `${baseClasses} ${hoverColor} border border-gray-400/40`;
      default:
        return `${baseClasses} ${highlightColor}`;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {children}
      
      {/* Pure overlay highlights - completely non-interactive */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {highlightRegions.map((region) => (
          <div
            key={region.id}
            className={getHighlightClasses(region.type)}
            style={{
              left: region.rect.x,
              top: region.rect.y,
              width: region.rect.width,
              height: region.rect.height,
            }}
          />
        ))}
      </div>
    </div>
  );
};
