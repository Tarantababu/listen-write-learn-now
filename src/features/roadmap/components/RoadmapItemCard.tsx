
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LevelBadge from '@/components/LevelBadge';
import { RoadmapItem } from '../types';

interface RoadmapItemCardProps {
  roadmap: RoadmapItem;
  isActive: boolean;
  onCardClick: (id: string) => void;
  onContinueClick: (id: string, e: React.MouseEvent) => void;
}

const RoadmapItemCard: React.FC<RoadmapItemCardProps> = ({
  roadmap,
  isActive,
  onCardClick,
  onContinueClick
}) => {
  const { id, name, level, progress, createdAt } = roadmap;

  return (
    <Card 
      key={id} 
      className={`cursor-pointer transition-all ${isActive ? 'border-primary shadow-md' : 'hover:border-primary/50'}`}
      onClick={() => onCardClick(id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          {isActive && (
            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
              Current
            </span>
          )}
        </div>
        <CardDescription className="flex items-center gap-2">
          {level && <LevelBadge level={level} />}
          <span>Started on {new Date(createdAt).toLocaleDateString()}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="bg-muted h-2 flex-1 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        
        <div className="mt-3 flex justify-end">
          <Button
            variant={isActive ? "default" : "outline"} 
            size="sm"
            onClick={(e) => onContinueClick(id, e)}
          >
            {isActive ? 'Continue Learning' : 'View Roadmap'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoadmapItemCard;
