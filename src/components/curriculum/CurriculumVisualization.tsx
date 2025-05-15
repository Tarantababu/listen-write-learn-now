
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCurriculum } from '@/hooks/use-curriculum';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Lock, ArrowRight, Clock } from 'lucide-react';
import { useMedia } from 'react-use'; // Changed from useMediaQuery to useMedia which is available
import LevelBadge from '@/components/LevelBadge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { LanguageLevel } from '@/types';

export const CurriculumVisualization: React.FC = () => {
  const { 
    currentCurriculumPath, 
    nodes, 
    completedNodes, 
    availableNodes, 
    currentNodeId,
    nodeLoading,
    getNodeExercise
  } = useCurriculum();
  
  const { toast } = useToast();
  const isMobile = useMedia('(max-width: 768px)'); // Changed to useMedia

  // Get curriculum data
  const curriculum = useMemo(() => {
    return currentCurriculumPath?.curriculum || null;
  }, [currentCurriculumPath]);

  // Sort nodes by sequence order
  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => a.sequence_order - b.sequence_order);
  }, [nodes]);

  // Handle node click
  const handleNodeClick = async (nodeId: string, isAvailable: boolean) => {
    if (!isAvailable) {
      toast({
        title: "Node Locked",
        description: "Complete previous nodes to unlock this one.",
        variant: "default",
      });
      return;
    }

    try {
      const exercise = await getNodeExercise(nodeId);
      if (exercise) {
        // Here you would open the exercise modal or navigate to it
        console.log('Opening exercise:', exercise);
        // You'd implement your exercise modal/page opening logic here
      } else {
        toast({
          title: "No Exercise Found",
          description: "This node has no exercises attached.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error getting node exercise:', error);
      toast({
        title: "Error",
        description: "Failed to load the exercise for this node.",
        variant: "destructive",
      });
    }
  };

  // Get node status
  const getNodeStatus = (nodeId: string) => {
    if (completedNodes.includes(nodeId)) return 'completed';
    if (availableNodes.includes(nodeId)) return 'available';
    if (currentNodeId === nodeId) return 'current';
    return 'locked';
  };

  // Get node status icon
  const getNodeStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'available':
      case 'current':
        return <Circle className="h-6 w-6 text-blue-500" />;
      case 'locked':
        return <Lock className="h-6 w-6 text-gray-400" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />;
    }
  };

  if (!curriculum || sortedNodes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No curriculum data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">{curriculum.name}</h2>
            <div className="flex items-center mt-1">
              <p className="text-muted-foreground capitalize">{curriculum.language}</p>
              <span className="mx-2 text-muted-foreground">•</span>
              <LevelBadge level={curriculum.level as LanguageLevel} />
            </div>
          </div>
          <div className="mt-2 md:mt-0">
            <p className="text-sm text-muted-foreground">
              Progress: {currentCurriculumPath?.completion_percentage || 0}% Complete
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${currentCurriculumPath?.completion_percentage || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {curriculum.description && (
          <p className="text-muted-foreground mb-6">{curriculum.description}</p>
        )}

        <Separator className="my-6" />

        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-col space-y-8'}`}>
          {sortedNodes.map((node, index) => {
            const nodeStatus = getNodeStatus(node.id);
            const isLastNode = index === sortedNodes.length - 1;

            return (
              <div key={node.id} className="flex flex-col">
                <div className="flex items-start">
                  <div className="mr-4">
                    {getNodeStatusIcon(nodeStatus)}
                  </div>
                  <motion.div 
                    className="flex-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`border ${
                      nodeStatus === 'completed' ? 'border-green-200 bg-green-50' : 
                      nodeStatus === 'current' ? 'border-blue-200 bg-blue-50' :
                      nodeStatus === 'available' ? 'border-blue-100' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg flex items-center justify-between">
                          {node.name}
                          <span className="text-sm font-normal text-muted-foreground">
                            {node.min_completion_count} completions at {node.min_accuracy_percentage}% accuracy
                          </span>
                        </h3>
                        {node.description && (
                          <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
                        )}
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button 
                          onClick={() => handleNodeClick(node.id, ['available', 'completed', 'current'].includes(nodeStatus))}
                          disabled={nodeStatus === 'locked' || nodeLoading}
                          variant={nodeStatus === 'completed' ? 'outline' : 'default'}
                          className="w-full sm:w-auto"
                        >
                          {nodeStatus === 'completed' ? 'Practice Again' : 'Start Exercise'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </div>
                
                {!isLastNode && !isMobile && (
                  <div className="ml-7 my-2 border-l-2 border-dashed h-4 border-gray-300"></div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurriculumVisualization;
