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
  AlertCircle,
  Languages,
  RefreshCw
} from 'lucide-react';
import { SentenceMiningProgress } from '@/types/sentence-mining';
import { SmartContentGenerator, VocabularyProfile } from '@/services/smartContentGenerator';
import { PersonalizedLearningPath, LearningRecommendation, LearningTrajectory } from '@/services/personalizedLearningPath';
import { FlagIcon } from 'react-flag-kit';
import { getLanguageFlagCode, capitalizeLanguage } from '@/utils/languageUtils';
import { executeRecommendationAction, RecommendationActionHandlerProps } from './RecommendationActionHandler';

interface PersonalizedInsightsProps {
  userId: string;
  language: string;
  progress: SentenceMiningProgress;
  onRecommendationAction?: RecommendationActionHandlerProps['onStartAdaptiveSession'];
}

export const PersonalizedInsights: React.FC<PersonalizedInsightsProps> = ({
  userId,
  language,
  progress,
  onRecommendationAction
}) => {
  const [vocabularyProfile, setVocabularyProfile] = useState<VocabularyProfile | null>(null);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [trajectory, setTrajectory] = useState<LearningTrajectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState(language);

  // Reset data when language changes
  useEffect(() => {
    if (currentLanguage !== language) {
      setCurrentLanguage(language);
      setVocabularyProfile(null);
      setRecommendations([]);
      setTrajectory(null);
      setError(null);
      setLoading(true);
    }
  }, [language, currentLanguage]);

  useEffect(() => {
    loadPersonalizedData();
  }, [userId, language]);

  const loadPersonalizedData = async () => {
    if (!userId || !language) {
      setError('Missing user ID or language');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Loading personalized data for user ${userId} in ${language}`);
      
      // Generate vocabulary profile for the specific language
      const profile = await SmartContentGenerator.generateVocabularyProfile(userId, language);
      setVocabularyProfile(profile);

      // Generate language-specific recommendations
      const recs = PersonalizedLearningPath.generateRecommendations(
        profile,
        progress.averageAccuracy,
        'intermediate', // Would get from current session
        progress.streak
      );
      setRecommendations(recs);

      // Predict learning trajectory for this language
      const traj = PersonalizedLearningPath.predictLearningTrajectory(
        profile,
        progress.averageAccuracy,
        progress.streak
      );
      setTrajectory(traj);
      
      console.log(`Successfully loaded data for ${language}:`, {
        profileWords: profile.knownWords.length,
        recommendations: recs.length,
        trajectory: traj ? 'loaded' : 'not available'
      });
    } catch (error) {
      console.error(`Error loading personalized insights for ${language}:`, error);
      setError(`Failed to load insights for ${capitalizeLanguage(language)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationAction = async (recommendation: LearningRecommendation) => {
    if (!onRecommendationAction) {
      console.warn('[PersonalizedInsights] No action handler provided');
      return;
    }
    
    await executeRecommendationAction(recommendation, onRecommendationAction);
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

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Error Loading Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadPersonalizedData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-blue-500" />
            <span>Loading {capitalizeLanguage(language)} Insights...</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Analyzing your {capitalizeLanguage(language)} progress...
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Language Context Header */}
      <div className="flex items-center gap-2 text-sm font-medium">
        <FlagIcon code={getLanguageFlagCode(language)} size={20} />
        <span>{capitalizeLanguage(language)} Learning Insights</span>
      </div>

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

      {/* Language-specific Vocabulary Profile */}
      {vocabularyProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-green-500" />
              {capitalizeLanguage(language)} Vocabulary Profile
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

      {/* Language-specific Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Recommendations for {capitalizeLanguage(language)}
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
                        <Badge variant="outline" className="ml-2 text-xs">
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
                      
                      {rec.actionable && onRecommendationAction && (
                        <Button 
                          variant="outline" 
                          className="text-xs h-7 mt-2"
                          onClick={() => handleRecommendationAction(rec)}
                        >
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
