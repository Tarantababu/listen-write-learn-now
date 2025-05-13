
import React, { useRef, useEffect } from 'react';
import { RoadmapNode } from '../types';
import RoadmapNodeCard from './RoadmapNodeCard';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoadmapPathProps {
  nodes: RoadmapNode[];
  onNodeSelect: (node: RoadmapNode) => void;
}

const RoadmapPath: React.FC<RoadmapPathProps> = ({ nodes, onNodeSelect }) => {
  // Sort nodes by position
  const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);
  
  // Group nodes by "rows" of 5 for display
  const nodeRows: RoadmapNode[][] = [];
  for (let i = 0; i < sortedNodes.length; i += 5) {
    nodeRows.push(sortedNodes.slice(i, i + 5));
  }

  // Reference to path container for animations
  const pathRef = useRef<HTMLDivElement>(null);
  const completedCount = nodes.filter(n => n.status === 'completed').length;
  
  // Calculate progress percentage
  const progressPercent = nodes.length > 0 ? (completedCount / nodes.length) * 100 : 0;

  return (
    <div className="space-y-10">
      <div className="h-2 w-full bg-muted rounded-full mb-6 overflow-hidden">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      
      {nodeRows.map((row, rowIndex) => (
        <motion.div 
          key={`row-${rowIndex}`} 
          className={cn(
            "flex items-center justify-between gap-6 relative",
            rowIndex % 2 === 1 && "flex-row-reverse"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: rowIndex * 0.1 }}
          ref={rowIndex === 0 ? pathRef : undefined}
        >
          {/* Connection lines with gradient for better visualization */}
          <div 
            className={cn(
              "absolute h-2 top-1/2 left-8 right-8 -translate-y-1/2 -z-10 rounded-full overflow-hidden",
              rowIndex % 2 === 1 ? "bg-gradient-to-l from-muted-foreground/30 to-primary/30" :
                                  "bg-gradient-to-r from-muted-foreground/30 to-primary/30"
            )}
          />
          
          {row.map((node, nodeIndex) => (
            <motion.div
              key={node.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.3, 
                delay: (rowIndex * 0.2) + (nodeIndex * 0.1),
                type: "spring",
                stiffness: 300
              }}
            >
              <RoadmapNodeCard
                key={node.id}
                node={node}
                onNodeClick={onNodeSelect}
              />
            </motion.div>
          ))}
          
          {/* Filler nodes to maintain spacing */}
          {Array.from({ length: 5 - row.length }).map((_, i) => (
            <div key={`filler-${i}`} className="h-16 w-16" />
          ))}
        </motion.div>
      ))}
      
      <motion.div 
        className="flex items-center justify-around mt-8 pt-4 border-t"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center">
          <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
          <span className="text-xs">Completed</span>
        </div>
        <div className="flex items-center">
          <div className="h-4 w-4 rounded-full bg-secondary mr-2"></div>
          <span className="text-xs">Current</span>
        </div>
        <div className="flex items-center">
          <div className="h-4 w-4 rounded-full bg-background border border-muted-foreground mr-2"></div>
          <span className="text-xs">Available</span>
        </div>
        <div className="flex items-center">
          <div className="h-4 w-4 rounded-full bg-muted text-muted-foreground mr-2 flex items-center justify-center">
            <Lock className="h-2 w-2" />
          </div>
          <span className="text-xs">Locked</span>
        </div>
      </motion.div>
    </div>
  );
};

export default RoadmapPath;
