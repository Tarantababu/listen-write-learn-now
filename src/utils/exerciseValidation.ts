
import { evaluateAnswer } from './answerEvaluation';

export interface TestCase {
  description: string;
  userAnswer: string;
  correctAnswer: string;
  expectedResult: boolean;
  expectedAccuracy?: number;
}

export const getTestCases = (exerciseType: 'cloze'): TestCase[] => {
  return [
    {
      description: 'Exact match should be correct',
      userAnswer: 'Ball',
      correctAnswer: 'Ball',
      expectedResult: true,
      expectedAccuracy: 100
    },
    {
      description: 'Case insensitive match should be correct',
      userAnswer: 'ball',
      correctAnswer: 'Ball',
      expectedResult: true,
      expectedAccuracy: 100
    },
    {
      description: 'Close match should be accepted',
      userAnswer: 'Bal',
      correctAnswer: 'Ball',
      expectedResult: true
    },
    {
      description: 'Empty answer should be incorrect',
      userAnswer: '',
      correctAnswer: 'Ball',
      expectedResult: false,
      expectedAccuracy: 0
    },
    {
      description: 'Completely wrong answer should be incorrect',
      userAnswer: 'House',
      correctAnswer: 'Ball',
      expectedResult: false
    }
  ];
};

export const testAnswerEvaluation = (exerciseType: 'cloze', testCases: TestCase[]) => {
  const results = testCases.map(testCase => {
    const result = evaluateAnswer(
      testCase.userAnswer,
      testCase.correctAnswer,
      exerciseType
    );

    const passed = result.isCorrect === testCase.expectedResult &&
      (testCase.expectedAccuracy ? result.accuracy === testCase.expectedAccuracy : true);

    return {
      ...testCase,
      actualResult: result.isCorrect,
      accuracy: result.accuracy,
      feedback: result.feedback,
      passed
    };
  });

  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    percentage: Math.round((results.filter(r => r.passed).length / results.length) * 100)
  };

  return { results, summary };
};
