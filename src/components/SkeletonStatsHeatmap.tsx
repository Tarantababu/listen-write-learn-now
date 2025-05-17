
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const SkeletonStatsHeatmap: React.FC = () => {
  return (
    <Card className="col-span-full animate-fade-in shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar skeleton */}
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-8" />
            </div>
            
            <Skeleton className="h-[280px] w-full rounded-md" />
            
            <div className="flex justify-end gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-1.5">
                  <Skeleton className="h-3 w-3 rounded-sm" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>
          
          {/* In-progress exercises skeleton */}
          <div>
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="space-y-2 flex-grow">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between rounded-md border p-3">
                    <div className="w-full">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <div className="flex items-center gap-2 mt-1">
                        <Skeleton className="h-1.5 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-3">
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkeletonStatsHeatmap;
