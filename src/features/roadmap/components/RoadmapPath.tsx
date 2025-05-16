import React from 'react';
import { RoadmapNode } from '../types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, Circle, CircleDashed, Star } from 'lucide-react';

interface RoadmapPathProps {
  nodes: RoadmapNode[];
  onNodeSelect: (node: RoadmapNode) => void;
}

const RoadmapPath: React.FC<RoadmapPathProps> = ({ nodes, onNodeSelect }) => {
  // Group nodes by rows of 5 for display
  const rows: RoadmapNode[][] = [];
  for (let i = 0; i < nodes.length; i += 5) {
    rows.push(nodes.slice(i, i + 5));
  }
  
  return (
    <div className="space-y-10 py-4">
      {rows.map((row, rowIndex) => (
        <motion.div
          key={`row-${rowIndex}`}
          className={cn(
            "flex items-center gap-6 relative",
            rowIndex % 2 === 1 && "flex-row-reverse"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: rowIndex * 0.1 }}
        >
          {/* Connection line between nodes */}
          <div className="absolute h-1 bg-muted-foreground/30 top-1/2 left-8 right-8 -translate-y-1/2 -z-10"></div>
          
          {row.map((node, nodeIndex) => (
            <NodeItem 
              key={node.id} 
              node={node}
              onClick={() => onNodeSelect(node)}
            />
          ))}
          
          {/* Add placeholder elements to keep consistent spacing */}
          {Array.from({ length: Math.max(0, 5 - row.length) }).map((_, i) => (
            <div key={`placeholder-${i}`} className="w-16 h-16" />
          ))}
        </motion.div>
      ))}
    </div>
  );
};

interface NodeItemProps {
  node: RoadmapNode & { 
    status?: 'locked' | 'available' | 'completed' | 'current',
    completionCount?: number,
    isCompleted?: boolean,
    lastPracticedAt?: Date
  };
  onClick: () => void;
}

const NodeItem: React.FC<NodeItemProps> = ({ node, onClick }) => {
  const status = node.status || 'locked';
  const completionCount = node.completionCount || 0;
  const isCompleted = node.isCompleted || false;
  
  const getNodeColor = () => {
    switch (status) {
      case 'completed': return 'bg-primary border-primary text-primary-foreground';
      case 'current': return 'bg-secondary border-secondary text-secondary-foreground ring-2 ring-offset-2 ring-secondary';
      case 'available': return 'bg-background border-foreground text-foreground';
      default: return 'bg-muted border-muted-foreground text-muted-foreground opacity-60';
    }
  };
  
  const getNodeIcon = () => {
    if (status === 'completed') return <CheckCircle2 className="h-5 w-5" />;
    if (status === 'current') return <Circle className="h-5 w-5 fill-secondary" />;
    if (status === 'available') return <Circle className="h-5 w-5" />;
    return <CircleDashed className="h-5 w-5" />;
  };
  
  // Progress is only shown if not completed and has at least one completion
  const showProgress = !isCompleted && completionCount > 0;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <motion.div
              className={cn(
                "w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition-all",
                getNodeColor(),
                status === 'locked' && 'cursor-not-allowed'
              )}
              onClick={onClick}
              whileHover={status !== 'locked' ? { scale: 1.05 } : {}}
              whileTap={status !== 'locked' ? { scale: 0.95 } : {}}
            >
              <div className="flex flex-col items-center">
                {node.isBonus && <Star className="h-3 w-3 text-amber-500 absolute top-1" />}
                {getNodeIcon()}
                <span className="text-xs font-bold mt-1">{node.position + 1}</span>
              </div>
            </motion.div>
            
            {/* Badge showing completion progress */}
            {showProgress && (
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold border border-white">
                {completionCount}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-0">
          <div className="p-3 space-y-1.5 max-w-[250px]">
            <div className="flex items-center justify-between">
              <div className="font-medium">{node.title}</div>
              {node.isBonus && (
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 font-medium ml-1">
                  BONUS
                </Badge>
              )}
            </div>
            
            {node.description && (
              <p className="text-sm text-muted-foreground">{node.description}</p>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
              <div>
                {status === 'completed' ? 'Completed' : 
                 status === 'current' ? 'Current lesson' : 
                 status === 'available' ? 'Available' : 'Locked'}
              </div>
              
              {/* Show progress stats */}
              <div className="font-medium">
                {isCompleted ? (
                  <span className="text-primary">Mastered</span>
                ) : (
                  <span>Progress: {completionCount}/3</span>
                )}
              </div>
            </div>
            
            {/* Show last practiced time if available */}
            {node.lastPracticedAt && (
              <div className="text-xs text-muted-foreground">
                Last practiced: {format(node.lastPracticedAt, 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RoadmapPath;
