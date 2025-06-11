
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, BookOpen, MessageSquare, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserLimitInfo {
  user_id: string;
  email: string;
  exercise_count: number;
  vocabulary_count: number;
  bidirectional_count: number;
}

export function FreeSubscriptionLimitsStats() {
  const { data: limitsData, isLoading, error } = useQuery({
    queryKey: ['free-subscription-limits'],
    queryFn: async (): Promise<UserLimitInfo[]> => {
      const { data, error } = await supabase.rpc('get_free_subscription_limits');
      
      if (error) throw error;
      
      return data || [];
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

  // Filter users based on their specific limits
  const exerciseLimitUsers = limitsData?.filter(user => user.exercise_count >= 3) || [];
  const vocabularyLimitUsers = limitsData?.filter(user => user.vocabulary_count >= 5) || [];
  const bidirectionalLimitUsers = limitsData?.filter(user => user.bidirectional_count >= 3) || [];

  const renderUserList = (users: UserLimitInfo[], title: string, icon: React.ReactNode, countKey: keyof UserLimitInfo) => (
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
              <div className="flex flex-col">
                <span className="font-medium">{user.email}</span>
                <span className="font-mono text-xs text-muted-foreground">{user.user_id}</span>
              </div>
              <Badge variant="outline">{user[countKey]} items</Badge>
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
          Users who have reached their free subscription allowances (showing email addresses)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderUserList(
          exerciseLimitUsers,
          "Exercise Limit (3+ exercises)",
          <BookOpen className="h-4 w-4 text-blue-600" />,
          'exercise_count'
        )}
        
        {renderUserList(
          vocabularyLimitUsers,
          "Vocabulary Limit (5+ vocabulary items)",
          <MessageSquare className="h-4 w-4 text-green-600" />,
          'vocabulary_count'
        )}
        
        {renderUserList(
          bidirectionalLimitUsers,
          "Bidirectional Exercise Limit (3+ exercises)",
          <Target className="h-4 w-4 text-purple-600" />,
          'bidirectional_count'
        )}

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {exerciseLimitUsers.length}
              </div>
              <div className="text-xs text-blue-600">Exercise Limit</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {vocabularyLimitUsers.length}
              </div>
              <div className="text-xs text-green-600">Vocabulary Limit</div>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {bidirectionalLimitUsers.length}
              </div>
              <div className="text-xs text-purple-600">Bidirectional Limit</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
