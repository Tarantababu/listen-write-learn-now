
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { BidirectionalService } from '@/services/bidirectionalService';

export const useBidirectionalReviews = () => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [dueReviewsCount, setDueReviewsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Cache results for 30 seconds to avoid excessive API calls
  const CACHE_DURATION = 30000;

  const fetchDueReviews = useCallback(async () => {
    if (!user || !settings.selectedLanguage) return;
    
    const now = Date.now();
    if (now - lastFetchTime < CACHE_DURATION) return;
    
    try {
      setLoading(true);
      const dueExercises = await BidirectionalService.getExercisesDueForReview(
        user.id, 
        settings.selectedLanguage
      );
      setDueReviewsCount(dueExercises.length);
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error fetching due reviews:', error);
      setDueReviewsCount(0);
    } finally {
      setLoading(false);
    }
  }, [user, settings.selectedLanguage, lastFetchTime]);

  useEffect(() => {
    fetchDueReviews();
  }, [fetchDueReviews]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    dueReviewsCount,
    loading,
    refreshDueReviews: fetchDueReviews
  }), [dueReviewsCount, loading, fetchDueReviews]);
};
