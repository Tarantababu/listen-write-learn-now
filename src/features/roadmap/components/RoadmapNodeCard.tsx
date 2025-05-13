
import React from 'react';
import { RoadmapNode } from '../types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, Lock, Star } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface RoadmapNodeCardProps {
  node: RoadmapNode;
  onNodeClick: (node: RoadmapNode) => void;
}

const RoadmapNodeCard: React.FC<RoadmapNodeCardProps> = ({ node, onNodeClick }) => {
  const { status, isBonus, progressCount, position } = node;

  const getNodeColor = () => {
    switch (status) {
      case 'completed': 
        return 'bg-primary text-primary-foreground border-primary';
      case 'current': 
        return 'bg-secondary text-secondary-foreground border-secondary';
      case 'available': 
        return 'bg-background text-foreground border-muted-foreground';
      default: 
        return 'bg-muted text-muted-foreground border-muted opacity-70';
    }
  };

  const getNodeIcon = () => {
    if (status === 'completed') return <Check className="h-5 w-5" />;
    if (status === 'locked') return <Lock className="h-4 w-4" />;
    if (isBonus) return <Star className="h-4 w-4 text-amber-500" />;
    return null;
  };

  // Display progress badge if there is progress but not completed
  const showProgressBadge = progressCount > 0 && status !== 'completed';

  // Animations based on node status
  const pulseAnimation = status === 'current' ? {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse" as const
    }
  } : {};

  const completedAnimation = status === 'completed' ? {
    scale: [0.8, 1],
    opacity: [0, 1],
    transition: { duration: 0.5 }
  } : {};

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <motion.div
              whileHover={status !== 'locked' ? { scale: 1.1 } : {}}
              animate={status === 'current' ? pulseAnimation : completedAnimation}
            >
              <Button
                onClick={() => status !== 'locked' && onNodeClick(node)}
                disabled={status === 'locked'}
                variant="outline"
                className={cn(
                  "h-16 w-16 rounded-full border-2 flex flex-col items-center justify-center p-0 transition-all",
                  getNodeColor(),
                  status === 'current' && "ring-2 ring-offset-2 ring-primary",
                  isBonus && "border-amber-500"
                )}
              >
                {getNodeIcon()}
                <span className="text-xs font-bold mt-1">{position + 1}</span>
              </Button>
            </motion.div>
            
            {showProgressBadge && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-2 -right-2 bg-amber-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold"
              >
                {progressCount}
              </motion.div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-50">
          <div className="space-y-1 p-1 max-w-xs">
            <div className="flex items-center gap-1 flex-wrap">
              {isBonus && (
                <Badge variant="secondary" className="text-xs px-1 py-0 h-4 bg-amber-500/20 text-amber-700">
                  BONUS
                </Badge>
              )}
              <span className="font-medium">{node.title}</span>
            </div>
            {node.description && (
              <p className="text-xs text-muted-foreground">{node.description}</p>
            )}
            <div className="text-xs flex items-center gap-1 mt-1">
              <span className={cn(
                "px-1.5 py-0.5 rounded-sm",
                status === 'locked' ? "bg-muted text-muted-foreground" :
                status === 'completed' ? "bg-primary/10 text-primary" :
                status === 'current' ? "bg-secondary/10 text-secondary" :
                "bg-muted/50"
              )}>
                {status === 'locked' ? 'Locked' : 
                 status === 'completed' ? 'Completed' : 
                 status === 'current' ? 'Current' : 'Available'}
              </span>
              {progressCount > 0 && status !== 'completed' && (
                <span className="ml-1 bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded-sm">
                  Progress: {progressCount}/3
                </span>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default RoadmapNodeCard;
