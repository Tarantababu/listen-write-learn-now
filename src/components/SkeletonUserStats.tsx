
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const SkeletonUserStats: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title skeleton */}
      <Skeleton className="h-7 w-48" />
      
      {/* Language Level Display skeleton */}
      <div className="w-full p-4 border rounded-lg bg-background/50">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-2.5 w-full mb-4" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      
      {/* Stats Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3].map(index => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
              <Skeleton className="h-2 w-full mb-4" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Heatmap skeleton */}
      <Card className="col-span-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-8" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkeletonUserStats;
