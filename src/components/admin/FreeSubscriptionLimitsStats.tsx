
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, BookOpen, MessageSquare, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserLimitInfo {
  email: string;
  user_id: string;
  count: number;
}

interface FreeSubscriptionLimitsData {
  exerciseLimitUsers: UserLimitInfo[];
  vocabularyLimitUsers: UserLimitInfo[];
  bidirectionalLimitUsers: UserLimitInfo[];
}

export function FreeSubscriptionLimitsStats() {
  const { data: limitsData, isLoading, error } = useQuery({
    queryKey: ['free-subscription-limits'],
    queryFn: async (): Promise<FreeSubscriptionLimitsData> => {
      // Get users who have reached exercise limit (3 exercises)
      const { data: exerciseUsers, error: exerciseError } = await supabase
        .from('exercises')
        .select(`
          user_id,
          profiles!inner(id)
        `)
        .eq('archived', false);

      if (exerciseError) throw exerciseError;

      // Count exercises per user and filter those with 3+ exercises
      const exerciseCounts = exerciseUsers?.reduce((acc: Record<string, number>, exercise) => {
        acc[exercise.user_id] = (acc[exercise.user_id] || 0) + 1;
        return acc;
      }, {}) || {};

      const exerciseLimitUserIds = Object.entries(exerciseCounts)
        .filter(([userId, count]) => count >= 3)
        .map(([userId]) => userId);

      // Get user emails for exercise limit users
      const { data: exerciseUserDetails, error: exerciseUserError } = await supabase
        .from('profiles')
        .select(`
          id,
          auth.users(email)
        `)
        .in('id', exerciseLimitUserIds);

      if (exerciseUserError) throw exerciseUserError;

      // Get users who have reached vocabulary limit (5 vocabulary items)
      const { data: vocabularyUsers, error: vocabularyError } = await supabase
        .from('vocabulary')
        .select(`
          user_id,
          profiles!inner(id)
        `);

      if (vocabularyError) throw vocabularyError;

      const vocabularyCounts = vocabularyUsers?.reduce((acc: Record<string, number>, vocab) => {
        acc[vocab.user_id] = (acc[vocab.user_id] || 0) + 1;
        return acc;
      }, {}) || {};

      const vocabularyLimitUserIds = Object.entries(vocabularyCounts)
        .filter(([userId, count]) => count >= 5)
        .map(([userId]) => userId);

      const { data: vocabularyUserDetails, error: vocabularyUserError } = await supabase
        .from('profiles')
        .select(`
          id,
          auth.users(email)
        `)
        .in('id', vocabularyLimitUserIds);

      if (vocabularyUserError) throw vocabularyUserError;

      // Get users who have reached bidirectional exercise limit (3 bidirectional exercises)
      const { data: bidirectionalUsers, error: bidirectionalError } = await supabase
        .from('bidirectional_exercises')
        .select(`
          user_id,
          profiles!inner(id)
        `);

      if (bidirectionalError) throw bidirectionalError;

      const bidirectionalCounts = bidirectionalUsers?.reduce((acc: Record<string, number>, exercise) => {
        acc[exercise.user_id] = (acc[exercise.user_id] || 0) + 1;
        return acc;
      }, {}) || {};

      const bidirectionalLimitUserIds = Object.entries(bidirectionalCounts)
        .filter(([userId, count]) => count >= 3)
        .map(([userId]) => userId);

      const { data: bidirectionalUserDetails, error: bidirectionalUserError } = await supabase
        .from('profiles')
        .select(`
          id,
          auth.users(email)
        `)
        .in('id', bidirectionalLimitUserIds);

      if (bidirectionalUserError) throw bidirectionalUserError;

      return {
        exerciseLimitUsers: exerciseUserDetails?.map(user => ({
          email: user.auth?.users?.email || 'No email',
          user_id: user.id,
          count: exerciseCounts[user.id] || 0
        })) || [],
        vocabularyLimitUsers: vocabularyUserDetails?.map(user => ({
          email: user.auth?.users?.email || 'No email',
          user_id: user.id,
          count: vocabularyCounts[user.id] || 0
        })) || [],
        bidirectionalLimitUsers: bidirectionalUserDetails?.map(user => ({
          email: user.auth?.users?.email || 'No email',
          user_id: user.id,
          count: bidirectionalCounts[user.id] || 0
        })) || []
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Free Subscription Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading limit statistics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Free Subscription Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error loading limit statistics: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const renderUserList = (users: UserLimitInfo[], title: string, icon: React.ReactNode) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-medium">{title}</h4>
        <Badge variant="secondary">{users.length} users</Badge>
      </div>
      {users.length > 0 ? (
        <div className="space-y-2 pl-6">
          {users.map((user, index) => (
            <div key={user.user_id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <span>{user.email}</span>
              <Badge variant="outline">{user.count} items</Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm pl-6">No users have reached this limit yet</p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Free Subscription Limits Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Users who have reached their free subscription allowances
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderUserList(
          limitsData?.exerciseLimitUsers || [],
          "Exercise Limit (3+ exercises)",
          <BookOpen className="h-4 w-4 text-blue-600" />
        )}
        
        {renderUserList(
          limitsData?.vocabularyLimitUsers || [],
          "Vocabulary Limit (5+ vocabulary items)",
          <MessageSquare className="h-4 w-4 text-green-600" />
        )}
        
        {renderUserList(
          limitsData?.bidirectionalLimitUsers || [],
          "Bidirectional Exercise Limit (3+ exercises)",
          <Target className="h-4 w-4 text-purple-600" />
        )}

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {limitsData?.exerciseLimitUsers.length || 0}
              </div>
              <div className="text-xs text-blue-600">Exercise Limit</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {limitsData?.vocabularyLimitUsers.length || 0}
              </div>
              <div className="text-xs text-green-600">Vocabulary Limit</div>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {limitsData?.bidirectionalLimitUsers.length || 0}
              </div>
              <div className="text-xs text-purple-600">Bidirectional Limit</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
