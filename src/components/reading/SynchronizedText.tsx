
import React from 'react';

interface SynchronizedTextProps {
  text: string;
  highlightedWordIndex: number;
  onWordClick?: (wordIndex: number, word: string) => void;
  enableWordHighlighting?: boolean;
  highlightColor?: string;
  className?: string;
}

export const SynchronizedText: React.FC<SynchronizedTextProps> = ({
  text,
  highlightedWordIndex,
  onWordClick,
  enableWordHighlighting = true,
  highlightColor = 'bg-yellow-300',
  className = ''
}) => {
  const words = text.split(/\s+/);

  const getWordClasses = (index: number) => {
    const baseClasses = 'transition-all duration-300 cursor-pointer rounded px-1 py-0.5';
    
    if (enableWordHighlighting && index === highlightedWordIndex) {
      return `${baseClasses} ${highlightColor} shadow-sm scale-105 font-medium`;
    }
    
    return `${baseClasses} hover:bg-gray-100`;
  };

  return (
    <div className={`leading-relaxed ${className}`}>
      {words.map((word, index) => (
        <React.Fragment key={index}>
          <span
            className={getWordClasses(index)}
            onClick={() => onWordClick?.(index, word)}
          >
            {word}
          </span>
          {index < words.length - 1 && ' '}
        </React.Fragment>
      ))}
    </div>
  );
};
