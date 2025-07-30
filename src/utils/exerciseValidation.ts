
import { SentenceMiningExercise } from '@/types/sentence-mining';
import { evaluateAnswer, evaluateVocabularyMarking } from './answerEvaluation';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a sentence mining exercise for completeness and correctness
 */
export const validateExercise = (exercise: SentenceMiningExercise): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic required fields
  if (!exercise.id) errors.push('Exercise ID is required');
  if (!exercise.sentence) errors.push('Sentence is required');
  if (!exercise.difficulty) errors.push('Difficulty level is required');

  // Cloze exercise validation
  if (!exercise.clozeSentence) {
    errors.push('Cloze sentence is required for cloze exercises');
  }
  if (!exercise.targetWord) {
    errors.push('Target word is required for cloze exercises');
  }

  // Difficulty validation
  if (!['beginner', 'intermediate', 'advanced'].includes(exercise.difficulty)) {
    errors.push('Invalid difficulty level');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Test answer evaluation for different scenarios
 */
export const testAnswerEvaluation = (
  exerciseType: 'cloze',
  testCases: Array<{
    userAnswer: string | string[];
    correctAnswer: string | string[];
    expectedResult: boolean;
    description: string;
  }>
) => {
  const results = testCases.map(testCase => {
    const evaluationResult = evaluateAnswer(
      testCase.userAnswer as string,
      testCase.correctAnswer as string,
      exerciseType
    );

    const passed = evaluationResult.isCorrect === testCase.expectedResult;

    return {
      ...testCase,
      actualResult: evaluationResult.isCorrect,
      accuracy: evaluationResult.accuracy,
      feedback: evaluationResult.feedback,
      passed,
      evaluationResult
    };
  });

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  return {
    results,
    summary: {
      passed: passedCount,
      total: totalCount,
      percentage: Math.round((passedCount / totalCount) * 100)
    }
  };
};

/**
 * Predefined test cases for cloze exercises
 */
export const getTestCases = (exerciseType: 'cloze') => {
  return [
    {
      userAnswer: 'casa',
      correctAnswer: 'casa',
      expectedResult: true,
      description: 'Exact match'
    },
    {
      userAnswer: 'casas',
      correctAnswer: 'casa',
      expectedResult: false,
      description: 'Plural vs singular'
    },
    {
      userAnswer: 'hogar',
      correctAnswer: 'casa',
      expectedResult: false,
      description: 'Synonym but not exact'
    },
    {
      userAnswer: '',
      correctAnswer: 'casa',
      expectedResult: false,
      description: 'Empty answer'
    }
  ];
};
