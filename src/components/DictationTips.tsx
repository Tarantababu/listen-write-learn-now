
import React from 'react';
import PopoverHint from './PopoverHint';

const DictationTips: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Need help?</span>
      <PopoverHint side="top" align="end" className="space-y-3 bg-background">
        <h3 className="font-semibold text-base mb-2">Dictation Tips</h3>
        
        <div className="space-y-2">
          <p><span className="inline-block mr-1.5">🎧</span> Play the audio and listen to just 2–5 words.</p>
          
          <p><span className="inline-block mr-1.5">⏸️</span> Pause immediately! Write after listening — never while the audio is playing.</p>
          
          <p><span className="inline-block mr-1.5">📝</span> No need to transcribe the full text.</p>
          
          <p>If it feels like too much, just start with 3 sentences!</p>
          
          <p><span className="inline-block mr-1.5">⏪</span> Don't rewind. Missed a word? Just leave a blank.</p>
          
          <p><span className="inline-block mr-1.5">✅</span> When finished, listen again to:
            <ul className="list-disc pl-6 mt-1 space-y-0.5">
              <li>Fill in gaps</li>
              <li>Fix obvious mistakes</li>
            </ul>
          </p>
          
          <p><span className="inline-block mr-1.5">🔍</span> Click COMPARE and check your errors.</p>
          
          <p>Less than 15 mistakes? Awesome! Try writing a bit more next time!</p>
          
          <p><span className="inline-block mr-1.5">🔁</span> Listen one more time and read along your own writing.</p>
        </div>
      </PopoverHint>
    </div>
  );
};

export default DictationTips;
