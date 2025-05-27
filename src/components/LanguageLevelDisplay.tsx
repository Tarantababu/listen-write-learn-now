
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, ChevronRight, Target, TrendingUp, Sprout, Leaf, TreePine, Mountain, Crown, Circle } from 'lucide-react';
import { getUserLevel, getLevelProgress, getWordsToNextLevel, formatNumber, LANGUAGE_LEVELS } from '@/utils/levelSystem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import LevelInfoTooltip from './LevelInfoTooltip';
interface LanguageLevelDisplayProps {
  masteredWords: number;
}

// Level icons mapping - elegant progression using available Lucide icons
const LEVEL_ICONS = {
  'Level 1': Circle,
  // Starting point - simple circle
  'Level 2': Sprout,
  // First growth - sprouting 
  'Level 3': Leaf,
  // Growing - developing leaves
  'Level 4': TreePine,
  // Establishing - young tree
  'Level 5': TreePine,
  // Strengthening - mature tree  
  'Level 6': Mountain,
  // Reaching heights - mountain peak
  'Level 7': Crown // Mastery achieved - crown/trophy
};

// Elegant gradient colors for each level
const LEVEL_GRADIENTS = {
  'Level 1': 'from-slate-400 via-gray-500 to-slate-600',
  // Subtle beginnings
  'Level 2': 'from-green-400 via-emerald-500 to-teal-600',
  // Fresh growth
  'Level 3': 'from-green-500 via-teal-600 to-cyan-600',
  // Developing
  'Level 4': 'from-blue-500 via-indigo-600 to-purple-600',
  // Building strength
  'Level 5': 'from-purple-500 via-violet-600 to-indigo-600',
  // Advanced growth
  'Level 6': 'from-purple-600 via-pink-600 to-rose-600',
  // Near mastery
  'Level 7': 'from-amber-500 via-orange-500 to-red-500' // Complete mastery
};

// Accent colors for supporting elements
const LEVEL_ACCENTS = {
  'Level 1': 'text-slate-600 dark:text-slate-400',
  'Level 2': 'text-emerald-600 dark:text-emerald-400',
  'Level 3': 'text-teal-600 dark:text-teal-400',
  'Level 4': 'text-indigo-600 dark:text-indigo-400',
  'Level 5': 'text-purple-600 dark:text-purple-400',
  'Level 6': 'text-pink-600 dark:text-pink-400',
  'Level 7': 'text-orange-600 dark:text-orange-400'
};
const LanguageLevelDisplay: React.FC<LanguageLevelDisplayProps> = ({
  masteredWords
}) => {
  const currentLevel = getUserLevel(masteredWords);
  const levelProgress = getLevelProgress(masteredWords);
  const wordsToNextLevel = getWordsToNextLevel(masteredWords);

  // Get current level index for rendering the level progression
  const currentLevelIndex = LANGUAGE_LEVELS.findIndex(level => level.level === currentLevel.level);
  const nextLevel = currentLevelIndex < LANGUAGE_LEVELS.length - 1 ? LANGUAGE_LEVELS[currentLevelIndex + 1] : null;
  const isMaxLevel = currentLevelIndex === LANGUAGE_LEVELS.length - 1;

  // Get visual elements for current level
  const CurrentLevelIcon = LEVEL_ICONS[currentLevel.level] || Award;
  const currentGradient = LEVEL_GRADIENTS[currentLevel.level] || LEVEL_GRADIENTS['Level 2'];
  const currentAccent = LEVEL_ACCENTS[currentLevel.level] || LEVEL_ACCENTS['Level 2'];
  return <Card className="col-span-full shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-purple-50/50 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/30 border-0 overflow-hidden animate-fade-in">
      {/* Enhanced decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full blur-2xl transform -translate-x-12 translate-y-12" />
        <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-gradient-to-r from-pink-300 to-violet-300 rounded-full blur-xl opacity-30" />
      </div>
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            
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
          {/* Enhanced Current Achievement Section */}
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* Enhanced Level Badge with Dynamic Icon */}
            <div className="text-center">
              <div className="relative group">
                <div className={`inline-flex flex-col items-center justify-center h-28 w-28 rounded-2xl bg-gradient-to-br ${currentGradient} text-white shadow-xl transition-all duration-300 group-hover:scale-105`}>
                  <CurrentLevelIcon className="h-7 w-7 mb-1 drop-shadow-sm" />
                  <span className="text-2xl font-bold tracking-wide">{currentLevel.level}</span>
                </div>
                
                {/* Enhanced sparkle effect */}
                
                
                {/* Subtle glow effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${currentGradient} opacity-20 blur-lg scale-110 -z-10 transition-all duration-300 group-hover:opacity-30 group-hover:blur-xl`} />
              </div>
              
              <div className="mt-3">
                
                
              </div>
            </div>
            
            {/* Enhanced Progress Details */}
            <div className="flex-1 w-full space-y-4">
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 flex items-center justify-center shadow-sm">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Words Mastered</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatNumber(masteredWords)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {!isMaxLevel && <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center shadow-sm">
                        <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                          To {nextLevel?.level}
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatNumber(wordsToNextLevel)}
                        </p>
                      </div>
                    </div>
                  </div>}
              </div>
              
              {/* Enhanced Progress Bar Section */}
              {!isMaxLevel && <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progress to {nextLevel?.level}
                    </span>
                    <span className={`text-sm font-semibold ${currentAccent}`}>
                      {Math.round(levelProgress)}%
                    </span>
                  </div>
                  
                  <div className="relative">
                    <Progress value={levelProgress} className="h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded-full shadow-inner" indicatorClassName={`bg-gradient-to-r ${currentGradient} shadow-sm rounded-full`} />
                    {/* Enhanced progress indicator dot */}
                    <div className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-current ${currentAccent} rounded-full shadow-lg transition-all duration-300 hover:scale-110`} style={{
                  left: `calc(${levelProgress}% - 8px)`
                }}>
                      <div className={`absolute inset-0.5 bg-gradient-to-br ${currentGradient} rounded-full`} />
                    </div>
                  </div>
                </div>}
              
              {isMaxLevel && <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 text-yellow-800 dark:text-yellow-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <Crown className="h-4 w-4" />
                    <span className="text-sm font-semibold">Maximum Level Achieved!</span>
                  </div>
                </div>}
            </div>
          </div>
          
          {/* Enhanced Level Journey Timeline */}
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
              {/* Enhanced connection line with dynamic coloring */}
              <div className="absolute top-2 left-8 right-8 h-0.5 bg-gradient-to-r from-green-400 via-purple-400 to-gray-300 dark:from-green-500 dark:via-purple-500 dark:to-gray-600 rounded-full" />
              
              {/* Enhanced level dots with icons */}
              <div className="relative flex justify-between items-center">
                {LANGUAGE_LEVELS.map((level, index) => {
                const isPast = index < currentLevelIndex;
                const isCurrent = index === currentLevelIndex;
                const isNext = index === currentLevelIndex + 1;
                const LevelIcon = LEVEL_ICONS[level.level] || Award;
                const levelGradient = LEVEL_GRADIENTS[level.level] || LEVEL_GRADIENTS['Level 2'];
                return <TooltipProvider key={level.level}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center cursor-help relative z-10 group">
                            <div className={`relative h-4 w-4 rounded-full transition-all duration-300 flex items-center justify-center ${isCurrent ? `bg-gradient-to-br ${levelGradient} ring-4 ring-purple-200/50 dark:ring-purple-500/30 scale-125 shadow-lg` : isPast ? `bg-gradient-to-br ${levelGradient} shadow-sm border-2 border-white dark:border-gray-800 hover:scale-110` : isNext ? "bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 ring-2 ring-gray-200 dark:ring-gray-600 border-2 border-white dark:border-gray-800 hover:scale-105" : "bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800"}`}>
                              {(isPast || isCurrent) && <LevelIcon className="h-2 w-2 text-white drop-shadow-sm" />}
                              {isCurrent && <div className="absolute inset-0 rounded-full animate-pulse bg-white/20" />}
                            </div>
                            <span className={`text-[11px] mt-3 font-medium transition-colors ${isCurrent ? "text-purple-700 dark:text-purple-300 font-bold" : isPast ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                              {level.level}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs p-3 max-w-xs bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <LevelIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {level.title}
                              </p>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300">
                              {level.cefrEquivalent}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400">
                              {formatNumber(level.minWords)}+ words required
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>;
              })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default LanguageLevelDisplay;
