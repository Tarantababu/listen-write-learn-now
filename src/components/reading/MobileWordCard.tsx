
import React from 'react';
import { Card } from '@/components/ui/card';

interface AnalysisWord {
  word: string;
  definition: string;
  exampleSentence: string;
}

interface MobileWordCardProps {
  word: AnalysisWord;
  index: number;
}

export const MobileWordCard: React.FC<MobileWordCardProps> = ({ word, index }) => {
  return (
    <Card className="p-3 border border-border/50 bg-card/50 backdrop-blur-sm touch-manipulation">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <span className="font-bold text-primary text-base">{word.word}</span>
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            #{index + 1}
          </span>
        </div>
        
        <p className="text-foreground text-sm leading-relaxed">{word.definition}</p>
        
        {word.exampleSentence && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Example:</span> {word.exampleSentence}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
