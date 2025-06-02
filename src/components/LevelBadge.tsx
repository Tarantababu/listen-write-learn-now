
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getUserLevel } from "@/utils/levelSystem";
import { LanguageLevel } from '@/types';

interface LevelBadgeProps {
  masteredWords?: number;
  level?: LanguageLevel;
  className?: string;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({ masteredWords, level, className = "" }) => {
  if (masteredWords !== undefined) {
    const userLevel = getUserLevel(masteredWords);
    return (
      <Badge className={`${userLevel.color} font-semibold ${className}`}>
        {userLevel.level}
      </Badge>
    );
  }
  
  if (level !== undefined) {
    // Use direct level value for the new level system
    const levelColors: Record<string, string> = {
      'Level 1': 'bg-slate-400',
      'Level 2': 'bg-green-400',
      'Level 3': 'bg-blue-400',
      'Level 4': 'bg-indigo-500',
      'Level 5': 'bg-purple-500',
      'Level 6': 'bg-amber-500',
      'Level 7': 'bg-rose-500'
    };
    
    return (
      <Badge className={`${levelColors[level] || 'bg-slate-400'} font-semibold ${className}`}>
        {level}
      </Badge>
    );
  }
  
  // Fallback
  return <Badge className={className}>Level 1</Badge>;
};

export default LevelBadge;
