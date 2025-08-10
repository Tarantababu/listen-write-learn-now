import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Play, ArrowRight } from 'lucide-react';
import { FlagIcon } from 'react-flag-kit';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { getLanguageFlagCode, capitalizeLanguage } from '@/utils/languageUtils';
import { useReliableSentenceMining } from '@/hooks/use-reliable-sentence-mining';
import { DifficultyLevel } from '@/types/sentence-mining';
export const SentenceMiningQuickStart: React.FC = () => {
  const navigate = useNavigate();
  const {
    settings
  } = useUserSettingsContext();
  const {
    startSession,
    loading
  } = useReliableSentenceMining();
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('intermediate');
  const handleQuickStart = async () => {
    try {
      await startSession(selectedDifficulty);
      navigate('/dashboard/sentence-mining');
    } catch (error) {
      console.error('Failed to start quick session:', error);
    }
  };
  const handleViewAll = () => {
    navigate('/dashboard/sentence-mining');
  };
  return;
};