
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface LevelInfo {
  level: string;
  title: string;
  minWords: number;
  maxWords: number | null;
}

const levels: LevelInfo[] = [
  { level: 'A1', title: 'Beginner', minWords: 0, maxWords: 500 },
  { level: 'A2', title: 'Elementary', minWords: 500, maxWords: 1000 },
  { level: 'B1', title: 'Intermediate', minWords: 1000, maxWords: 2000 },
  { level: 'B2', title: 'Upper Intermediate', minWords: 2000, maxWords: 4000 },
  { level: 'C1', title: 'Advanced', minWords: 4000, maxWords: 8000 },
  { level: 'C2', title: 'Proficiency', minWords: 8000, maxWords: null }
];

const LevelInfoTooltip: React.FC = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="w-64 p-0 z-[100]" align="start">
          <div className="p-4 bg-popover shadow-lg">
            <h4 className="font-medium mb-2">Language Proficiency Levels</h4>
            <div className="space-y-2 text-xs">
              {levels.map((level) => (
                <div key={level.level} className="flex justify-between">
                  <span className="font-semibold">{level.level} - {level.title}</span>
                  <span>
                    {level.maxWords 
                      ? `${level.minWords} - ${level.maxWords} words`
                      : `${level.minWords}+ words`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LevelInfoTooltip;
