import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, BookOpen, MessageSquare, Target, Crown, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserLimitInfo {
  user_id: string;
  email: string;
  exercise_count: number;
  vocabulary_count: number;
  bidirectional_count: number;
  is_premium: boolean;
}

export function FreeSubscriptionLimitsStats() {
  const [currentPages, setCurrentPages] = useState({
    exercise: 1,
    vocabulary: 1,
    bidirectional: 1
  });
  const [expandedSections, setExpandedSections] = useState({
    exercise: true,
    vocabulary: true,
    bidirectional: true
  });
  
  const ITEMS_PER_PAGE = 20;

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
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Free Subscription Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg">Loading limit statistics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Free Subscription Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center">
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Error Loading Data</h3>
              <p>{error.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter and sort users based on their specific limits (ascending order by count)
  const exerciseLimitUsers = limitsData?.filter(user => user.exercise_count >= 10)
    .sort((a, b) => a.exercise_count - b.exercise_count) || [];
  const vocabularyLimitUsers = limitsData?.filter(user => user.vocabulary_count >= 5)
    .sort((a, b) => a.vocabulary_count - b.vocabulary_count) || [];
  const bidirectionalLimitUsers = limitsData?.filter(user => user.bidirectional_count >= 3)
    .sort((a, b) => a.bidirectional_count - b.bidirectional_count) || [];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPaginatedUsers = (users: UserLimitInfo[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return users.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / ITEMS_PER_PAGE);
  };

  const handlePageChange = (section: keyof typeof currentPages, newPage: number) => {
    setCurrentPages(prev => ({
      ...prev,
      [section]: newPage
    }));
  };

  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void; 
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const renderUserList = (
    users: UserLimitInfo[], 
    title: string, 
    icon: React.ReactNode, 
    countKey: keyof UserLimitInfo,
    sectionKey: keyof typeof expandedSections,
    color: string
  ) => {
    const isExpanded = expandedSections[sectionKey];
    const currentPage = currentPages[sectionKey];
    const totalPages = getTotalPages(users.length);
    const paginatedUsers = getPaginatedUsers(users, currentPage);

    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center gap-3">
            {icon}
            <h4 className="font-semibold text-lg">{title}</h4>
            <Badge variant="secondary" className={`${color} text-white`}>
              {users.length} {users.length === 1 ? 'user' : 'users'}
            </Badge>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded">
            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4">
            {users.length > 0 ? (
              <>
                <div className="space-y-3">
                  {paginatedUsers.map((user, index) => (
                    <div key={user.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{user.email}</span>
                          {user.is_premium && (
                            <Badge variant="default" className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600">
                              <Crown className="h-3 w-3" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        <span className="font-mono text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                          ID: {user.user_id}
                        </span>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="font-semibold">
                          {user[countKey]} items
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => handlePageChange(sectionKey, page)}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Users className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-500">No users have reached this limit yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Users className="h-6 w-6" />
            Free Subscription Limits Analysis
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Monitor users who have reached their free subscription allowances
          </p>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Exercise Limit</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {exerciseLimitUsers.length}
              </div>
              <div className="text-sm text-blue-600 mt-1">users at 3+ exercises</div>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Vocabulary Limit</span>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {vocabularyLimitUsers.length}
              </div>
              <div className="text-sm text-green-600 mt-1">users at 5+ vocabulary</div>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-800">Bidirectional Limit</span>
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {bidirectionalLimitUsers.length}
              </div>
              <div className="text-sm text-purple-600 mt-1">users at 3+ bidirectional</div>
            </div>
          </div>

          {/* Detailed Lists */}
          <div className="space-y-6">
            {renderUserList(
              exerciseLimitUsers,
              "Exercise Limit Users",
              <BookOpen className="h-5 w-5 text-blue-600" />,
              'exercise_count',
              'exercise',
              'bg-blue-600'
            )}
            
            {renderUserList(
              vocabularyLimitUsers,
              "Vocabulary Limit Users",
              <MessageSquare className="h-5 w-5 text-green-600" />,
              'vocabulary_count',
              'vocabulary',
              'bg-green-600'
            )}
            
            {renderUserList(
              bidirectionalLimitUsers,
              "Bidirectional Exercise Limit Users",
              <Target className="h-5 w-5 text-purple-600" />,
              'bidirectional_count',
              'bidirectional',
              'bg-purple-600'
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}