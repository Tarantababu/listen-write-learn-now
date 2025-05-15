
import React from 'react';
import { useCurriculumPath } from '@/hooks/use-curriculum-path';
import { CurriculumNode } from '@/types';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurriculumPathVisualizationProps {
  onNodeSelect: (node: CurriculumNode) => void;
}

const CurriculumPathVisualization: React.FC<CurriculumPathVisualizationProps> = ({ onNodeSelect }) => {
  const { 
    currentCurriculumPath, 
    nodes = [], 
    completedNodes = [], 
    isLoading, 
    curriculumPaths = [],
    currentNodeId,
    availableNodes = [],
    nodeProgress = []
  } = useCurriculumPath();
  
  const getNodeStatus = (node: CurriculumNode): 'completed' | 'available' | 'locked' => {
    if ((completedNodes || []).includes(node.id)) {
      return 'completed';
    }

    if (node.id === currentNodeId) {
      return 'available';
    }

    return (availableNodes || []).includes(node.id) ? 'available' : 'locked';
  };

  if (isLoading) {
    return <div>Loading curriculum path...</div>;
  }

  if (!currentCurriculumPath) {
    return <div>No curriculum path selected.</div>;
  }

  // Find the curriculum path details from the curriculumPaths array
  const curriculumPathDetails = curriculumPaths.find(r => r.id === currentCurriculumPath.curriculumPathId);

  const handleNodeClick = (node: CurriculumNode) => {
    onNodeSelect(node);
  };

  return (
    <div>
      <h2>{curriculumPathDetails?.name || "Learning Path"}</h2>
      <p>Current Node ID: {currentNodeId}</p>
      <div>
        {nodes.map((node) => (
          <div key={node.id}>
            <button
              onClick={() => handleNodeClick(node)}
              disabled={getNodeStatus(node) === 'locked'}
              className={cn(
                "p-2 rounded",
                getNodeStatus(node) === 'completed' && "bg-green-500 text-white",
                getNodeStatus(node) === 'available' && "bg-blue-500 text-white",
                getNodeStatus(node) === 'locked' && "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              {node.title}
              {getNodeStatus(node) === 'locked' && <Lock className="inline-block ml-2 h-4 w-4" />}
              {getNodeStatus(node) === 'completed' && <Check className="inline-block ml-2 h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurriculumPathVisualization;
