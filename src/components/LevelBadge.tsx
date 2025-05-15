
import React from 'react';
import { LanguageLevel } from '@/types';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: LanguageLevel;
  className?: string;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({ level, className }) => {
  const getColorForLevel = () => {
    switch (level) {
      case 'A0':
        return 'bg-slate-200 text-slate-800';
      case 'A1':
        return 'bg-green-200 text-green-800';
      case 'A2':
        return 'bg-green-300 text-green-800';
      case 'B1':
        return 'bg-blue-200 text-blue-800';
      case 'B2':
        return 'bg-blue-300 text-blue-800';
      case 'C1':
        return 'bg-purple-200 text-purple-800';
      case 'C2':
        return 'bg-purple-300 text-purple-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <span 
      className={cn(
        'inline-block px-2 py-1 text-xs font-semibold rounded', 
        getColorForLevel(),
        className
      )}
    >
      {level}
    </span>
  );
};

export default LevelBadge;
