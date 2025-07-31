
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  BookOpen, 
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { SentenceMiningProgress } from '@/types/sentence-mining';
import { SmartContentGenerator, VocabularyProfile } from '@/services/smartContentGenerator';
import { PersonalizedLearningPath, LearningRecommendation, LearningTrajectory } from '@/services/personalizedLearningPath';

interface PersonalizedInsightsProps {
  userId: string;
  language: string;
  progress: SentenceMiningProgress;
}

export const PersonalizedInsights: React.FC<PersonalizedInsightsProps> = ({
  userId,
  language,
  progress
}) => {
  const [vocabularyProfile, setVocabularyProfile] = useState<VocabularyProfile | null>(null);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [trajectory, setTrajectory] = useState<LearningTrajectory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersonalizedData();
  }, [userId, language]);

  const loadPersonalizedData = async () => {
    if (!userId || !language) return;
    
    setLoading(true);
    try {
      // Generate vocabulary profile
      const profile = await SmartContentGenerator.generateVocabularyProfile(userId, language);
      setVocabularyProfile(profile);

      // Generate recommendations
      const recs = PersonalizedLearningPath.generateRecommendations(
        profile,
        progress.averageAccuracy,
        'intermediate', // Would get from current session
        progress.streak
      );
      setRecommendations(recs);

      // Predict learning trajectory
      const traj = PersonalizedLearningPath.predictLearningTrajectory(
        profile,
        progress.averageAccuracy,
        progress.streak
      );
      setTrajectory(traj);
    } catch (error) {
      console.error('Error loading personalized insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'difficulty_adjustment': return <TrendingUp className="h-4 w-4" />;
      case 'focus_area': return <Target className="h-4 w-4" />;
      case 'review_words': return <BookOpen className="h-4 w-4" />;
      case 'new_content': return <CheckCircle className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getRecommendationColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading personalized insights...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Learning Trajectory */}
      {trajectory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-purple-500" />
              Learning Trajectory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Mastery</span>
                <Badge variant="outline">{trajectory.currentMastery}%</Badge>
              </div>
              <Progress value={trajectory.currentMastery} className="w-full" />
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">+{trajectory.projectedGrowth}</div>
                  <div className="text-xs text-muted-foreground">Words this week</div>
                </div>
                <div className="text-center flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-lg font-bold">{trajectory.estimatedTimeToNextLevel}</div>
                    <div className="text-xs text-muted-foreground">days to next level</div>
                  </div>
                </div>
              </div>

              {trajectory.focusAreas.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-sm font-medium mb-2">Focus Areas</div>
                  <div className="flex flex-wrap gap-1">
                    {trajectory.focusAreas.map((area, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {area.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vocabulary Profile */}
      {vocabularyProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-green-500" />
              Vocabulary Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {vocabularyProfile.masteredWords.length}
                </div>
                <div className="text-xs text-muted-foreground">Mastered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {vocabularyProfile.strugglingWords.length}
                </div>
                <div className="text-xs text-muted-foreground">Struggling</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {vocabularyProfile.knownWords.length}
                </div>
                <div className="text-xs text-muted-foreground">Total Known</div>
              </div>
            </div>

            {vocabularyProfile.strugglingWords.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-2">Words needing practice:</div>
                <div className="flex flex-wrap gap-1">
                  {vocabularyProfile.strugglingWords.slice(0, 5).map((word, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                  {vocabularyProfile.strugglingWords.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{vocabularyProfile.strugglingWords.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Recommendations
          </h3>
          {recommendations.map((rec, index) => (
            <Alert key={index} className={`border-l-4 ${getRecommendationColor(rec.priority)}`}>
              <div className="flex items-start gap-2">
                {getRecommendationIcon(rec.type)}
                <div className="flex-1">
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>
                        <strong className="text-sm">{rec.title}</strong>
                        <Badge variant="outline" className="ml-2 text-xs" size="sm">
                          {rec.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rec.description}
                      </div>
                      
                      {rec.data?.words && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {rec.data.words.map((word: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {word}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {rec.actionable && (
                        <Button size="sm" variant="outline" className="text-xs h-7 mt-2">
                          Take Action
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};
