
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Play, ArrowRight } from 'lucide-react';
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
    <Card className="border-primary/20 hover:border-primary/40 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left section - Icon and title */}
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium text-sm">Sentence Mining</h3>
              <div className="flex items-center gap-2 mt-1">
                <FlagIcon code={getLanguageFlagCode(settings.selectedLanguage)} size={16} />
                <Badge variant="outline" className="text-xs h-5">
                  {capitalizeLanguage(settings.selectedLanguage)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Center section - Difficulty selector */}
          <div className="flex gap-1">
            {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map((level) => (
              <Button
                key={level}
                variant={selectedDifficulty === level ? "default" : "outline"}
                size="sm"
                className="text-xs h-6 px-2 capitalize"
                onClick={() => setSelectedDifficulty(level)}
              >
                {level.charAt(0).toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Right section - Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleQuickStart}
              disabled={loading}
              size="sm"
              className="h-7 px-3"
            >
              <Play className="h-3 w-3 mr-1" />
              {loading ? 'Starting...' : 'Start'}
            </Button>
            <Button
              onClick={handleViewAll}
              variant="outline"
              size="sm"
              className="h-7 px-2"
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
