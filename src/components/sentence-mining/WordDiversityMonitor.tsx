
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedSentenceMiningService } from '@/services/enhancedSentenceMiningService';

interface WordDiversityMonitorProps {
  language: string;
  sessionId: string;
  exercises: Array<{ targetWord: string; createdAt: Date }>;
}

export const WordDiversityMonitor: React.FC<WordDiversityMonitorProps> = ({
  language,
  sessionId,
  exercises
}) => {
  const { user } = useAuth();
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [wordUsageStats, setWordUsageStats] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!user) return;

    const loadSessionStats = async () => {
      try {
        const stats = await EnhancedSentenceMiningService.getEnhancedSessionStats(
          user.id,
          language,
          sessionId
        );
        setSessionStats(stats);
      } catch (error) {
        console.error('Error loading session stats:', error);
      }
    };

    loadSessionStats();
  }, [user, language, sessionId, exercises.length]);

  useEffect(() => {
    // Calculate word usage statistics
    const usage = new Map<string, number>();
    exercises.forEach(ex => {
      const word = ex.targetWord.toLowerCase();
      usage.set(word, (usage.get(word) || 0) + 1);
    });
    setWordUsageStats(usage);
  }, [exercises]);

  const getDiversityStatus = () => {
    if (!sessionStats) return { status: 'unknown', color: 'gray' };
    
    const score = sessionStats.overallHealthScore;
    if (score >= 80) return { status: 'excellent', color: 'green' };
    if (score >= 60) return { status: 'good', color: 'blue' };
    if (score >= 40) return { status: 'fair', color: 'yellow' };
    return { status: 'poor', color: 'red' };
  };

  const getOverusedWords = () => {
    return Array.from(wordUsageStats.entries())
      .filter(([, count]) => count > 2)
      .sort((a, b) => b[1] - a[1]);
  };

  const diversityStatus = getDiversityStatus();
  const overusedWords = getOverusedWords();

  return (
    <Card className="p-4 mb-4 bg-card/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Word Diversity Monitor</h3>
        <div className="flex items-center gap-2">
          {diversityStatus.status === 'excellent' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {diversityStatus.status !== 'excellent' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
          <Badge variant={diversityStatus.color === 'green' ? 'default' : 'secondary'}>
            {diversityStatus.status}
          </Badge>
        </div>
      </div>

      {sessionStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="text-center">
            <div className="text-lg font-semibold">{sessionStats.overallHealthScore}%</div>
            <div className="text-xs text-muted-foreground">Health Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{sessionStats.wordStats?.availableWords || 0}</div>
            <div className="text-xs text-muted-foreground">Available Words</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{sessionStats.cooldownStats?.activeCooldowns || 0}</div>
            <div className="text-xs text-muted-foreground">On Cooldown</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{Math.round(sessionStats.diversityMetrics?.vocabularyVariety || 0)}%</div>
            <div className="text-xs text-muted-foreground">Vocabulary Variety</div>
          </div>
        </div>
      )}

      {overusedWords.length > 0 && (
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-600">Overused Words</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {overusedWords.slice(0, 5).map(([word, count]) => (
              <Badge key={word} variant="outline" className="text-xs">
                {word} ({count}x)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {exercises.length >= 5 && (
        <div className="border-t pt-3 mt-3">
          <div className="text-xs text-muted-foreground">
            Recent words: {exercises.slice(-5).map(e => e.targetWord).join(', ')}
          </div>
        </div>
      )}
    </Card>
  );
};
