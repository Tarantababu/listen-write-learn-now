
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurriculumPathItem } from '@/types';
import LevelBadge from '@/components/LevelBadge';
import { ArrowRightIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface CurriculumPathItemCardProps {
  curriculumPath: CurriculumPathItem;
  isActive: boolean;
  onCardClick: (pathId: string) => void;
  onContinueClick: (pathId: string, e: React.MouseEvent) => void;
}

const CurriculumPathItemCard: React.FC<CurriculumPathItemCardProps> = ({
  curriculumPath,
  isActive,
  onCardClick,
  onContinueClick
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-all ${isActive ? 'border-primary/70 bg-primary/5 dark:bg-primary/10' : 'hover:border-muted-foreground/20'}`}
      onClick={() => onCardClick(curriculumPath.id)}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{curriculumPath.name}</h3>
              <LevelBadge level={curriculumPath.level} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {curriculumPath.language.charAt(0).toUpperCase() + curriculumPath.language.slice(1)} learning path
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <div>
            {isActive && (
              <span className="text-xs font-medium text-primary-foreground bg-primary px-2 py-0.5 rounded-sm">
                Active
              </span>
            )}
          </div>
          <Button 
            size="sm" 
            variant={isActive ? "default" : "secondary"}
            onClick={(e) => onContinueClick(curriculumPath.id, e)}
          >
            Continue Learning <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurriculumPathItemCard;
