
import React from 'react';
import { RoadmapNode } from '../types';
import RoadmapNodeCard from './RoadmapNodeCard';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react'; // Correct import from lucide-react

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

  return (
    <div className="space-y-10">
      {nodeRows.map((row, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className={cn(
            "flex items-center justify-between gap-6 relative",
            rowIndex % 2 === 1 && "flex-row-reverse"
          )}
        >
          {/* Connection lines */}
          <div className="absolute h-2 bg-muted-foreground/30 top-1/2 left-8 right-8 -translate-y-1/2 -z-10"></div>
          
          {row.map((node) => (
            <RoadmapNodeCard
              key={node.id}
              node={node}
              onNodeClick={onNodeSelect}
            />
          ))}
          
          {/* Filler nodes to maintain spacing */}
          {Array.from({ length: 5 - row.length }).map((_, i) => (
            <div key={`filler-${i}`} className="h-16 w-16" />
          ))}
        </div>
      ))}
      
      <div className="flex items-center justify-around mt-4 pt-4 border-t">
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
      </div>
    </div>
  );
};

export default RoadmapPath;
