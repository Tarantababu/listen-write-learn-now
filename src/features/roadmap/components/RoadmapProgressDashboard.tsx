
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useRoadmap } from '../context/RoadmapContext';
import { Check, Calendar, Award, Clock, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LevelBadge from '@/components/LevelBadge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RoadmapProgressDashboardProps {
  className?: string;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

interface ActivityData {
  exercises_completed: number;
  words_mastered: number;
}

const RoadmapProgressDashboard: React.FC<RoadmapProgressDashboardProps> = ({ className }) => {
  const { currentRoadmap, nodes, completedNodes, roadmaps } = useRoadmap();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [timeframe, setTimeframe] = useState('all');
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [totalMasteredWords, setTotalMasteredWords] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const completedCount = completedNodes.length;
  const totalCount = nodes.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Find the roadmap details using the roadmapId from currentRoadmap
  const roadmapDetails = currentRoadmap?.roadmapId ? 
    roadmaps.find(r => r.id === currentRoadmap.roadmapId) : null;

  // Get streak data and total mastered words for the current language
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !currentRoadmap?.language) return;

      setIsLoading(true);
      try {
        // Fetch streak data
        const { data: streakData, error: streakError } = await supabase
          .from('user_language_streaks')
          .select('current_streak, longest_streak, last_activity_date')
          .eq('user_id', user.id)
          .eq('language', currentRoadmap.language)
          .single();

        if (streakError && streakError.code !== 'PGRST116') { // Not "No rows returned" error
          console.error('Error fetching streak data:', streakError);
        }

        if (streakData) {
          // Transform from database column names to our interface properties
          const formattedData: StreakData = {
            currentStreak: streakData.current_streak,
            longestStreak: streakData.longest_streak,
            lastActivityDate: streakData.last_activity_date
          };
          setStreakData(formattedData);
        }
        
        // Fetch total mastered words count for this language
        const { data: activityData, error: activityError } = await supabase
          .from('user_daily_activities')
          .select('activity_date, words_mastered')
          .eq('user_id', user.id)
          .eq('language', currentRoadmap.language)
          .order('activity_date', { ascending: false });
          
        if (activityError) {
          console.error('Error fetching activity data:', activityError);
        }
        
        if (activityData && activityData.length > 0) {
          // Get the latest activity entry which should have the cumulative words mastered
          const latestEntry = activityData[0];
          setTotalMasteredWords(latestEntry.words_mastered || 0);
        }
        
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, currentRoadmap]);

  // Mock data for the dashboard
  const streak = streakData?.currentStreak || 0;
  const longestStreak = streakData?.longestStreak || 0;
  const lastPracticed = streakData?.lastActivityDate ? new Date(streakData.lastActivityDate) : new Date();
  const totalTime = 720; // Mock total time in minutes

  // Format minutes into hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <TabsContent value="summary" className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <div className="bg-primary/10 p-1.5 rounded-md mr-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    Lesson Completion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} />
                    
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Lessons completed</span>
                      <span className="font-medium">{completedCount} / {totalCount}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Words mastered</span>
                      <span className="font-medium">{totalMasteredWords}</span>
                    </div>
                    
                    {roadmapDetails && (
                      <div className="flex justify-between items-center text-sm border-t pt-3 mt-3">
                        <span className="text-muted-foreground">Current level</span>
                        <LevelBadge level={roadmapDetails.level} />
                      </div>
                    )}
                  </div>
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
                  <CardTitle className="text-lg flex items-center">
                    <div className="bg-amber-100 dark:bg-amber-900/20 p-1.5 rounded-md mr-2">
                      <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    Learning Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Current streak</span>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-bold">{streak}</span>
                          <span className="text-xs text-muted-foreground mb-1">days</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center bg-amber-100 dark:bg-amber-900/20 h-10 w-10 rounded-full">
                        <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Longest streak</span>
                        <span className="font-medium">{longestStreak} days</span>
                      </div>
                    
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last practiced</span>
                        <span className="font-medium">{lastPracticed ? format(lastPracticed, 'MMM d, yyyy') : 'Never'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total learning time</span>
                        <span className="font-medium">{formatTime(totalTime)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
        
        <TabsContent value="progress" className="mt-2">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Detailed progress analytics coming soon.<br/>
                Track your accuracy trends and learning patterns over time.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-2">
          <Card>
            <CardHeader>
              <CardTitle>Practice History</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Practice history and calendar view coming soon.<br/>
                Track your daily learning consistency and achievements.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoadmapProgressDashboard;
