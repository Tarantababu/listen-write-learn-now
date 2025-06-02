
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Loader } from 'lucide-react';

interface LoadingVisualizationProps {
  type: 'session' | 'words' | 'drill' | 'evaluation';
  message?: string;
}

const LoadingVisualization: React.FC<LoadingVisualizationProps> = ({ type, message }) => {
  const getLoadingContent = () => {
    switch (type) {
      case 'session':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Loader className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg font-medium">
                {message || 'Preparing your session...'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      
      case 'words':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Loader className="h-5 w-5 animate-spin text-green-600" />
              <span className="text-base font-medium">
                {message || 'Generating new words...'}
              </span>
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'drill':
        return (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Loader className="h-6 w-6 animate-spin text-purple-600" />
              <span className="text-lg font-medium">
                {message || 'Creating practice drill...'}
              </span>
            </div>
            <Card className="p-8">
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-16 w-full" />
                <div className="flex justify-center space-x-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'evaluation':
        return (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Loader className="h-5 w-5 animate-spin text-orange-600" />
              <span className="text-base font-medium">
                {message || 'Evaluating your response...'}
              </span>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-3 w-48 mx-auto" />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center space-x-2">
            <Loader className="h-5 w-5 animate-spin" />
            <span>{message || 'Loading...'}</span>
          </div>
        );
    }
  };

  return (
    <div className="animate-fade-in">
      {getLoadingContent()}
    </div>
  );
};

export default LoadingVisualization;
