
import React, { useState } from 'react';

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
  const [isHovered, setIsHovered] = useState(false);

  const getWordClasses = () => {
    const baseClasses = 'inline-block px-1 py-0.5 mx-0.5 rounded-sm transition-all duration-200 cursor-text select-text relative';
    
    let stateClasses = '';
    
    if (isHighlighted) {
      stateClasses += ` ${highlightColor} shadow-sm scale-105 font-medium z-10`;
    } else if (isSelected) {
      stateClasses += ' bg-blue-200/60 border border-blue-300/50 shadow-sm';
    } else if (isHovered) {
      stateClasses += ' bg-gray-100/80 shadow-sm scale-102';
    } else {
      stateClasses += ' hover:bg-gray-50/60';
    }
    
    // Add enhanced cursor feedback
    stateClasses += ' hover:shadow-md hover:z-20';
    
    return `${baseClasses} ${stateClasses} ${className}`;
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onWordHover?.(index, word, true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onWordHover?.(index, word, false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWordClick?.(index, word);
  };

  return (
    <span
      className={getWordClasses()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      data-word-index={index}
      data-word={word}
      style={{
        // Enhanced cursor feedback
        transformOrigin: 'center',
        backfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {word}
      
      {/* Subtle highlight overlay for better visual feedback */}
      {(isHighlighted || isSelected || isHovered) && (
        <div 
          className={`absolute inset-0 rounded-sm pointer-events-none ${
            isHighlighted 
              ? 'bg-yellow-400/20 border border-yellow-500/30' 
              : isSelected 
                ? 'bg-blue-400/20 border border-blue-500/30'
                : 'bg-gray-400/10'
          }`}
          style={{
            animation: isHighlighted ? 'pulse 0.5s ease-in-out' : undefined
          }}
        />
      )}
    </span>
  );
};
