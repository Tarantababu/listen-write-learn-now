
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRoadmap } from '@/hooks/use-roadmap';
import { motion } from 'framer-motion';
import { 
  Award, 
  BadgeCheck, 
  Bookmark, 
  CheckCircle2,
  Clock, 
  Flag, 
  LocateFixed, 
  Lock, 
  RefreshCw, 
  Sparkles 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import RoadmapProgressBar from './RoadmapProgressBar';

const RoadmapProgressDashboard: React.FC = () => {
  const { 
    currentRoadmap, 
    nodes, 
    completedNodes, 
    currentNodeId,
    nodeProgress,
    isLoading,
    resetProgress
  } = useRoadmap();
  
  const [isResetting, setIsResetting] = React.useState(false);
  
  // Group nodes by completion status
  const completedNodeIds = new Set(completedNodes);
  const completedCount = completedNodes.length;
  const totalCount = nodes.length;
  
  // Filter out bonus nodes for regular progress calculation
  const regularNodes = nodes.filter(node => !node.isBonus);
  const completedRegularNodes = regularNodes.filter(node => completedNodeIds.has(node.id));
  const regularProgressPercentage = regularNodes.length > 0 
    ? Math.round((completedRegularNodes.length / regularNodes.length) * 100) 
    : 0;
  
  // Separate nodes by type
  const bonusNodes = nodes.filter(node => node.isBonus);
  const completedBonusNodes = bonusNodes.filter(node => completedNodeIds.has(node.id));
  
  // Find current node for highlighting
  const currentNode = nodes.find(node => node.id === currentNodeId);
  
  // Node progress tracking
  const nodeProgressMap = new Map();
  nodeProgress.forEach(progress => {
    nodeProgressMap.set(progress.nodeId, progress);
  });
  
  // Handler for resetting progress
  const handleResetProgress = async () => {
    if (!currentRoadmap) return;
    
    try {
      setIsResetting(true);
      await resetProgress(currentRoadmap.id);
      toast({
        title: "Progress reset",
        description: "Your progress has been reset successfully."
      });
    } catch (error) {
      console.error("Error resetting progress:", error);
      toast({
        variant: "destructive",
        title: "Failed to reset progress",
        description: "There was an error resetting your progress. Please try again."
      });
    } finally {
      setIsResetting(false);
    }
  };
  
  const cardItemAnimation = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12 items-center">
        <div className="animate-spin text-primary">
          <RefreshCw className="h-8 w-8" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <RoadmapProgressBar className="max-w-md mx-auto" />
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-bold">{completedCount}</p>
              <p className="text-sm text-muted-foreground">out of {totalCount} lessons</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base flex items-center">
                <Award className="h-4 w-4 mr-2 text-amber-500" />
                Bonus Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-bold">{completedBonusNodes.length}</p>
              <p className="text-sm text-muted-foreground">out of {bonusNodes.length} completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                Current Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-bold">{regularProgressPercentage}%</p>
              <p className="text-sm text-muted-foreground">of main path completed</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current Lesson</h3>
        {currentNode ? (
          <motion.div
            {...cardItemAnimation}
          >
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <LocateFixed className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-medium">{currentNode.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {currentNode.description || "Continue your learning journey with this lesson"}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground mt-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {nodeProgressMap.get(currentNode.id)?.lastPracticedAt ? (
                        <span>Last practiced: {new Date(nodeProgressMap.get(currentNode.id).lastPracticedAt).toLocaleDateString()}</span>
                      ) : (
                        <span>Not started yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">No current lesson set</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Lesson Status</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
              Completed ({completedNodes.length})
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {completedNodes.length > 0 ? (
                nodes
                  .filter(node => completedNodeIds.has(node.id))
                  .map((node, index) => (
                    <motion.div
                      key={node.id}
                      {...cardItemAnimation}
                      transition={{ 
                        ...cardItemAnimation.transition, 
                        delay: index * 0.05 
                      }}
                    >
                      <Card className="border-green-200 dark:border-green-900">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BadgeCheck className={cn(
                              "h-4 w-4",
                              node.isBonus ? "text-amber-500" : "text-green-500"
                            )} />
                            <span className="text-sm truncate max-w-[180px]">
                              {node.title}
                            </span>
                          </div>
                          {node.isBonus && (
                            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs px-2 py-0.5 rounded-full">Bonus</span>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
              ) : (
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-sm text-muted-foreground">No lessons completed yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center">
              <Lock className="h-4 w-4 mr-1.5 text-muted-foreground" />
              Locked ({nodes.length - completedNodes.length - (currentNode ? 1 : 0)})
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {nodes
                .filter(node => !completedNodeIds.has(node.id) && node.id !== currentNodeId)
                .slice(0, 5) // Limit to 5 upcoming nodes
                .map((node, index) => (
                  <motion.div
                    key={node.id}
                    {...cardItemAnimation}
                    transition={{ 
                      ...cardItemAnimation.transition, 
                      delay: index * 0.05 
                    }}
                  >
                    <Card className="border-muted/50 bg-muted/30">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {node.status === 'available' ? (
                            <Bookmark className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm truncate max-w-[180px] text-muted-foreground">
                            {node.title}
                          </span>
                        </div>
                        {node.isBonus && (
                          <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">Bonus</span>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              {nodes.filter(node => !completedNodeIds.has(node.id) && node.id !== currentNodeId).length > 5 && (
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      + {nodes.filter(node => !completedNodeIds.has(node.id) && node.id !== currentNodeId).length - 5} more lessons
                    </p>
                  </CardContent>
                </Card>
              )}
              {nodes.filter(node => !completedNodeIds.has(node.id) && node.id !== currentNodeId).length === 0 && (
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-sm text-muted-foreground">All lessons either completed or in progress</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10"
          onClick={handleResetProgress}
          disabled={isResetting || completedCount === 0}
        >
          {isResetting ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> 
              Resetting...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> 
              Reset Progress
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default RoadmapProgressDashboard;
