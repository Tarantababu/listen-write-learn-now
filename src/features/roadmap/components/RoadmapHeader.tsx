
import React from 'react';
import { useRoadmap } from '@/features/roadmap/context/RoadmapContext';
import { RefreshButton } from '@/components/RefreshButton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoadmapHeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function RoadmapHeader({ showBackButton = true, title }: RoadmapHeaderProps) {
  const { refreshData, isLoading, currentRoadmap } = useRoadmap();
  
  const roadmapName = title || currentRoadmap?.name || "Roadmap";

  return (
    <div className="flex items-center justify-between mb-4 py-2 border-b">
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        )}
        <h1 className="text-xl font-bold">{roadmapName}</h1>
      </div>
      
      <RefreshButton 
        onRefresh={refreshData} 
        isLoading={isLoading} 
      />
    </div>
  );
}
