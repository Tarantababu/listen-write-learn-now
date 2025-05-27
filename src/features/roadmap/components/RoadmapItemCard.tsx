
import React from 'react';
import { RoadmapItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import LevelBadge from '@/components/LevelBadge';
import { ArrowRightIcon, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoadmapItemCardProps {
  roadmap: RoadmapItem;
  isActive: boolean;
  onCardClick: (roadmapId: string) => void;
  onContinueClick: (roadmapId: string, e: React.MouseEvent) => void;
}

const RoadmapItemCard: React.FC<RoadmapItemCardProps> = ({ 
  roadmap,
  isActive,
  onCardClick,
  onContinueClick
}) => {
  // Capitalizes the first letter of a string
  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 border hover:border-primary/50 relative overflow-hidden",
          isActive && "border-primary bg-primary/5"
        )}
        onClick={() => onCardClick(roadmap.id)}
      >
        {isActive && (
          <div className="absolute h-full w-1 bg-primary left-0 top-0" />
        )}
        
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
              {roadmap.name || capitalize(roadmap.language)}
            </CardTitle>
            
            <LevelBadge level={roadmap.level || 'Level 2'} />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {roadmap.description || `A ${roadmap.level} level learning path for ${capitalize(roadmap.language)}.`}
            </p>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                {isActive ? 'Currently selected' : 'Click to select'}
              </div>
              <Button 
                onClick={(e) => onContinueClick(roadmap.id, e)}
                size="sm"
                className="h-8"
              >
                Continue <ArrowRightIcon className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoadmapItemCard;
