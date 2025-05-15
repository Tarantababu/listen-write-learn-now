
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
    // Use direct level value for CEFR levels
    const levelColors: Record<LanguageLevel, string> = {
      A0: 'bg-slate-400',
      A1: 'bg-green-400',
      A2: 'bg-blue-400',
      B1: 'bg-indigo-500',
      B2: 'bg-purple-500',
      C1: 'bg-amber-500',
      C2: 'bg-rose-500'
    };
    
    return (
      <Badge className={`${levelColors[level]} font-semibold ${className}`}>
        {level}
      </Badge>
    );
  }
  
  // Fallback
  return <Badge className={className}>A0</Badge>;
};

export default LevelBadge;
