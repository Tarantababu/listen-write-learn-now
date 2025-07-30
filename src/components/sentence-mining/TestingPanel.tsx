
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, TestTube, AlertTriangle } from 'lucide-react';
import { testAnswerEvaluation, getTestCases } from '@/utils/exerciseValidation';

interface TestingPanelProps {
  onClose: () => void;
}

export const TestingPanel: React.FC<TestingPanelProps> = ({ onClose }) => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);

    try {
      const testCases = getTestCases('cloze');
      const results = testAnswerEvaluation('cloze', testCases);
      setTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Exercise Testing Panel
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Run Tests</h3>
          <Button
            variant="outline"
            onClick={runTests}
            disabled={isRunning}
          >
            Test Cloze Exercises
          </Button>
        </div>

        <Separator />

        {/* Test Results */}
        {testResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Cloze Test Results
              </h3>
              <Badge variant={testResults.summary.percentage >= 80 ? "default" : "destructive"}>
                {testResults.summary.passed}/{testResults.summary.total} passed 
                ({testResults.summary.percentage}%)
              </Badge>
            </div>

            <div className="grid gap-4">
              {testResults.results.map((result: any, index: number) => (
                <Card key={index} className={`border-l-4 ${
                  result.passed ? 'border-l-green-500' : 'border-l-red-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {result.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">{result.description}</span>
                      </div>
                      <Badge variant="outline">
                        {result.accuracy}% accuracy
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Input: </span>
                        <span className="text-muted-foreground">
                          {result.userAnswer || 'Empty'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Expected: </span>
                        <span className="text-muted-foreground">
                          {result.correctAnswer}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Result: </span>
                        <span className={result.actualResult ? 'text-green-600' : 'text-red-600'}>
                          {result.actualResult ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      {result.feedback && (
                        <div>
                          <span className="font-medium">Feedback: </span>
                          <span className="text-muted-foreground">{result.feedback}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Information Panel */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Testing Information
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This panel tests the answer evaluation logic for cloze exercises. 
                All tests should pass to ensure consistent and accurate exercise grading.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
