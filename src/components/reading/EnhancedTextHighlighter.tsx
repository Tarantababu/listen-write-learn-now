
import React, { useRef, useEffect, useState } from 'react';

interface HighlightRegion {
  rect: DOMRect;
  id: string;
  type: 'selection' | 'word-sync' | 'hover';
}

interface EnhancedTextHighlighterProps {
  children: React.ReactNode;
  selectedText: string;
  selectionRange: Range | null;
  highlightedWordIndex: number;
  hoveredWordIndex?: number;
  enhancedHighlighting?: boolean;
  highlightColor?: string;
  wordSyncColor?: string;
  hoverColor?: string;
  animateHighlight?: boolean;
}

export const EnhancedTextHighlighter: React.FC<EnhancedTextHighlighterProps> = ({
  children,
  selectedText,
  selectionRange,
  highlightedWordIndex,
  hoveredWordIndex = -1,
  enhancedHighlighting = true,
  highlightColor = 'bg-blue-200/60',
  wordSyncColor = 'bg-yellow-300/80',
  hoverColor = 'bg-gray-200/40',
  animateHighlight = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightRegions, setHighlightRegions] = useState<HighlightRegion[]>([]);

  useEffect(() => {
    const regions: HighlightRegion[] = [];

    // Add selection highlights
    if (selectedText && selectionRange && containerRef.current?.contains(selectionRange.commonAncestorContainer)) {
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

    // Add word sync highlights
    if (highlightedWordIndex >= 0 && containerRef.current) {
      const wordElement = containerRef.current.querySelector(`[data-word-index="${highlightedWordIndex}"]`);
      if (wordElement) {
        const rect = wordElement.getBoundingClientRect();
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
      const wordElement = containerRef.current.querySelector(`[data-word-index="${hoveredWordIndex}"]`);
      if (wordElement) {
        const rect = wordElement.getBoundingClientRect();
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
    const baseClasses = 'absolute pointer-events-none rounded-sm';
    
    if (!enhancedHighlighting) {
      return `${baseClasses} ${highlightColor} border border-blue-300/50 transition-all duration-200`;
    }
    
    switch (type) {
      case 'selection':
        return `${baseClasses} ${highlightColor} border border-blue-400/60 shadow-sm ${
          animateHighlight ? 'transition-all duration-300 animate-in fade-in' : ''
        }`;
      case 'word-sync':
        return `${baseClasses} ${wordSyncColor} border border-yellow-500/60 shadow-md ${
          animateHighlight ? 'transition-all duration-200 animate-pulse' : ''
        }`;
      case 'hover':
        return `${baseClasses} ${hoverColor} border border-gray-400/40 ${
          animateHighlight ? 'transition-all duration-150' : ''
        }`;
      default:
        return `${baseClasses} ${highlightColor}`;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {children}
      
      {/* Render highlight overlays */}
      {highlightRegions.map((region) => (
        <div
          key={region.id}
          className={getHighlightClasses(region.type)}
          style={{
            left: region.rect.x,
            top: region.rect.y,
            width: region.rect.width,
            height: region.rect.height,
            zIndex: region.type === 'word-sync' ? 20 : region.type === 'selection' ? 15 : 10,
          }}
        />
      ))}
    </div>
  );
};
