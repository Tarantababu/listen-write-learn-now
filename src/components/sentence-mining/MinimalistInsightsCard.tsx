
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, TrendingUp } from 'lucide-react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { capitalizeLanguage } from '@/utils/languageUtils';

interface MinimalistInsightsCardProps {
  vocabularyProfile?: any;
  exerciseCount: number;
}

export const MinimalistInsightsCard: React.FC<MinimalistInsightsCardProps> = ({
  vocabularyProfile,
  exerciseCount
}) => {
  const { settings } = useUserSettingsContext();

  if (!vocabularyProfile) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">{capitalizeLanguage(settings.selectedLanguage)} Insights</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Session exercises</span>
            <Badge variant="outline">{exerciseCount}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Learning words</span>
            <Badge variant="outline" className="text-amber-600">
              {vocabularyProfile.strugglingWords?.length || 0}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Mastered words</span>
            <Badge variant="outline" className="text-green-600">
              {vocabularyProfile.masteredWords?.length || 0}
            </Badge>
          </div>
        </div>
        
        <div className="pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>AI adapts difficulty in real-time</span>
        </div>
      </CardContent>
    </Card>
  );
};
