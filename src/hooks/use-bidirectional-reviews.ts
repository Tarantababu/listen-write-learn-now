
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { BidirectionalService } from '@/services/bidirectionalService';

export const useBidirectionalReviews = () => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [dueReviewsCount, setDueReviewsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDueReviews = async () => {
      if (!user || !settings.selectedLanguage) return;
      
      try {
        setLoading(true);
        const dueExercises = await BidirectionalService.getExercisesDueForReview(
          user.id, 
          settings.selectedLanguage
        );
        setDueReviewsCount(dueExercises.length);
      } catch (error) {
        console.error('Error fetching due reviews:', error);
        setDueReviewsCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDueReviews();
  }, [user, settings.selectedLanguage]);

  return { dueReviewsCount, loading };
};
