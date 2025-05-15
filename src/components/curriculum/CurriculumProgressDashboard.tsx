
import React from 'react';
import { useCurriculum } from '@/contexts/CurriculumContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, BarChart, BookOpen, CheckSquare, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const CurriculumProgressDashboard: React.FC = () => {
  const { 
    nodes, 
    nodeProgress, 
    completedNodes, 
    isLoading, 
    currentCurriculumPath 
  } = useCurriculum();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  const totalNodes = nodes.length;
  const completedNodeCount = completedNodes.length;
  const completionPercentage = totalNodes > 0 ? (completedNodeCount / totalNodes) * 100 : 0;
  
  const regularNodes = nodes.filter(n => !n.isBonus);
  const bonusNodes = nodes.filter(n => n.isBonus);
  
  const completedRegularNodes = nodes
    .filter(n => !n.isBonus && completedNodes.includes(n.id))
    .length;
  
  const completedBonusNodes = nodes
    .filter(n => n.isBonus && completedNodes.includes(n.id))
    .length;
    
  const totalPracticeCount = nodeProgress.reduce((sum, curr) => sum + curr.completionCount, 0);
  
  // Calculate practice count in the last 7 days
  const lastWeekPractices = nodeProgress.filter(p => {
    if (!p.lastPracticedAt) return false;
    const practiceDate = new Date(p.lastPracticedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - practiceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Your Progress</h3>
        <p className="text-sm text-muted-foreground">
          Track your progress in {currentCurriculumPath?.language} curriculum
        </p>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Overall completion</span>
          <span className="font-medium">{completedNodeCount}/{totalNodes} exercises</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Core Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedRegularNodes}/{regularNodes.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Core exercises completed
              </p>
              <Progress 
                value={(completedRegularNodes / Math.max(regularNodes.length, 1)) * 100} 
                className="h-1 mt-2" 
              />
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Bonus Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedBonusNodes}/{bonusNodes.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Bonus exercises completed
              </p>
              <Progress 
                value={(completedBonusNodes / Math.max(bonusNodes.length, 1)) * 100} 
                className="h-1 mt-2" 
              />
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckSquare className="h-4 w-4 mr-2" />
                Total Practice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPracticeCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total exercises practiced
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart className="h-4 w-4 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lastWeekPractices}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Exercises practiced in the last 7 days
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CurriculumProgressDashboard;
