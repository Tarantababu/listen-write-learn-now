
import React, { useState } from 'react';
import { WordPositionTracker, type WordPosition } from './WordPositionTracker';
import { HighlightOverlay } from './HighlightOverlay';

interface VirtualHighlightTextProps {
  text: string;
  highlightedWordIndex: number;
  onWordClick?: (wordIndex: number, word: string) => void;
  enableWordHighlighting?: boolean;
  highlightColor?: string;
  className?: string;
}

export const VirtualHighlightText: React.FC<VirtualHighlightTextProps> = ({
  text,
  highlightedWordIndex,
  onWordClick,
  enableWordHighlighting = true,
  highlightColor = 'bg-yellow-300',
  className = ''
}) => {
  const [wordPositions, setWordPositions] = useState<WordPosition[]>([]);
  const [hoveredWordIndex, setHoveredWordIndex] = useState(-1);

  const handlePositionsCalculated = (positions: WordPosition[]) => {
    setWordPositions(positions);
  };

  const handleWordHover = (wordIndex: number, word: string, isHovering: boolean) => {
    setHoveredWordIndex(isHovering ? wordIndex : -1);
  };

  const handleWordClick = (wordIndex: number, word: string) => {
    onWordClick?.(wordIndex, word);
  };

  return (
    <div className={`relative ${className}`}>
      <WordPositionTracker
        text={text}
        onPositionsCalculated={handlePositionsCalculated}
        className="relative z-0"
      />
      
      {enableWordHighlighting && (
        <HighlightOverlay
          positions={wordPositions}
          highlightedWordIndex={highlightedWordIndex}
          hoveredWordIndex={hoveredWordIndex}
          highlightColor={highlightColor}
          onWordClick={handleWordClick}
          onWordHover={handleWordHover}
        />
      )}
    </div>
  );
};
