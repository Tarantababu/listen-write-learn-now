
import React from 'react';
import { Progress } from '@/components/ui/progress';
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
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Overall progression</h3>
      
      {/* Level bars visualization */}
      <div className="flex items-end justify-between h-32 gap-1 mb-8 px-2">
        {LANGUAGE_LEVELS.map((level, index) => {
          const isCurrentOrPast = index <= currentLevelIndex;
          const isCurrentLevel = index === currentLevelIndex;
          
          // Calculate heights - earlier levels are shorter
          const baseHeight = 40; // minimum height
          const heightIncrement = 15; // each level gets taller
          const maxHeight = baseHeight + (LANGUAGE_LEVELS.length * heightIncrement);
          const height = baseHeight + (index * heightIncrement);
          const heightPercentage = (height / maxHeight) * 100;
          
          // Determine color based on position relative to current level
          let bgColor = "bg-gray-100";
          if (isCurrentLevel) {
            bgColor = level.color;
          } else if (isCurrentOrPast) {
            bgColor = level.color.replace("500", "300").replace("400", "200");
          }
          
          return (
            <div 
              key={level.level}
              className={`flex-1 relative rounded-lg ${bgColor} transition-all duration-300`}
              style={{ 
                height: `${heightPercentage}%`, 
                maxWidth: index === 0 ? '40px' : index === LANGUAGE_LEVELS.length - 1 ? '48px' : '44px'
              }}
            >
              {isCurrentLevel && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                  You are here
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">You are currently in</p>
        <h2 className="text-4xl font-bold mt-1">Level {currentLevel.level}</h2>
      </div>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            Words mastered
          </span>
          <span className="text-sm font-semibold">
            {formatNumber(masteredWords)} words
          </span>
        </div>
        
        <Progress 
          value={levelProgress} 
          className="h-2.5"
          indicatorClassName={currentLevel.color}
        />
        
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatNumber(currentLevel.minWords)}</span>
          <span>{currentLevel.maxWords ? formatNumber(currentLevel.maxWords) : '∞'}</span>
        </div>
      </div>
      
      {wordsToNextLevel > 0 && (
        <div className="mt-6 bg-blue-50 text-blue-700 p-4 rounded-lg flex justify-between items-center">
          <span className="font-medium">Words to level {currentLevel.level.charAt(0)}{Number(currentLevel.level.charAt(1)) + 1}</span>
          <span className="font-bold">{formatNumber(wordsToNextLevel)} words</span>
        </div>
      )}
    </div>
  );
};

export default LanguageLevelProgress;
