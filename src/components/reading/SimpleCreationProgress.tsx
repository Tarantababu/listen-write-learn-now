import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, X, Zap, Brain, Target, Sparkles, TrendingUp } from 'lucide-react';
interface QualityMetrics {
  vocabularyDiversity?: number;
  coherenceScore?: number;
  generationStrategy?: string;
  recoveryUsed?: boolean;
}
interface EnhancedCreationProgressProps {
  progress: number;
  status: 'generating' | 'completed' | 'error';
  message: string;
  estimatedTime?: number;
  onCancel: () => void;
  showOptimizations?: boolean;
  qualityMetrics?: QualityMetrics;
}
export const SimpleCreationProgress: React.FC<EnhancedCreationProgressProps> = ({
  progress,
  status,
  message,
  estimatedTime,
  onCancel,
  showOptimizations = true,
  qualityMetrics
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
  const getStrategyIcon = (strategy?: string) => {
    switch (strategy) {
      case 'direct_enhanced':
        return <Zap className="h-4 w-4" />;
      case 'smart_chunking':
        return <Brain className="h-4 w-4" />;
      case 'adaptive_chunking':
        return <Target className="h-4 w-4" />;
      case 'intelligent_recovery':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };
  const getStrategyLabel = (strategy?: string) => {
    switch (strategy) {
      case 'direct_enhanced':
        return 'Enhanced Direct';
      case 'smart_chunking':
        return 'Smart Chunking';
      case 'adaptive_chunking':
        return 'Adaptive Build';
      case 'intelligent_recovery':
        return 'Smart Recovery';
      default:
        return 'Optimized';
    }
  };
  const getProgressColor = () => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'error') return 'bg-red-500';
    if (qualityMetrics?.recoveryUsed) return 'bg-yellow-500';
    return 'bg-primary';
  };
  return <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold">Creating Your Reading Exercise</h3>
        </div>
        
        {showOptimizations && status === 'generating' && <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
            <Zap className="h-4 w-4" />
            <span>Enhanced AI generation with intelligent optimization</span>
          </div>}

        {/* Enhanced Strategy Display */}
        {qualityMetrics?.generationStrategy && <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getStrategyIcon(qualityMetrics.generationStrategy)}
              <span className="text-xs">{getStrategyLabel(qualityMetrics.generationStrategy)}</span>
            </Badge>
            {qualityMetrics.recoveryUsed && <Badge variant="secondary" className="text-xs">
                Smart Recovery
              </Badge>}
          </div>}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              {estimatedTime && status === 'generating' && <span className="text-xs text-muted-foreground">~{estimatedTime}s remaining</span>}
            </div>
          </div>
          <Progress value={progress} className="h-2" indicatorClassName={`transition-all duration-500 ${getProgressColor()}`} />
        </div>

        {/* Enhanced Quality Metrics Display */}
        {qualityMetrics && (status === 'completed' || status === 'generating') && <div className="grid grid-cols-2 gap-2">
            {qualityMetrics.vocabularyDiversity !== undefined && <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Vocabulary</div>
                <div className="text-sm font-medium">
                  {Math.round(qualityMetrics.vocabularyDiversity * 100)}%
                </div>
              </div>}
            {qualityMetrics.coherenceScore !== undefined && <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Coherence</div>
                <div className="text-sm font-medium">
                  {Math.round(qualityMetrics.coherenceScore * 100)}%
                </div>
              </div>}
          </div>}

        <Card className={`
          transition-all duration-300
          ${status === 'generating' ? 'border-primary/50 bg-primary/5' : ''}
          ${status === 'completed' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20' : ''}
          ${status === 'error' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20' : ''}
          ${qualityMetrics?.recoveryUsed ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20' : ''}
        `}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${status === 'completed' ? 'bg-green-100 dark:bg-green-900' : status === 'error' ? 'bg-red-100 dark:bg-red-900' : qualityMetrics?.recoveryUsed ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-primary/10'}
              `}>
                {getStatusIcon()}
              </div>
              
              <div className="flex-1">
                <p className={`text-sm font-medium ${getStatusColor()}`}>
                  {message}
                </p>
                {status === 'generating' && <p className="text-xs text-muted-foreground mt-1">
                    Enhanced AI is creating personalized content with quality optimization...
                  </p>}
                {status === 'completed' && qualityMetrics?.generationStrategy && <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Generated using {getStrategyLabel(qualityMetrics.generationStrategy)} strategy
                    {qualityMetrics.recoveryUsed && ' with smart recovery'}
                  </p>}
                {status === 'error' && <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Our enhanced system attempted multiple recovery methods
                  </p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {status === 'generating' && <div className="flex justify-center">
          <Button variant="outline" onClick={onCancel} size="sm">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>}

      {/* Enhanced Feature Showcase */}
      {showOptimizations && status === 'generating'}
    </div>;
};