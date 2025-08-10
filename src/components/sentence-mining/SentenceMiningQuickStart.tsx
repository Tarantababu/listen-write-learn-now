
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
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 hover:border-primary/40 transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Brain className="h-6 w-6 text-primary" />
                <Zap className="h-3 w-3 text-accent absolute -top-1 -right-1" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Smart Sentence Mining</h3>
                <p className="text-xs text-muted-foreground">AI-powered contextual learning</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FlagIcon code={getLanguageFlagCode(settings.selectedLanguage)} size={20} />
              <Badge variant="outline" className="text-xs">
                {capitalizeLanguage(settings.selectedLanguage)}
              </Badge>
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Difficulty Level:</p>
            <div className="flex gap-2">
              {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map((level) => (
                <Button
                  key={level}
                  variant={selectedDifficulty === level ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7 px-3 capitalize"
                  onClick={() => setSelectedDifficulty(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleQuickStart}
              disabled={loading}
              size="sm"
              className="flex-1 h-9"
            >
              <Play className="h-3 w-3 mr-2" />
              {loading ? 'Starting...' : 'Quick Practice'}
            </Button>
            <Button
              onClick={handleViewAll}
              variant="outline"
              size="sm"
              className="h-9 px-3"
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
