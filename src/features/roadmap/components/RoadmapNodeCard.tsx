
import React from 'react';
import { RoadmapNode } from '../types';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  CircleDashed, 
  Lock,
  PlayCircle,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface RoadmapNodeCardProps {
  node: RoadmapNode;
  onNodeClick: (node: RoadmapNode) => void;
  className?: string;
}

const RoadmapNodeCard: React.FC<RoadmapNodeCardProps> = ({ 
  node, 
  onNodeClick,
  className
}) => {
  // Determine styles and icon based on status
  const getStatusDetails = () => {
    switch (node.status) {
      case 'completed':
        return {
          containerClass: 'bg-primary text-primary-foreground border-primary/50 shadow-md shadow-primary/20',
          iconBgClass: 'bg-primary-foreground text-primary',
          icon: <CheckCircle className="h-4 w-4" />,
          buttonVariant: 'secondary' as const,
          buttonText: 'Review',
          clickable: true,
          tooltip: 'Completed - Click to review'
        };
      case 'current':
        return {
          containerClass: 'bg-secondary text-secondary-foreground border-secondary/50 shadow-md shadow-secondary/20 animate-pulse',
          iconBgClass: 'bg-secondary-foreground text-secondary',
          icon: <PlayCircle className="h-4 w-4" />,
          buttonVariant: 'default' as const,
          buttonText: 'Continue',
          clickable: true,
          tooltip: 'Current lesson - Continue learning'
        };
      case 'available':
        return {
          containerClass: 'bg-background hover:bg-accent border-input shadow hover:shadow-md transition-all',
          iconBgClass: 'bg-muted text-muted-foreground',
          icon: <CircleDashed className="h-4 w-4" />,
          buttonVariant: 'outline' as const,
          buttonText: 'Start',
          clickable: true,
          tooltip: 'Available - Click to start'
        };
      case 'locked':
      default:
        return {
          containerClass: 'bg-muted/50 text-muted-foreground border-muted/30 opacity-80',
          iconBgClass: 'bg-muted-foreground/20 text-muted-foreground',
          icon: <Lock className="h-4 w-4" />,
          buttonVariant: 'ghost' as const,
          buttonText: 'Locked',
          clickable: false,
          tooltip: 'Locked - Complete previous lessons first'
        };
    }
  };

  const { 
    containerClass, 
    iconBgClass, 
    icon, 
    buttonVariant, 
    buttonText,
    clickable,
    tooltip
  } = getStatusDetails();

  const handleClick = () => {
    if (clickable) {
      onNodeClick(node);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex flex-col items-center justify-center text-center p-2 rounded-lg border transition-all",
              "w-16 h-16 relative",
              containerClass,
              clickable ? "cursor-pointer transform hover:scale-105" : "cursor-not-allowed",
              className
            )}
            onClick={handleClick}
            role="button"
            aria-disabled={!clickable}
            tabIndex={clickable ? 0 : -1}
          >
            <div className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center",
              iconBgClass
            )}>
              {node.isBonus ? <Sparkles className="h-3 w-3 text-amber-500" /> : icon}
            </div>
            
            <span className="text-xs font-medium mb-1 line-clamp-1">
              {node.title}
            </span>
            
            {node.progressCount > 0 && (
              <div className="flex items-center justify-center space-x-0.5 absolute -bottom-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={`progress-${i}`} 
                    className={cn(
                      "h-1 w-1 rounded-full",
                      i < (node.progressCount || 0) 
                        ? "bg-current" 
                        : "bg-current/30"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-1 max-w-[200px]">
            <p className="font-medium">{node.title}</p>
            {node.description && <p className="text-muted-foreground">{node.description}</p>}
            <p className="text-xs">{tooltip}</p>
            {node.progressCount > 0 && !node.status.includes('completed') && (
              <p className="text-xs">Progress: {node.progressCount}/3</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RoadmapNodeCard;
