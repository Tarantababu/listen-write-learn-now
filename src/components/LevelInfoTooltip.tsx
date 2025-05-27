import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { HelpCircle } from 'lucide-react';
import { LANGUAGE_LEVELS } from "@/utils/levelSystem";
import { LanguageLevel } from '@/types';

const LevelInfoTooltip: React.FC<{ userLevel?: string }> = ({ userLevel = "Level 1" }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
        <div className="p-4 bg-background border rounded-md shadow-md">
          <h4 className="font-medium mb-3 text-sm text-purple-700 dark:text-purple-300">Language Proficiency Levels</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gradient-to-r from-purple-100/80 to-blue-100/80 dark:from-purple-900/30 dark:to-blue-900/30">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-purple-700 dark:text-purple-300">Level</th>
                  <th className="px-3 py-2 text-left font-medium text-blue-700 dark:text-blue-300">Words</th>
                  <th className="px-3 py-2 text-left font-medium text-indigo-700 dark:text-indigo-300">CEFR</th>
                </tr>
              </thead>
              <tbody>
                {LANGUAGE_LEVELS.map((level, index) => {
                  // Determine if this is a future level based on user's current level
                  const isCurrentLevel = level.level === userLevel;
                  const isFutureLevel = !isCurrentLevel && userLevel 
                    ? (parseInt(level.level.split(' ')[1]) > parseInt(userLevel.split(' ')[1]))
                    : false;
                  
                  return (
                    <HoverCard key={level.level} openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <tr 
                          className={`
                            border-t hover:bg-muted/50 
                            ${levelColorsDark[index % levelColorsDark.length]} 
                            transition-all duration-300
                            ${isCurrentLevel ? 'ring-1 ring-inset ring-primary/30' : ''}
                            ${isFutureLevel ? futureLevelStyles : ''}
                          `}
                        >
                          <td className="px-3 py-2 font-medium">{level.level}</td>
                          <td className="px-3 py-2">
                            {level.maxWords 
                              ? `${level.minWords.toLocaleString()}-${level.maxWords.toLocaleString()}`
                              : `${level.minWords.toLocaleString()}+`}
                          </td>
                          <td className="px-3 py-2">{level.cefrEquivalent}</td>
                        </tr>
                      </HoverCardTrigger>
                      <HoverCardContent className="p-3 text-xs w-72 bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700">
                        <div className="space-y-2">
                          <h5 className="font-semibold text-sm flex items-center gap-1.5">
                            <span className={`inline-block w-2 h-2 rounded-full ${getLevelColorClass(level.level)}`}></span>
                            {level.level}
                            {isCurrentLevel && <span className="text-xs font-normal text-primary ml-1">(current)</span>}
                          </h5>
                          <p className="text-muted-foreground leading-relaxed">{level.description}</p>
                          <div className="bg-slate-50 dark:bg-slate-900/70 p-2 rounded text-slate-700 dark:text-slate-300">
                            <span className="font-medium">Target vocabulary:</span> {level.maxWords 
                              ? `${level.minWords.toLocaleString()}-${level.maxWords.toLocaleString()} words`
                              : `${level.minWords.toLocaleString()}+ words`}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary/70"></div>
            <p>Hover over any level to see detailed description</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Enhanced color palette with dark mode support
const levelColorsDark = [
  'bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900/60 dark:to-slate-900/40 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800/50',
  'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/20 border-green-200 dark:border-green-800/40 hover:bg-green-100 dark:hover:bg-green-800/30',
  'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 border-blue-200 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-800/30',
  'bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-800/30',
  'bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-900/20 border-purple-200 dark:border-purple-800/40 hover:bg-purple-100 dark:hover:bg-purple-800/30',
  'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-800/30',
  'bg-gradient-to-r from-rose-100 to-rose-50 dark:from-rose-900/40 dark:to-rose-900/20 border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-800/30',
];

// Helper function to get the appropriate color class for the level dot
const getLevelColorClass = (level: string): string => {
  return level === 'Level 1' ? 'bg-slate-400 dark:bg-slate-400' : 
         level === 'Level 2' ? 'bg-green-400 dark:bg-green-500' : 
         level === 'Level 3' ? 'bg-blue-400 dark:bg-blue-500' : 
         level === 'Level 4' ? 'bg-indigo-400 dark:bg-indigo-500' : 
         level === 'Level 5' ? 'bg-purple-400 dark:bg-purple-500' : 
         level === 'Level 6' ? 'bg-amber-400 dark:bg-amber-500' : 'bg-rose-400 dark:bg-rose-500';
};

// Future level styles - more transparent/faded
const futureLevelStyles = "opacity-50 dark:opacity-40 saturate-50";

export default LevelInfoTooltip;
