
import React from 'react';
import { useCurriculum } from '@/contexts/CurriculumContext';
import { CurriculumNode } from '@/types';
import CurriculumNodeCard from './CurriculumNodeCard';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface CurriculumVisualizationProps {
  onNodeSelect: (node: CurriculumNode) => void;
}

const CurriculumVisualization: React.FC<CurriculumVisualizationProps> = ({ onNodeSelect }) => {
  const { 
    nodes, 
    isLoading, 
    nodeProgress, 
    availableNodes
  } = useCurriculum();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading curriculum...</p>
        </div>
      </div>
    );
  }
  
  if (nodes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No exercises found in this curriculum. Please try another one.
        </p>
      </div>
    );
  }
  
  // Group nodes by whether they are bonus content or not
  const regularNodes = nodes.filter(node => !node.isBonus);
  const bonusNodes = nodes.filter(node => node.isBonus);
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Core Curriculum</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regularNodes.map((node, index) => {
            const nodeProgressItem = nodeProgress.find(p => p.nodeId === node.id);
            const isAvailable = availableNodes.includes(node.id);
            
            return (
              <motion.div 
                key={node.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <CurriculumNodeCard 
                  node={node} 
                  progress={nodeProgressItem} 
                  isAvailable={isAvailable}
                  onClick={onNodeSelect}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {bonusNodes.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Bonus Content</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bonusNodes.map((node, index) => {
                const nodeProgressItem = nodeProgress.find(p => p.nodeId === node.id);
                // Bonus nodes are always available
                const isAvailable = true;
                
                return (
                  <motion.div 
                    key={node.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <CurriculumNodeCard 
                      node={node} 
                      progress={nodeProgressItem} 
                      isAvailable={isAvailable}
                      onClick={onNodeSelect}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurriculumVisualization;
