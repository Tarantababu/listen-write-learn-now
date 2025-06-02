
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Trophy, RotateCcw, Target, Volume2 } from 'lucide-react';
import type { GenderTest, DrillAttempt } from '@/types/preaching';
import type { Language } from '@/types';

interface FeedbackStepProps {
  genderTests: GenderTest[];
  drillAttempts: DrillAttempt[];
  language: Language;
  onComplete: () => void;
  onRestart: () => void;
}

const FeedbackStep: React.FC<FeedbackStepProps> = ({ 
  genderTests, 
  drillAttempts, 
  language,
  onComplete, 
  onRestart 
}) => {
  const genderCorrect = genderTests.filter(test => test.isCorrect === true).length;
  const genderTotal = genderTests.filter(test => test.isCorrect !== undefined).length;
  const genderAccuracy = genderTotal > 0 ? Math.round((genderCorrect / genderTotal) * 100) : 0;

  const drillCorrect = drillAttempts.filter(attempt => attempt.isCorrect).length;
  const drillTotal = drillAttempts.length;
  const drillAccuracy = drillTotal > 0 ? Math.round((drillCorrect / drillTotal) * 100) : 0;

  const overallAccuracy = Math.round(((genderCorrect + drillCorrect) / (genderTotal + drillTotal)) * 100);

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: 'Excellent', color: 'text-green-600', icon: Trophy };
    if (accuracy >= 70) return { level: 'Good', color: 'text-blue-600', icon: CheckCircle };
    if (accuracy >= 50) return { level: 'Fair', color: 'text-yellow-600', icon: Target };
    return { level: 'Needs Practice', color: 'text-red-600', icon: XCircle };
  };

  const performance = getPerformanceLevel(overallAccuracy);
  const PerformanceIcon = performance.icon;

  const incorrectGenderTests = genderTests.filter(test => test.isCorrect === false);
  const incorrectDrillAttempts = drillAttempts.filter(attempt => !attempt.isCorrect);

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Set language based on the selected language
      switch (language) {
        case 'german':
          utterance.lang = 'de-DE';
          break;
        case 'spanish':
          utterance.lang = 'es-ES';
          break;
        case 'french':
          utterance.lang = 'fr-FR';
          break;
        case 'italian':
          utterance.lang = 'it-IT';
          break;
        default:
          utterance.lang = 'de-DE';
      }
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Session Complete!</h2>
        <div className="flex items-center justify-center space-x-2">
          <PerformanceIcon className={`h-8 w-8 ${performance.color}`} />
          <span className={`text-xl font-semibold ${performance.color}`}>
            {performance.level}
          </span>
        </div>
      </div>

      {/* Overall Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Overall Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold">{overallAccuracy}%</div>
            <p className="text-gray-600">Overall Accuracy</p>
            <Progress value={overallAccuracy} className="w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center space-y-1">
              <div className="text-lg font-semibold">{genderAccuracy}%</div>
              <p className="text-sm text-gray-600">Gender Recognition</p>
              <p className="text-xs text-gray-500">{genderCorrect}/{genderTotal} correct</p>
            </div>
            <div className="text-center space-y-1">
              <div className="text-lg font-semibold">{drillAccuracy}%</div>
              <p className="text-sm text-gray-600">Speaking Practice</p>
              <p className="text-xs text-gray-500">{drillCorrect}/{drillTotal} correct</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Areas for Improvement */}
      {(incorrectGenderTests.length > 0 || incorrectDrillAttempts.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Review These Items</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {incorrectGenderTests.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Gender Recognition Mistakes:</h4>
                <div className="space-y-2">
                  {incorrectGenderTests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-red-100 text-red-800">
                          {test.noun.article}
                        </Badge>
                        <span className="font-medium">{test.noun.word}</span>
                        <span className="text-gray-600">({test.noun.meaning})</span>
                        {test.userAnswer && (
                          <span className="text-red-600 text-sm">
                            You said: {test.userAnswer}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speakWord(`${test.noun.article} ${test.noun.word}`)}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incorrectDrillAttempts.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Speaking Practice Mistakes:</h4>
                <div className="space-y-3">
                  {incorrectDrillAttempts.map((attempt, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Pattern: {attempt.pattern}</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Expected:</span> {attempt.expectedAnswer}</p>
                        <p><span className="font-medium">You said:</span> {attempt.userSpeech}</p>
                        {attempt.feedback && (
                          <p className="text-red-700 bg-red-100 p-2 rounded">
                            <span className="font-medium">Feedback:</span> {attempt.feedback}
                          </p>
                        )}
                        {attempt.corrections && attempt.corrections.length > 0 && (
                          <div className="bg-blue-100 p-2 rounded">
                            <p className="font-medium text-blue-900">Tips:</p>
                            <ul className="list-disc list-inside text-blue-800 text-xs">
                              {attempt.corrections.map((correction, idx) => (
                                <li key={idx}>{correction}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button onClick={onRestart} variant="outline" size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Practice Again
        </Button>
        <Button onClick={onComplete} size="lg">
          Finish Session
        </Button>
      </div>
    </div>
  );
};

export default FeedbackStep;
