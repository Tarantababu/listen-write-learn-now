import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  fetchRoadmapNodes, 
  fetchUserProgress,
  UserRoadmap,
  RoadmapNode, 
  RoadmapProgress,
  isNodeUnlocked,
} from '@/services/roadmapService';
import { toast } from 'sonner';
import { 
  Trophy, 
  Lock, 
  CheckCircle, 
  CircleDashed, 
  Activity, 
  BookOpen,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RoadmapViewProps {
  userRoadmap: UserRoadmap;
  onNodeClick: (node: RoadmapNode) => void;
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ userRoadmap, onNodeClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [progress, setProgress] = useState<RoadmapProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockStatus, setUnlockStatus] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (userRoadmap && user) {
      loadRoadmapData();
    }
  }, [userRoadmap, user]);

  const loadRoadmapData = async () => {
    setLoading(true);
    try {
      // Load nodes for this roadmap
      const nodesData = await fetchRoadmapNodes(userRoadmap.roadmap_id);
      setNodes(nodesData);
      
      // Load user progress for this roadmap
      if (user) {
        const progressData = await fetchUserProgress(user.id, userRoadmap.roadmap_id);
        setProgress(progressData);
        
        // Check unlock status for each node
        const unlockData: Record<string, boolean> = {};
        await Promise.all(
          nodesData.map(async (node) => {
            const isUnlocked = await isNodeUnlocked(user.id, node.id);
            unlockData[node.id] = isUnlocked;
          })
        );
        setUnlockStatus(unlockData);
      }
    } catch (error) {
      console.error("Failed to load roadmap data", error);
      toast.error("Failed to load roadmap data");
    } finally {
      setLoading(false);
    }
  };

  const isNodeCompleted = (nodeId: string) => {
    return progress.some(p => p.node_id === nodeId && p.completed);
  };

  const getNodeStatus = (node: RoadmapNode) => {
    // First check: is this the current active node?
    if (userRoadmap.current_node_id === node.id) {
      return 'current';
    }
    
    // Second check: is this node completed?
    if (isNodeCompleted(node.id)) {
      return 'completed';
    }
    
    // Third check: is this node unlocked?
    if (unlockStatus[node.id]) {
      return 'unlocked';
    }
    
    // Default: locked
    return 'locked';
  };

  const renderNode = (node: RoadmapNode) => {
    const status = getNodeStatus(node);
    
    const statusClasses = {
      completed: "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700",
      current: "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700 shadow-md",
      unlocked: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/50",
      locked: "bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800 opacity-70"
    };
    
    const isBonus = node.is_bonus;
    
    return (
      <TooltipProvider key={node.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`
                relative 
                border-2 
                rounded-lg 
                p-3 
                cursor-pointer
                transition-all
                ${statusClasses[status]}
                ${isBonus ? 'border-yellow-300 dark:border-yellow-700' : ''}
                ${status === 'locked' ? 'cursor-not-allowed' : 'transform hover:-translate-y-1'}
              `}
              onClick={() => status !== 'locked' && onNodeClick(node)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">{node.position}</span>
                {status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />}
                {status === 'current' && <CircleDashed className="h-4 w-4 text-blue-600 dark:text-blue-500 animate-pulse" />}
                {status === 'locked' && <Lock className="h-4 w-4 text-gray-400" />}
                {status === 'unlocked' && <BookOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
              </div>
              
              <div className="text-sm font-medium line-clamp-2">{node.title}</div>
              
              {isBonus && (
                <Badge 
                  variant="outline" 
                  className="absolute -top-2 -right-2 bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  Bonus
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            <div className="space-y-1">
              <div className="font-medium">{node.title}</div>
              {node.description && <div className="text-xs opacity-90">{node.description}</div>}
              <div className="text-xs flex items-center pt-1">
                {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1 text-green-600" />}
                {status === 'current' && <CircleDashed className="h-3 w-3 mr-1 text-blue-600" />}
                {status === 'locked' && <Lock className="h-3 w-3 mr-1" />}
                {status === 'unlocked' && <BookOpen className="h-3 w-3 mr-1" />}
                
                <span>
                  {status === 'completed' && 'Completed'}
                  {status === 'current' && 'Current Exercise'}
                  {status === 'unlocked' && 'Ready to start'}
                  {status === 'locked' && 'Complete previous exercises to unlock'}
                </span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No exercises found</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              This roadmap doesn't have any exercises yet. Please check back later or try another roadmap.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = progress.filter(p => p.completed).length;
  const completionPercentage = nodes.length > 0 
    ? Math.round((completedCount / nodes.length) * 100) 
    : 0;

  // Filter out regular nodes and bonus nodes
  const regularNodes = nodes.filter(node => !node.is_bonus);
  const bonusNodes = nodes.filter(node => node.is_bonus);

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-2 md:mb-0">
              <h3 className="text-lg font-medium">
                {userRoadmap.roadmap?.name || 'Roadmap'}
                <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                  {userRoadmap.roadmap?.level || 'Level'}
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {nodes.length} exercises completed ({completionPercentage}%)
              </p>
            </div>
            
            {userRoadmap.current_node_id && (
              <Button 
                size="sm" 
                className="flex items-center"
                onClick={() => {
                  const currentNode = nodes.find(n => n.id === userRoadmap.current_node_id);
                  if (currentNode) {
                    onNodeClick(currentNode);
                  }
                }}
              >
                Continue Learning <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          <ScrollArea className="h-full w-full py-4">
            <div className="space-y-6">
              {/* Regular nodes */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Main Path</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
                  {regularNodes.map(renderNode)}
                </div>
              </div>
              
              {/* Bonus nodes - only show if there are any */}
              {bonusNodes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground flex items-center">
                    <Activity className="h-4 w-4 mr-1 text-yellow-600 dark:text-yellow-500" />
                    Bonus Exercises
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
                    {bonusNodes.map(renderNode)}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoadmapView;
