
import React from "react";
import { Loader } from "lucide-react";

/**
 * Simple spinning loader for indicating audio is being generated.
 * Replaces the animated waveform.
 */
export const AudioWaveformPulse: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 bg-blue-100 rounded-full shadow-sm h-7 aria-busy ${className ?? ""}`}
      role="status"
      aria-label="Generating audio"
      {...props}
    >
      <span className="sr-only">Generating audio...</span>
      <Loader className="h-4 w-4 text-blue-600 animate-spin" aria-hidden="true" />
      <span className="text-xs text-blue-800">Generating audio...</span>
    </div>
  );
};
