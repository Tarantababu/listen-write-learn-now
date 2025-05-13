
import React from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import { RoadmapNode } from '@/types';
import { Check, Lock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import LevelBadge from '@/components/LevelBadge';
import { Loader2 } from 'lucide-react';

interface RoadmapNodeProps {
  node: RoadmapNode;
  status: 'completed' | 'current' | 'locked' | 'available';
  progress?: number; // Add progress (completion count)
  onNodeClick: (node: RoadmapNode) => void;
}

const RoadmapNodeComponent: React.FC<RoadmapNodeProps> = ({ node, status, progress = 0, onNodeClick }) => {
  const getNodeColor = () => {
    switch (status) {
      case 'completed': return 'bg-primary text-primary-foreground border-primary';
      case 'current': return 'bg-secondary text-secondary-foreground border-secondary animated-pulse';
      case 'available': return 'bg-background text-foreground border-muted-foreground';
      default: return 'bg-muted text-muted-foreground border-muted opacity-70';
    }
  };

  const getNodeIcon = () => {
    if (status === 'completed') return <Check className="h-5 w-5" />;
    if (status === 'locked') return <Lock className="h-4 w-4" />;
    if (node.isBonus) return <Star className="h-4 w-4 text-amber-500" />;
    return null;
  };

  // Display progress badge if there is progress but not completed
  const showProgressBadge = progress > 0 && status !== 'completed';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Button
              onClick={() => onNodeClick(node)}
              disabled={status === 'locked'}
              variant="outline"
              className={cn(
                "h-16 w-16 rounded-full border-2 flex flex-col items-center justify-center p-0 transition-all",
                getNodeColor(),
                status === 'current' && "ring-2 ring-offset-2 ring-primary",
                node.isBonus && "border-amber-500"
              )}
            >
              {getNodeIcon()}
              <span className="text-xs font-bold mt-1">{node.position + 1}</span>
            </Button>
            
            {showProgressBadge && (
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                {progress}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 p-1">
            <div className="flex items-center gap-1">
              {node.isBonus && (
                <Badge variant="secondary" className="text-xs px-1 py-0 h-4 bg-amber-500/20 text-amber-700">
                  BONUS
                </Badge>
              )}
              <span className="font-medium">{node.title}</span>
            </div>
            {node.description && (
              <p className="text-xs text-muted-foreground">{node.description}</p>
            )}
            <div className="text-xs flex items-center gap-1">
              <span>
                {status === 'locked' ? 'Locked' : 
                 status === 'completed' ? 'Completed' : 
                 status === 'current' ? 'Current' : 'Available'}
              </span>
              {progress > 0 && status !== 'completed' && (
                <span className="ml-1">- Progress: {progress}/3</span>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface RoadmapVisualizationProps {
  onNodeSelect: (node: RoadmapNode) => void;
}

const RoadmapVisualization: React.FC<RoadmapVisualizationProps> = ({ onNodeSelect }) => {
  const { 
    currentRoadmap, 
    nodes, 
    currentNodeId, 
    completedNodes, 
    availableNodes,
    nodeProgress,
    loading,
    roadmaps 
  } = useRoadmap();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading roadmap...</p>
      </div>
    );
  }

  if (!currentRoadmap) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No roadmap selected</p>
      </div>
    );
  }

  // Find the roadmap details using the roadmapId from currentRoadmap
  const roadmapDetails = roadmaps.find(r => r.id === currentRoadmap.roadmapId);
  const roadmapName = roadmapDetails?.name || "Learning Path";
  const roadmapLevel = roadmapDetails?.level;

  const getNodeStatus = (node: RoadmapNode): 'completed' | 'current' | 'locked' | 'available' => {
    if (completedNodes.includes(node.id)) return 'completed';
    
    // Check if node is completed in the detailed progress
    const nodeProgressInfo = nodeProgress.find(np => np.nodeId === node.id);
    if (nodeProgressInfo?.isCompleted) return 'completed';
    
    if (node.id === currentNodeId) return 'current';
    if (availableNodes.includes(node.id)) return 'available';
    return 'locked';
  };

  // Get node completion count from progress data
  const getNodeProgress = (nodeId: string): number => {
    const progressInfo = nodeProgress.find(np => np.nodeId === nodeId);
    return progressInfo?.completionCount || 0;
  };

  const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);
  
  // Group nodes by "rows" of 5 for display
  const nodeRows: RoadmapNode[][] = [];
  for (let i = 0; i < sortedNodes.length; i += 5) {
    nodeRows.push(sortedNodes.slice(i, i + 5));
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{roadmapName}</h2>
          <div className="flex items-center mt-1">
            {roadmapLevel && <LevelBadge level={roadmapLevel} className="mr-2" />}
            <span className="text-sm text-muted-foreground">
              {completedNodes.length} of {nodes.length} completed
            </span>
          </div>
        </div>
      </div>

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
              <RoadmapNodeComponent
                key={node.id}
                node={node}
                status={getNodeStatus(node)}
                progress={getNodeProgress(node.id)}
                onNodeClick={() => onNodeSelect(node)}
              />
            ))}
            
            {/* Filler nodes to maintain spacing */}
            {Array.from({ length: 5 - row.length }).map((_, i) => (
              <div key={`filler-${i}`} className="h-16 w-16" />
            ))}
          </div>
        ))}
      </div>
      
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

export default RoadmapVisualization;
