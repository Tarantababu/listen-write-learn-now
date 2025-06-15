
import React from "react";
import { Language } from "@/types";

/**
 * Non-interactive text for audio sync: only highlights current word, no selection, no vocab, no menu.
 */
interface SimpleAudioSyncTextProps {
  text: string;
  highlightedWordIndex: number;
  /**
   * If true, enables yellow word highlight for the current word during audio sync
   */
  enableWordHighlighting?: boolean;
  /**
   * Text styling className
   */
  className?: string;
}

export const SimpleAudioSyncText: React.FC<SimpleAudioSyncTextProps> = ({
  text,
  highlightedWordIndex,
  enableWordHighlighting = true,
  className = "text-base",
}) => {
  // Split text into words, preserving spaces/punctuation for simplicity
  const words = text.split(/\s+/);

  return (
    <div className={`select-none ${className}`} aria-live="polite">
      {words.map((word, idx) => {
        const highlighted =
          enableWordHighlighting && idx === highlightedWordIndex;
        return (
          <span
            key={idx}
            className={`transition-all duration-200 ${
              highlighted ? "bg-yellow-200 px-1 rounded shadow" : ""
            }`}
          >
            {word}
            {idx < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
};

