
import React from 'react';

interface EnhancedWordSpanProps {
  word: string;
  index: number;
  className?: string;
}

export const EnhancedWordSpan: React.FC<EnhancedWordSpanProps> = ({
  word,
  index,
  className = ''
}) => {
  // Always render plain text with data attributes for audio synchronization
  // No styling or event handlers to preserve native text selection
  return (
    <span
      className={className}
      data-word-index={index}
      data-word={word}
    >
      {word}
    </span>
  );
};
