
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, ChevronRight } from 'lucide-react';
import { getUserLevel, getLevelProgress, getWordsToNextLevel, formatNumber, LANGUAGE_LEVELS } from '@/utils/levelSystem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import LevelInfoTooltip from './LevelInfoTooltip';

interface LanguageLevelDisplayProps {
  masteredWords: number;
}

const LanguageLevelDisplay: React.FC<LanguageLevelDisplayProps> = ({ masteredWords }) => {
  const currentLevel = getUserLevel(masteredWords);
  const levelProgress = getLevelProgress(masteredWords);
  const wordsToNextLevel = getWordsToNextLevel(masteredWords);
  
  // Get current level index for rendering the level progression
  const currentLevelIndex = LANGUAGE_LEVELS.findIndex(level => level.level === currentLevel.level);
  const nextLevel = currentLevelIndex < LANGUAGE_LEVELS.length - 1 
    ? LANGUAGE_LEVELS[currentLevelIndex + 1] 
    : null;
  
  return (
    <Card className="col-span-full shadow-sm bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base font-medium">Language Level</CardTitle>
          </div>
          <LevelInfoTooltip />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          {/* Current level indicator */}
          <div className="text-center flex-1">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white mb-2 shadow-lg">
              <span className="text-2xl font-bold">{currentLevel.level}</span>
            </div>
            <h3 className="text-sm font-medium">{currentLevel.title}</h3>
            <p className="text-xs text-muted-foreground">{currentLevel.cefrEquivalent}</p>
          </div>
          
          {/* Progress visualization */}
          <div className="flex-[2] w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-purple-700 dark:text-purple-300">
                {formatNumber(masteredWords)} words mastered
              </span>
              {nextLevel && (
                <span className="text-muted-foreground">
                  {formatNumber(wordsToNextLevel)} to {nextLevel.level}
                </span>
              )}
            </div>
            
            <Progress 
              value={levelProgress} 
              className="h-2" 
              indicatorClassName="bg-gradient-to-r from-purple-500 to-blue-500" 
            />
            
            {/* Level progression dots */}
            <div className="flex justify-between items-center mt-4 px-1">
              {LANGUAGE_LEVELS.map((level, index) => {
                const isPast = index < currentLevelIndex;
                const isCurrent = index === currentLevelIndex;
                const isFuture = index > currentLevelIndex;
                
                return (
                  <TooltipProvider key={level.level}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center">
                          <div className={`h-3 w-3 rounded-full ${
                            isCurrent 
                              ? "bg-purple-500 ring-2 ring-purple-200 ring-offset-1" 
                              : isPast 
                                ? "bg-purple-300" 
                                : "bg-gray-200"
                          }`} />
                          <span className={`text-[10px] mt-1 ${isCurrent ? "font-bold text-purple-700" : "text-gray-500"}`}>
                            {level.level}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs p-2">
                        <p className="font-medium">{level.title}</p>
                        <p className="text-muted-foreground">{level.minWords}+ words</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageLevelDisplay;
