
import React from 'react';

interface SimplifiedSynchronizedTextProps {
  text: string;
  highlightedWordIndex: number;
  onWordClick?: (wordIndex: number, word: string) => void;
  enableWordHighlighting?: boolean;
  highlightColor?: string;
  className?: string;
}

export const SimplifiedSynchronizedText: React.FC<SimplifiedSynchronizedTextProps> = ({
  text,
  highlightedWordIndex,
  onWordClick,
  enableWordHighlighting = true,
  highlightColor = 'bg-yellow-300',
  className = ''
}) => {
  // Split text into words while preserving original spacing
  const createWordMap = (text: string) => {
    const words: { word: string; start: number; end: number }[] = [];
    let wordIndex = 0;
    
    // Use regex to find word positions
    const wordRegex = /\S+/g;
    let match;
    
    while ((match = wordRegex.exec(text)) !== null) {
      words.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
      wordIndex++;
    }
    
    return words;
  };

  const words = createWordMap(text);

  // Create overlay highlights for the currently highlighted word
  const createHighlightOverlays = () => {
    if (!enableWordHighlighting || highlightedWordIndex < 0 || highlightedWordIndex >= words.length) {
      return null;
    }

    const highlightedWord = words[highlightedWordIndex];
    
    return (
      <div
        className="absolute pointer-events-none z-10"
        style={{
          left: `${(highlightedWord.start / text.length) * 100}%`,
          width: `${((highlightedWord.end - highlightedWord.start) / text.length) * 100}%`,
          top: 0,
          height: '100%'
        }}
      >
        <div className={`h-full rounded-sm ${highlightColor} opacity-80 animate-pulse`} />
      </div>
    );
  };

  const handleClick = (event: React.MouseEvent) => {
    if (!onWordClick) return;

    const selection = window.getSelection();
    if (!selection || selection.toString().length > 0) return; // Don't interfere with text selection

    const target = event.target as HTMLElement;
    const textContent = target.textContent || '';
    const clickOffset = getClickOffset(event, target);
    
    // Find which word was clicked
    const clickedWordIndex = words.findIndex(word => 
      clickOffset >= word.start && clickOffset <= word.end
    );
    
    if (clickedWordIndex >= 0) {
      onWordClick(clickedWordIndex, words[clickedWordIndex].word);
    }
  };

  const getClickOffset = (event: React.MouseEvent, element: HTMLElement): number => {
    // Simple approximation - in a real implementation you'd use Range API
    const rect = element.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const elementWidth = rect.width;
    const textLength = element.textContent?.length || 0;
    
    return Math.floor((clickX / elementWidth) * textLength);
  };

  return (
    <div
      className={`relative leading-relaxed ${className}`}
      style={{
        userSelect: 'text',
        WebkitUserSelect: 'text',
        MozUserSelect: 'text',
        cursor: 'text'
      }}
      onClick={handleClick}
    >
      {/* Pure text content - preserves native selection */}
      <div 
        className="relative z-0"
        data-text-content="true"
      >
        {text}
      </div>
      
      {/* Overlay highlights - doesn't interfere with selection */}
      {createHighlightOverlays()}
      
      {/* Invisible word position markers for click detection */}
      {words.map((word, index) => (
        <span
          key={`word-marker-${index}`}
          data-word-index={index}
          data-word={word.word}
          className="absolute pointer-events-none opacity-0"
          style={{
            left: `${(word.start / text.length) * 100}%`,
            width: `${((word.end - word.start) / text.length) * 100}%`,
            top: 0,
            height: '100%'
          }}
        />
      ))}
    </div>
  );
};
