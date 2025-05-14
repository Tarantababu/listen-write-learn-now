
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useRoadmap } from '@/hooks/use-roadmap';
import { CheckCircle, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RoadmapProgressBarProps {
  className?: string;
  showDetails?: boolean;
}

const RoadmapProgressBar: React.FC<RoadmapProgressBarProps> = ({ 
  className,
  showDetails = true
}) => {
  const { nodes, completedNodes } = useRoadmap();
  
  // Filter out bonus nodes for percentage calculation
  const regularNodes = nodes.filter(node => !node.isBonus);
  const regularNodesCount = regularNodes.length;
  
  // Calculate completed regular nodes
  const completedRegularNodes = regularNodes
    .filter(node => node.status === 'completed')
    .length;
  
  // Calculate percentage based only on regular nodes
  const progressPercentage = regularNodesCount > 0
    ? Math.round((completedRegularNodes / regularNodesCount) * 100)
    : 0;
  
  const totalCompletedNodes = completedNodes.length;
  const totalNodes = nodes.length;
  const bonusCompletedCount = totalCompletedNodes - completedRegularNodes;
  const totalBonusNodes = totalNodes - regularNodesCount;
  
  return (
    <motion.div 
      className={cn("space-y-2", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Progress:</span>
        </div>
        <span className="text-sm font-medium">{progressPercentage}%</span>
      </div>
      
      <Progress 
        value={progressPercentage} 
        className="h-2" 
      />
      
      {showDetails && (
        <div className="flex text-xs text-muted-foreground justify-between">
          <div>
            <span className="font-medium text-foreground">{completedRegularNodes}</span>/{regularNodesCount} lessons completed
          </div>
          
          {totalBonusNodes > 0 && (
            <div className="flex items-center">
              <Award className="h-3.5 w-3.5 mr-1 text-amber-500" />
              <span className="font-medium text-foreground">{bonusCompletedCount}</span>/{totalBonusNodes} bonus items
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default RoadmapProgressBar;
