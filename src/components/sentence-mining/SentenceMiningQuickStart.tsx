

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
  const { settings } = useUserSettingsContext();
  const { startSession, loading } = useReliableSentenceMining();
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

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Sentence Mining</h3>
              <div className="flex items-center gap-2 mt-1">
                <FlagIcon
                  code={getLanguageFlagCode(settings.selectedLanguage)}
                  size={16}
                />
                <span className="text-sm text-muted-foreground">
                  {capitalizeLanguage(settings.selectedLanguage)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="capitalize">
              {selectedDifficulty}
            </Badge>
            <Button onClick={handleQuickStart} disabled={loading} size="sm">
              {loading ? (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </>
              )}
            </Button>
            <Button onClick={handleViewAll} variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

