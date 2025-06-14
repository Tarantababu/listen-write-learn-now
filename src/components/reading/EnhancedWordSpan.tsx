
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
  const handleClick = () => {
    onWordClick?.(index, word);
  };

  const handleMouseEnter = () => {
    onWordHover?.(index, word, true);
  };

  const handleMouseLeave = () => {
    onWordHover?.(index, word, false);
  };

  // Always render as a span for stable DOM structure
  return (
    <span
      className={`
        inline-block
        word-span
        ${isHighlighted ? 'word-highlighted' : ''}
        ${isSelected ? 'word-selected' : ''}
        ${className}
      `}
      data-word-index={index}
      data-word={word}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        cursor: 'inherit',
        userSelect: 'text',
        WebkitUserSelect: 'text',
        MozUserSelect: 'text'
      }}
    >
      {word}
    </span>
  );
};
