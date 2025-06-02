
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { preachingService } from '@/services/preachingService';
import type { Noun, GenderTest } from '@/types/preaching';
import type { Language } from '@/types';

interface TestingStepProps {
  nouns: Noun[];
  language: Language;
  onComplete: (data: { tests: GenderTest[] }) => void;
}

const TestingStep: React.FC<TestingStepProps> = ({ nouns, language, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tests, setTests] = useState<GenderTest[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Get language-specific articles
  const getLanguageArticles = (lang: Language): string[] => {
    const articleMap: Record<Language, string[]> = {
      german: ['der', 'die', 'das'],
      french: ['le', 'la', 'les'],
      spanish: ['el', 'la', 'los', 'las'],
      italian: ['il', 'lo', 'la', 'gli', 'le'],
      portuguese: ['o', 'a', 'os', 'as'],
      dutch: ['de', 'het'],
      swedish: ['en', 'ett'],
      norwegian: ['en', 'ei', 'et'],
      english: ['the', 'a', 'an'],
      turkish: [], // No articles in Turkish
      russian: ['нет артиклей'], // No articles in Russian
      polish: ['nет артыклоў'], // No articles in Polish  
      chinese: ['没有冠词'], // No articles in Chinese
      japanese: ['助詞なし'], // No articles in Japanese
      korean: ['관사 없음'], // No articles in Korean
      hindi: ['कोई आर्टिकल नहीं'], // No articles in Hindi
      arabic: ['لا يوجد أدوات تعريف'] // No articles in Arabic
    };
    return articleMap[lang] || ['der', 'die', 'das'];
  };

  const languageArticles = getLanguageArticles(language);

  useEffect(() => {
    if (nouns && nouns.length > 0) {
      setTests(nouns.map(noun => ({ noun })));
    }
  }, [nouns]);

  // Safety check - return loading state if no nouns or invalid index
  if (!nouns || nouns.length === 0 || currentIndex >= nouns.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  const currentNoun = nouns[currentIndex];
  const currentTest = tests[currentIndex];

  // Additional safety check
  if (!currentNoun) {
    console.error('Current noun is undefined at index:', currentIndex, 'Total nouns:', nouns.length);
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600">Error loading vocabulary item. Please try refreshing.</p>
        </div>
      </div>
    );
  }

  const handleArticleSelect = (article: string) => {
    setSelectedArticle(article);
  };

  const handleSubmit = async () => {
    if (!selectedArticle) return;

    const isCorrect = selectedArticle === currentNoun.article;
    const updatedTest = {
      ...currentTest,
      userAnswer: selectedArticle as any,
      isCorrect
    };

    const updatedTests = [...tests];
    updatedTests[currentIndex] = updatedTest;
    setTests(updatedTests);
    setShowResult(true);

    if (!isCorrect) {
      setLoadingExplanation(true);
      try {
        const explanationText = await preachingService.getGenderExplanation(currentNoun, language);
        setExplanation(explanationText);
        updatedTests[currentIndex].explanation = explanationText;
        setTests(updatedTests);
      } catch (error) {
        console.error('Failed to get explanation:', error);
      } finally {
        setLoadingExplanation(false);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < nouns.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedArticle(null);
      setShowResult(false);
      setExplanation('');
    } else {
      // All tests completed
      onComplete({ tests });
    }
  };

  const getArticleColor = (article: string) => {
    // Color mapping for different languages
    const colorMap: Record<string, string> = {
      // German
      'der': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'die': 'bg-red-100 text-red-800 hover:bg-red-200',
      'das': 'bg-green-100 text-green-800 hover:bg-green-200',
      // French
      'le': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'la': 'bg-red-100 text-red-800 hover:bg-red-200',
      'les': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      // Spanish
      'el': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'los': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      'las': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      // Italian
      'il': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'lo': 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
      'gli': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      // Portuguese
      'o': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'a': 'bg-red-100 text-red-800 hover:bg-red-200',
      'os': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      'as': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      // Dutch
      'de': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'het': 'bg-green-100 text-green-800 hover:bg-green-200',
      // Swedish
      'en': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'ett': 'bg-green-100 text-green-800 hover:bg-green-200',
      // Norwegian
      'ei': 'bg-red-100 text-red-800 hover:bg-red-200',
      'et': 'bg-green-100 text-green-800 hover:bg-green-200',
      // Default
      'default': 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    };
    
    return colorMap[article] || colorMap['default'];
  };

  const getSelectedStyle = (article: string) => {
    if (selectedArticle !== article) return '';
    if (!showResult) return 'ring-2 ring-blue-500';
    
    const isCorrect = article === currentNoun.article;
    return isCorrect ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500';
  };

  const completedTests = tests.filter(test => test.isCorrect !== undefined).length;
  const correctTests = tests.filter(test => test.isCorrect === true).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Choose the Correct Article</h3>
        <Badge variant="outline">
          {completedTests} of {nouns.length} complete
        </Badge>
      </div>

      {/* Progress */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span>Progress: {correctTests}/{completedTests}</span>
        <span>•</span>
        <span>Accuracy: {completedTests > 0 ? Math.round((correctTests / completedTests) * 100) : 0}%</span>
      </div>

      {/* Current Question */}
      <Card>
        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">What is the correct article for:</p>
            <h2 className="text-4xl font-bold">{currentNoun.word}</h2>
            <p className="text-lg text-gray-600">({currentNoun.meaning})</p>
          </div>

          {/* Article Options */}
          <div className="flex justify-center flex-wrap gap-3">
            {languageArticles.map((article) => (
              <Button
                key={article}
                variant="outline"
                size="lg"
                onClick={() => handleArticleSelect(article)}
                disabled={showResult}
                className={`${getArticleColor(article)} ${getSelectedStyle(article)} text-xl px-6 py-3`}
              >
                {article}
              </Button>
            ))}
          </div>

          {/* Result */}
          {showResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                {currentTest.isCorrect ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-green-600 font-medium">Correct!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-600" />
                    <span className="text-red-600 font-medium">
                      Incorrect. The answer is "{currentNoun.article}"
                    </span>
                  </>
                )}
              </div>

              {!currentTest.isCorrect && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Explanation:</p>
                      {loadingExplanation ? (
                        <p className="text-blue-700">Loading explanation...</p>
                      ) : (
                        <p className="text-blue-700">{explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-x-4">
            {!showResult ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedArticle}
                size="lg"
              >
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNext} size="lg">
                {currentIndex < nouns.length - 1 ? 'Next Question' : 'Continue to Practice'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Progress */}
      <div className="text-center text-sm text-gray-600">
        Question {currentIndex + 1} of {nouns.length}
      </div>
    </div>
  );
};

export default TestingStep;
