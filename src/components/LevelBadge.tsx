
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getUserLevel } from "@/utils/levelSystem";

interface LevelBadgeProps {
  masteredWords: number;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({ masteredWords }) => {
  const level = getUserLevel(masteredWords);
  
  return (
    <Badge className={`${level.color} font-semibold`}>
      {level.level}
    </Badge>
  );
};

export default LevelBadge;
