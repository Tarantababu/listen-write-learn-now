
import React from "react";

/**
 * Animated audio waveform for indicating audio is being generated.
 * Visually replaces the static badge in AdvancedAudioControls.
 */
export const AudioWaveformPulse: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  // 5 animated bars of varying animation delay for a lively effect
  const bars = [
    "animate-[wave1_1.2s_infinite_ease-in-out]",
    "animate-[wave2_1.2s_infinite_ease-in-out]",
    "animate-[wave3_1.2s_infinite_ease-in-out]",
    "animate-[wave2_1.2s_infinite_ease-in-out]",
    "animate-[wave1_1.2s_infinite_ease-in-out]",
  ];

  return (
    <div
      className={`flex items-end gap-0.5 px-2 py-1 bg-blue-100 rounded-full shadow-sm h-5 aria-busy animate-pulse-light ${className ?? ""}`}
      role="status"
      aria-label="Generating audio"
      {...props}
    >
      <span className="sr-only">Generating audio...</span>
      {bars.map((barAnim, i) => (
        <div
          key={i}
          className={`
            w-1
            rounded
            bg-blue-500
            ${barAnim}
          `}
          style={{
            height: "70%",
            minHeight: "10px",
            maxHeight: "20px",
            animationDelay: `${i * 0.13}s`
          }}
        />
      ))}
      <style>
        {`
          @keyframes wave1 {
            0%, 100% { height: 30%; }
            25% { height: 100%; }
            50% { height: 35%; }
            75% { height: 90%; }
          }
          @keyframes wave2 {
            0%, 100% { height: 50%; }
            20% { height: 70%; }
            40% { height: 100%; }
            60% { height: 80%; }
            80% { height: 95%; }
          }
          @keyframes wave3 {
            0%, 100% { height: 100%; }
            30% { height: 35%; }
            60% { height: 90%; }
          }
        `}
      </style>
    </div>
  );
};
