
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay } from 'date-fns';
import StatsCard from '@/components/StatsCard';
import { Users } from 'lucide-react';

export default function TodayVisitorsCard() {
  const { data: todayVisitors, isLoading, error } = useQuery({
    queryKey: ['today-landing-visitors'],
    queryFn: async () => {
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();
      
      const { count, error } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .eq('page', 'landing_page')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);
      
      if (error) {
        console.error('Error fetching today visitors:', error);
        throw error;
      }
      
      return count || 0;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (error) {
    return (
      <StatsCard
        title="Today's Landing Page Visitors"
        value={0}
        description="Error loading visitor data"
        icon={<Users className="h-4 w-4" />}
        className="border-red-200 bg-red-50"
      />
    );
  }

  return (
    <StatsCard
      title="Today's Landing Page Visitors"
      value={todayVisitors || 0}
      description={`Visitors to landing page on ${format(new Date(), 'MMMM d, yyyy')}`}
      icon={<Users className="h-4 w-4" />}
      isLoading={isLoading}
    />
  );
}
