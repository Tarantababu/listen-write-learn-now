
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, X, Zap } from 'lucide-react';

interface SimpleCreationProgressProps {
  progress: number;
  status: 'generating' | 'completed' | 'error';
  message: string;
  estimatedTime?: number;
  onCancel: () => void;
  showOptimizations?: boolean;
}

export const SimpleCreationProgress: React.FC<SimpleCreationProgressProps> = ({
  progress,
  status,
  message,
  estimatedTime,
  onCancel,
  showOptimizations = true
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'generating':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold">Creating Your Reading Exercise</h3>
        </div>
        
        {showOptimizations && status === 'generating' && (
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
            <Zap className="h-4 w-4" />
            <span>Smart generation with automatic optimization</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              {estimatedTime && status === 'generating' && (
                <span className="text-xs text-muted-foreground">~{estimatedTime}s remaining</span>
              )}
            </div>
          </div>
          <Progress 
            value={progress} 
            className="h-2" 
            indicatorClassName="transition-all duration-500"
          />
        </div>

        <Card className={`
          transition-all duration-300
          ${status === 'generating' ? 'border-primary/50 bg-primary/5' : ''}
          ${status === 'completed' ? 'border-green-200 bg-green-50' : ''}
          ${status === 'error' ? 'border-red-200 bg-red-50' : ''}
        `}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${status === 'completed' 
                  ? 'bg-green-100' 
                  : status === 'error'
                    ? 'bg-red-100'
                    : 'bg-primary/10'
                }
              `}>
                {getStatusIcon()}
              </div>
              
              <div className="flex-1">
                <p className={`text-sm font-medium ${getStatusColor()}`}>
                  {message}
                </p>
                {status === 'generating' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    AI is creating your personalized content...
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {status === 'generating' && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onCancel} size="sm">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
