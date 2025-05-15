
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCurriculumPath, CurriculumPath } from '@/types';
import LevelBadge from '@/components/LevelBadge';
import { ArrowRightIcon } from 'lucide-react';

interface CurriculumPathCardProps {
  userCurriculumPath: UserCurriculumPath;
  curriculumPath: CurriculumPath;
  isActive: boolean;
  onCardClick: (id: string) => void;
  onContinueClick: (id: string, e: React.MouseEvent) => void;
}

const CurriculumPathCard: React.FC<CurriculumPathCardProps> = ({
  userCurriculumPath,
  curriculumPath,
  isActive,
  onCardClick,
  onContinueClick
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isActive ? 'border-primary shadow-md' : 'hover:border-muted-foreground/20'
      }`}
      onClick={() => onCardClick(userCurriculumPath.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base capitalize">
            {curriculumPath.language}
          </CardTitle>
          <LevelBadge level={curriculumPath.level} />
        </div>
        <CardDescription>{curriculumPath.description || `${curriculumPath.level} level curriculum`}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <p className="text-sm">
          Continue your learning journey in {curriculumPath.language}
        </p>
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full"
          onClick={(e) => onContinueClick(userCurriculumPath.id, e)}
        >
          Continue Learning <ArrowRightIcon className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CurriculumPathCard;
