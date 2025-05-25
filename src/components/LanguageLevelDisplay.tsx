import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, ChevronRight, Target, TrendingUp } from 'lucide-react';
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
  
  const isMaxLevel = currentLevelIndex === LANGUAGE_LEVELS.length - 1;
  
  return (
    <Card className="col-span-full shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-purple-50/50 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/30 border-0 overflow-hidden animate-fade-in">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full blur-2xl transform -translate-x-12 translate-y-12" />
      </div>
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40">
              <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Language Journey
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Track your vocabulary mastery progress
              </p>
            </div>
          </div>
          <LevelInfoTooltip />
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="space-y-6">
          {/* Current Achievement Section */}
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* Level Badge */}
            <div className="text-center">
              <div className="relative">
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 text-white shadow-xl shadow-purple-500/25">
                  <span className="text-3xl font-bold">{currentLevel.level}</span>
                </div>
                {/* Sparkle effect for current level */}
                <div className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="h-2 w-2 bg-white rounded-full" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentLevel.title}
                </h3>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-medium mt-1">
                  <Target className="h-3 w-3" />
                  {currentLevel.cefrEquivalent}
                </div>
              </div>
            </div>
            
            {/* Progress Details */}
            <div className="flex-1 w-full space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Words Mastered</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatNumber(masteredWords)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {!isMaxLevel && (
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          To {nextLevel?.level}
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatNumber(wordsToNextLevel)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Progress Bar Section */}
              {!isMaxLevel && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progress to {nextLevel?.level}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(levelProgress)}%
                    </span>
                  </div>
                  
                  <div className="relative">
                    <Progress 
                      value={levelProgress} 
                      className="h-3 bg-gray-200/60 dark:bg-gray-700/60" 
                      indicatorClassName="bg-gradient-to-r from-purple-500 via-purple-600 to-blue-500 shadow-sm" 
                    />
                    {/* Progress indicator dot */}
                    <div 
                      className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-purple-500 rounded-full shadow-lg transition-all duration-300"
                      style={{ left: `calc(${levelProgress}% - 8px)` }}
                    />
                  </div>
                </div>
              )}
              
              {isMaxLevel && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 text-yellow-800 dark:text-yellow-200">
                    <Award className="h-4 w-4" />
                    <span className="text-sm font-semibold">Maximum Level Achieved!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Level Journey Timeline */}
          <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Level Journey
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currentLevelIndex + 1} of {LANGUAGE_LEVELS.length} levels
              </span>
            </div>
            
            <div className="relative px-4">
              {/* Connection line - positioned behind the dots */}
              <div className="absolute top-2 left-8 right-8 h-0.5 bg-gradient-to-r from-green-400 via-purple-400 to-gray-300 dark:from-green-500 dark:via-purple-500 dark:to-gray-600" />
              
              {/* Level dots */}
              <div className="relative flex justify-between items-center">
                {LANGUAGE_LEVELS.map((level, index) => {
                  const isPast = index < currentLevelIndex;
                  const isCurrent = index === currentLevelIndex;
                  const isNext = index === currentLevelIndex + 1;
                  
                  return (
                    <TooltipProvider key={level.level}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center cursor-help relative z-10">
                            <div className={`relative h-4 w-4 rounded-full transition-all duration-300 ${
                              isCurrent 
                                ? "bg-gradient-to-br from-purple-500 to-blue-500 ring-4 ring-purple-200/50 dark:ring-purple-500/30 scale-125 shadow-lg" 
                                : isPast 
                                  ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-sm border-2 border-white dark:border-gray-800" 
                                  : isNext
                                    ? "bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 ring-2 ring-gray-200 dark:ring-gray-600 border-2 border-white dark:border-gray-800"
                                    : "bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800"
                            }`}>
                              {isPast && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="h-2 w-2 bg-white rounded-full" />
                                </div>
                              )}
                              {isCurrent && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                                </div>
                              )}
                            </div>
                            <span className={`text-[11px] mt-3 font-medium transition-colors ${
                              isCurrent 
                                ? "text-purple-700 dark:text-purple-300 font-bold" 
                                : isPast 
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-500 dark:text-gray-400"
                            }`}>
                              {level.level}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs p-3 max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {level.title}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300">
                              {level.cefrEquivalent}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400">
                              {formatNumber(level.minWords)}+ words required
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageLevelDisplay;