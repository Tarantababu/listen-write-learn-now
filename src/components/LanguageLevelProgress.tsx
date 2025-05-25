import React from 'react';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, MapPin, ChevronRight } from 'lucide-react';
import { LANGUAGE_LEVELS, getUserLevel, getLevelProgress, formatNumber } from '@/utils/levelSystem';

interface LanguageLevelProgressProps {
  masteredWords: number;
}

const LanguageLevelProgress: React.FC<LanguageLevelProgressProps> = ({ masteredWords }) => {
  const currentLevel = getUserLevel(masteredWords);
  const levelProgress = getLevelProgress(masteredWords);
  const wordsToNextLevel = currentLevel.maxWords 
    ? currentLevel.maxWords - masteredWords
    : 0;
  
  // Get current level index
  const currentLevelIndex = LANGUAGE_LEVELS.findIndex(level => level.level === currentLevel.level);
  const nextLevel = currentLevelIndex < LANGUAGE_LEVELS.length - 1 
    ? LANGUAGE_LEVELS[currentLevelIndex + 1] 
    : null;
  const isMaxLevel = currentLevelIndex === LANGUAGE_LEVELS.length - 1;
  
  return (
    <div className="space-y-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/50 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/30 p-6 rounded-2xl shadow-lg border-0 relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-2xl transform -translate-x-12 -translate-y-12" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tr from-purple-400 to-blue-400 rounded-full blur-3xl transform translate-x-16 translate-y-16" />
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Overall Progression
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your journey through language mastery levels
            </p>
          </div>
        </div>
        
        {/* Level bars visualization */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 mb-8">
          <div className="flex items-end justify-between h-40 gap-2 mb-6">
            {LANGUAGE_LEVELS.map((level, index) => {
              const isCurrentOrPast = index <= currentLevelIndex;
              const isCurrentLevel = index === currentLevelIndex;
              
              // Calculate heights - earlier levels are shorter
              const baseHeight = 50; // minimum height
              const heightIncrement = 18; // each level gets taller
              const maxHeight = baseHeight + (LANGUAGE_LEVELS.length * heightIncrement);
              const height = baseHeight + (index * heightIncrement);
              const heightPercentage = (height / maxHeight) * 100;
              
              // Enhanced color logic with gradients
              let bgColor = "bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600";
              let shadowClass = "";
              
              if (isCurrentLevel) {
                bgColor = "bg-gradient-to-t from-purple-600 via-purple-500 to-blue-500";
                shadowClass = "shadow-lg shadow-purple-500/30";
              } else if (isCurrentOrPast) {
                bgColor = "bg-gradient-to-t from-green-400 via-green-300 to-emerald-300";
                shadowClass = "shadow-md shadow-green-500/20";
              }
              
              return (
                <div className="flex-1 flex flex-col items-center" key={level.level}>
                  <div 
                    className={`relative rounded-xl ${bgColor} ${shadowClass} transition-all duration-500 hover:scale-105 w-full max-w-[48px] border border-white/20`}
                    style={{ height: `${heightPercentage}%` }}
                  >
                    {/* Level indicator dot */}
                    <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white ${
                      isCurrentLevel 
                        ? "bg-yellow-400 shadow-lg shadow-yellow-400/50" 
                        : isCurrentOrPast 
                          ? "bg-green-500" 
                          : "bg-gray-300"
                    }`} />
                    
                    {/* Sparkle effect for current level */}
                    {isCurrentLevel && (
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <div className="absolute top-2 right-2 w-2 h-2 bg-white/80 rounded-full animate-pulse" />
                        <div className="absolute bottom-3 left-2 w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse delay-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* Level label */}
                  <span className={`text-xs font-medium mt-3 ${
                    isCurrentLevel 
                      ? "text-purple-700 dark:text-purple-300 font-bold" 
                      : isCurrentOrPast 
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {level.level}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Current position indicator */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 text-purple-700 dark:text-purple-300">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">You are here</span>
            </div>
          </div>
        </div>
        
        {/* Current Level Status */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 mb-3">
            <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Currently mastering</span>
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Level {currentLevel.level}
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
            {currentLevel.title}
          </p>
        </div>
        
        {/* Progress Details */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Words Mastered
                </span>
              </div>
              <span className="text-xl font-bold text-green-700 dark:text-green-300">
                {formatNumber(masteredWords)}
              </span>
            </div>
            
            {!isMaxLevel && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Level Range
                  </span>
                </div>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {formatNumber(currentLevel.minWords)} - {currentLevel.maxWords ? formatNumber(currentLevel.maxWords) : '∞'}
                </span>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          {!isMaxLevel && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Level {currentLevel.level} Progress
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(levelProgress)}%
                </span>
              </div>
              
              <div className="relative">
                <Progress 
                  value={levelProgress} 
                  className="h-4 bg-gray-200/60 dark:bg-gray-700/60"
                  indicatorClassName="bg-gradient-to-r from-purple-500 via-purple-600 to-blue-500 shadow-sm"
                />
                {/* Progress indicator dot */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white border-2 border-purple-500 rounded-full shadow-lg transition-all duration-300"
                  style={{ left: `calc(${levelProgress}% - 10px)` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{formatNumber(currentLevel.minWords)} words</span>
                <span>{currentLevel.maxWords ? formatNumber(currentLevel.maxWords) : '∞'} words</span>
              </div>
            </div>
          )}
          
          {isMaxLevel && (
            <div className="text-center py-6">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 text-yellow-800 dark:text-yellow-200 border border-yellow-200/50 dark:border-yellow-700/50">
                <Target className="h-5 w-5" />
                <span className="font-semibold">Maximum Level Achieved!</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                You've mastered {formatNumber(masteredWords)} words
              </p>
            </div>
          )}
        </div>
        
        {/* Next Level Goal */}
        {wordsToNextLevel > 0 && nextLevel && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-700/50 p-6 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <ChevronRight className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Next Milestone: Level {nextLevel.level}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {nextLevel.title}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatNumber(wordsToNextLevel)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  words to go
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageLevelProgress;