import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SentenceMiningProgress, SentenceMiningSession } from '@/types/sentence-mining';
import { Target, Zap, TrendingUp, Calendar } from 'lucide-react';
interface ProgressTrackerProps {
  progress: SentenceMiningProgress | null;
  currentSession: SentenceMiningSession | null;
}
export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
  currentSession
}) => {
  if (!progress) {
    return null;
  }
  const sessionAccuracy = currentSession ? currentSession.totalCorrect / Math.max(currentSession.totalAttempts, 1) * 100 : 0;
  return;
};