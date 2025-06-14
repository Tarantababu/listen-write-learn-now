
import React from 'react';
import type { WordPosition } from './WordPositionTracker';

interface HighlightOverlayProps {
  positions: WordPosition[];
  highlightedWordIndex: number;
  hoveredWordIndex: number;
  highlightColor?: string;
  onWordClick?: (wordIndex: number, word: string) => void;
  onWordHover?: (wordIndex: number, word: string, isHovering: boolean) => void;
}

export const HighlightOverlay: React.FC<HighlightOverlayProps> = ({
  positions,
  highlightedWordIndex,
  hoveredWordIndex,
  highlightColor = 'bg-yellow-300',
  onWordClick,
  onWordHover
}) => {
  const handleWordClick = (position: WordPosition) => {
    onWordClick?.(position.index, position.word);
  };

  const handleWordHover = (position: WordPosition, isHovering: boolean) => {
    onWordHover?.(position.index, position.word, isHovering);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {positions.map((position) => {
        const isHighlighted = position.index === highlightedWordIndex;
        const isHovered = position.index === hoveredWordIndex;
        
        return (
          <div
            key={`overlay-${position.index}-${position.word}`}
            className={`
              absolute pointer-events-auto cursor-pointer transition-all duration-200 ease-out
              ${isHighlighted ? 'z-10' : 'z-0'}
              ${isHighlighted ? highlightColor : ''}
              ${isHovered && !isHighlighted ? 'bg-gray-50/40' : ''}
              ${isHighlighted ? 'shadow-sm font-medium scale-105' : ''}
            `}
            style={{
              left: `${position.left}px`,
              top: `${position.top}px`,
              width: `${position.width}px`,
              height: `${position.height}px`,
              borderRadius: '2px',
              transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
            }}
            onClick={() => handleWordClick(position)}
            onMouseEnter={() => handleWordHover(position, true)}
            onMouseLeave={() => handleWordHover(position, false)}
          />
        );
      })}
    </div>
  );
};
