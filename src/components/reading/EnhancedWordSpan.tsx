
import React from 'react';

interface EnhancedWordSpanProps {
  word: string;
  index: number;
  isHighlighted: boolean;
  isSelected: boolean;
  onWordClick?: (wordIndex: number, word: string) => void;
  onWordHover?: (wordIndex: number, word: string, isHovering: boolean) => void;
  highlightColor?: string;
  className?: string;
}

export const EnhancedWordSpan: React.FC<EnhancedWordSpanProps> = ({
  word,
  index,
  isHighlighted,
  isSelected,
  onWordClick,
  onWordHover,
  highlightColor = 'bg-yellow-300',
  className = ''
}) => {
  // Only render a span with styling if the word is highlighted by audio sync
  if (isHighlighted) {
    return (
      <span
        className={`inline-block px-1 py-0.5 mx-0.5 rounded-sm transition-all duration-200 ${highlightColor} shadow-sm scale-105 font-medium z-10 ${className}`}
        data-word-index={index}
        data-word={word}
        style={{
          transformOrigin: 'center',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased',
          animation: 'pulse 0.5s ease-in-out'
        }}
      >
        {word}
        <div 
          className="absolute inset-0 rounded-sm pointer-events-none bg-yellow-400/20 border border-yellow-500/30"
        />
      </span>
    );
  }

  // For non-highlighted words, render plain text to preserve native selection
  return <>{word}</>;
};
