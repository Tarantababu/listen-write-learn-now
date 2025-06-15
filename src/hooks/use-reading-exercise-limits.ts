
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';

interface ReadingExerciseLimit {
  canCreate: boolean;
  currentCount: number;
  limit: number;
  isLoading: boolean;
}

export const useReadingExerciseLimits = (language: string): ReadingExerciseLimit => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [currentCount, setCurrentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const limit = subscription.isSubscribed ? Infinity : 3;

  useEffect(() => {
    const fetchExerciseCount = async () => {
      if (!user || !language) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase.rpc('get_user_reading_exercise_count', {
          user_id_param: user.id,
          language_param: language
        });

        if (error) {
          console.error('Error fetching reading exercise count:', error);
          setCurrentCount(0);
        } else {
          setCurrentCount(data || 0);
        }
      } catch (error) {
        console.error('Error in fetchExerciseCount:', error);
        setCurrentCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExerciseCount();
  }, [user, language, subscription.isSubscribed]);

  const canCreate = subscription.isSubscribed || currentCount < limit;

  return {
    canCreate,
    currentCount,
    limit,
    isLoading
  };
};
