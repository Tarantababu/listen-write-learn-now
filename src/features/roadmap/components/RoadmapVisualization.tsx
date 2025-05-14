
import React from 'react';
import { useRoadmap } from '@/hooks/use-roadmap';
import { RoadmapNode } from '../types';
import { Button } from '@/components/ui/button';
import { CheckCircle, CircleDashed, Lock, Play } from 'lucide-react';

interface RoadmapVisualizationProps {
  onNodeSelect: (node: RoadmapNode) => void;
}

const RoadmapVisualization: React.FC<RoadmapVisualizationProps> = ({ onNodeSelect }) => {
  const { nodes, isLoading } = useRoadmap();

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading roadmap...</div>;
  }

  if (nodes.length === 0) {
    return <div className="text-center py-8">No nodes found for this roadmap.</div>;
  }

  return (
    <div className="py-4">
      <div className="flex flex-col items-center">
        {nodes.map((node, index) => (
          <div key={node.id} className="w-full max-w-md mb-4">
            <div className="flex items-start">
              {/* Connector line */}
              {index > 0 && (
                <div className="h-8 w-0.5 bg-muted-foreground/30 -mt-4 ml-6"></div>
              )}
            </div>
            
            <div className="flex items-start space-x-4">
              {/* Status icon */}
              <div className="p-2 rounded-full bg-background border">
                {node.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : node.status === 'available' ? (
                  <CircleDashed className="h-5 w-5 text-blue-500" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              
              {/* Node content */}
              <div className="flex-1 bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{node.title}</h3>
                    {node.description && (
                      <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
                    )}
                  </div>
                  
                  <Button
                    variant={node.status === 'current' ? "default" : "outline"}
                    size="sm"
                    disabled={node.status === 'locked'}
                    onClick={() => onNodeSelect(node)}
                  >
                    {node.status === 'completed' ? (
                      "Review"
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                </div>
                
                {node.isBonus && (
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                    Bonus Exercise
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapVisualization;
