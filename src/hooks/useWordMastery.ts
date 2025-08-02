
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { WordMasteryService, WordMasteryStats, WordMasteryBreakdown } from '@/services/wordMasteryService';
import { Language } from '@/types';

interface UseWordMasteryResult {
  stats: WordMasteryStats | null;
  breakdown: WordMasteryBreakdown[];
  recentAchievements: Array<{ word: string; masteredAt: Date; source: string }>;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export const useWordMastery = (language?: Language): UseWordMasteryResult => {
  const { user } = useAuth();
  const { settings } = useUserSettingsContext();
  const [stats, setStats] = useState<WordMasteryStats | null>(null);
  const [breakdown, setBreakdown] = useState<WordMasteryBreakdown[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Array<{ word: string; masteredAt: Date; source: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetLanguage = language || settings.selectedLanguage;

  const loadStats = async () => {
    if (!user) {
      setStats(null);
      setBreakdown([]);
      setRecentAchievements([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`[useWordMastery] Loading stats for user ${user.id}, language: ${targetLanguage}`);

      const [masteryStats, masteryBreakdown, achievements] = await Promise.all([
        WordMasteryService.getMasteryStats(user.id, targetLanguage),
        WordMasteryService.getMasteryBreakdown(user.id, targetLanguage),
        WordMasteryService.getRecentMasteryAchievements(user.id, targetLanguage, 5)
      ]);

      console.log(`[useWordMastery] Loaded stats:`, masteryStats);

      setStats(masteryStats);
      setBreakdown(masteryBreakdown);
      setRecentAchievements(achievements);
    } catch (err) {
      console.error('Error loading word mastery stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load word mastery stats');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = async () => {
    await loadStats();
  };

  useEffect(() => {
    loadStats();
  }, [user, targetLanguage]);

  return {
    stats,
    breakdown,
    recentAchievements,
    isLoading,
    error,
    refreshStats
  };
};
