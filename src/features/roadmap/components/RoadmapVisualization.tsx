
import React, { useEffect, useState } from 'react';
import { RoadmapItem, RoadmapNode } from '../types';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { roadmapService } from '../api/roadmapService';
import RoadmapPath from './RoadmapPath';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import confetti from 'canvas-confetti';
import { useMediaQuery } from '@/hooks/use-mobile';

interface RoadmapVisualizationProps {
  roadmapId?: string;
  onNodeSelect: (node: RoadmapNode) => void;
}

const RoadmapVisualization: React.FC<RoadmapVisualizationProps> = ({ 
  roadmapId,
  onNodeSelect
}) => {
  const { settings } = useUserSettingsContext();
  const [roadmap, setRoadmap] = useState<RoadmapItem | null>(null);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCompletedNode, setLastCompletedNode] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  
  // Load roadmap data
  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setIsLoading(true);
        
        // Get user's roadmaps
        const userRoadmaps = await roadmapService.getUserRoadmaps(settings.selectedLanguage);
        
        let currentRoadmap: RoadmapItem | undefined;
        if (roadmapId) {
          currentRoadmap = userRoadmaps.find(r => r.id === roadmapId);
        } else if (userRoadmaps.length > 0) {
          currentRoadmap = userRoadmaps[0]; // Default to first roadmap
        }
        
        if (!currentRoadmap) {
          setRoadmap(null);
          setNodes([]);
          setIsLoading(false);
          return;
        }
        
        setRoadmap(currentRoadmap);
        
        // Load roadmap nodes
        const roadmapNodes = await roadmapService.getRoadmapNodes(currentRoadmap.id);
        setNodes(roadmapNodes);
      } catch (error) {
        console.error("Error loading roadmap:", error);
        toast({
          variant: "destructive",
          title: "Error loading roadmap",
          description: "Failed to load your learning path. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRoadmap();
  }, [roadmapId, settings.selectedLanguage]);

  // Handle node selection
  const handleNodeSelect = (node: RoadmapNode) => {
    onNodeSelect(node);
  };

  // Trigger confetti effect when a new node is completed
  useEffect(() => {
    // Find current node
    const currentNodeIndex = nodes.findIndex(node => node.status === 'current');
    const currentNode = currentNodeIndex >= 0 ? nodes[currentNodeIndex] : null;
    
    // If there's a new completed node (based on status) compared to last render
    const completedNodes = nodes.filter(n => n.status === 'completed');
    const lastNode = completedNodes[completedNodes.length - 1];
    
    if (lastNode && lastNode.id !== lastCompletedNode) {
      // Update last completed node
      setLastCompletedNode(lastNode.id);
      
      // Trigger confetti
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  }, [nodes, lastCompletedNode]);

  // Calculate estimated time to completion
  const calculateEstimatedTime = () => {
    const remainingNodes = nodes.filter(n => n.status !== 'completed').length;
    // Assume 10 minutes per node
    const remainingMinutes = remainingNodes * 10;
    
    if (remainingMinutes < 60) {
      return `${remainingMinutes} minutes`;
    }
    
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    
    if (minutes === 0) {
      return `${hours} hours`;
    }
    
    return `${hours} hours, ${minutes} minutes`;
  };

  // Responsive design
  const getVisibleNodes = () => {
    if (nodes.length === 0) return [];
    
    // Calculate how many nodes to show based on screen size
    let visibleCount = 15; // Desktop default
    
    if (isMobile) {
      visibleCount = 5;
    } else if (isTablet) {
      visibleCount = 8;
    }
    
    // Find the current node's index
    const currentNodeIndex = nodes.findIndex(node => node.status === 'current');
    
    if (currentNodeIndex === -1) {
      // If no current node, start from the beginning
      return nodes.slice(0, visibleCount);
    }
    
    // Calculate start index (center the current node)
    const startIndex = Math.max(0, currentNodeIndex - Math.floor(visibleCount / 2));
    
    return nodes.slice(startIndex, startIndex + visibleCount);
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show not found message
  if (!roadmap) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Roadmap Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No learning path found. Please start a new one.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress metrics
  const completedCount = nodes.filter(n => n.status === 'completed').length;
  const totalNodes = nodes.length;
  const progressPercentage = Math.round((completedCount / totalNodes) * 100);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{roadmap.name}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="capitalize">
              {roadmap.language}
            </Badge>
            <Badge variant="secondary">{roadmap.level}</Badge>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalNodes} ({progressPercentage}%)
            </span>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium">Est. completion time</span>
          <span className="text-sm text-muted-foreground">
            {calculateEstimatedTime()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto pb-4">
          <div className={`min-w-full ${isMobile ? 'w-[600px]' : 'w-full'}`}>
            <RoadmapPath 
              nodes={isMobile || isTablet ? getVisibleNodes() : nodes} 
              onNodeSelect={handleNodeSelect} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoadmapVisualization;
