
import React, { useRef, useEffect, useState } from 'react';

interface AudioWordOverlayProps {
  containerRef: React.RefObject<HTMLElement>;
  highlightedWordIndex: number;
  highlightColor?: string;
  animateHighlight?: boolean;
}

interface WordHighlight {
  rect: DOMRect;
  wordIndex: number;
}

export const AudioWordOverlay: React.FC<AudioWordOverlayProps> = ({
  containerRef,
  highlightedWordIndex,
  highlightColor = 'bg-yellow-300/80',
  animateHighlight = true
}) => {
  const [wordHighlight, setWordHighlight] = useState<WordHighlight | null>(null);

  useEffect(() => {
    if (highlightedWordIndex >= 0 && containerRef.current) {
      const wordElement = containerRef.current.querySelector(`[data-word-index="${highlightedWordIndex}"]`);
      
      if (wordElement) {
        const rect = wordElement.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        setWordHighlight({
          rect: {
            ...rect,
            x: rect.x - containerRect.x,
            y: rect.y - containerRect.y,
          } as DOMRect,
          wordIndex: highlightedWordIndex
        });
      } else {
        setWordHighlight(null);
      }
    } else {
      setWordHighlight(null);
    }
  }, [highlightedWordIndex, containerRef]);

  if (!wordHighlight) {
    return null;
  }

  return (
    <div
      className={`absolute pointer-events-none rounded-sm border border-yellow-500/60 shadow-md z-20 ${highlightColor} ${
        animateHighlight ? 'transition-all duration-200 animate-pulse' : ''
      }`}
      style={{
        left: wordHighlight.rect.x,
        top: wordHighlight.rect.y,
        width: wordHighlight.rect.width,
        height: wordHighlight.rect.height,
      }}
    />
  );
};
