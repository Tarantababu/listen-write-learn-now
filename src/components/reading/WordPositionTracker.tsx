
import React, { useEffect, useRef, useState } from 'react';

export interface WordPosition {
  index: number;
  word: string;
  left: number;
  top: number;
  width: number;
  height: number;
  textLength: number;
  startOffset: number;
  endOffset: number;
}

interface WordPositionTrackerProps {
  text: string;
  onPositionsCalculated: (positions: WordPosition[]) => void;
  className?: string;
}

export const WordPositionTracker: React.FC<WordPositionTrackerProps> = ({
  text,
  onPositionsCalculated,
  className = ''
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<WordPosition[]>([]);

  const calculateWordPositions = () => {
    if (!textRef.current) return;

    const element = textRef.current;
    const range = document.createRange();
    const selection = window.getSelection();
    const positions: WordPosition[] = [];
    
    // Get the text node
    const textNode = element.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;

    // Split text into words while tracking positions
    const words = text.split(/(\s+)/);
    let currentOffset = 0;
    let wordIndex = 0;

    for (const part of words) {
      if (/^\s+$/.test(part)) {
        // Skip whitespace but track offset
        currentOffset += part.length;
        continue;
      }

      if (part.trim().length > 0) {
        try {
          // Set range for this word
          range.setStart(textNode, currentOffset);
          range.setEnd(textNode, currentOffset + part.length);
          
          // Get position
          const rect = range.getBoundingClientRect();
          const containerRect = element.getBoundingClientRect();
          
          if (rect.width > 0 && rect.height > 0) {
            positions.push({
              index: wordIndex,
              word: part,
              left: rect.left - containerRect.left,
              top: rect.top - containerRect.top,
              width: rect.width,
              height: rect.height,
              textLength: part.length,
              startOffset: currentOffset,
              endOffset: currentOffset + part.length
            });
          }
          
          wordIndex++;
        } catch (error) {
          console.warn('Error calculating word position:', error);
        }
      }
      
      currentOffset += part.length;
    }

    setPositions(positions);
    onPositionsCalculated(positions);
  };

  useEffect(() => {
    const timer = setTimeout(calculateWordPositions, 0);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    const handleResize = () => {
      setTimeout(calculateWordPositions, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={textRef}
      className={`relative leading-relaxed text-selectable ${className}`}
      style={{
        userSelect: 'text',
        WebkitUserSelect: 'text',
        MozUserSelect: 'text'
      }}
    >
      {text}
    </div>
  );
};
