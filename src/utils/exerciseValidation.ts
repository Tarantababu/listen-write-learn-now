
import { SentenceMiningExercise, ExerciseType } from '@/types/sentence-mining';
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
  if (!exercise.exerciseType) errors.push('Exercise type is required');
  if (!exercise.difficulty) errors.push('Difficulty level is required');

  // Exercise type specific validation
  switch (exercise.exerciseType) {
    case 'translation':
      if (!exercise.translation) {
        errors.push('Translation is required for translation exercises');
      }
      if (!exercise.correctAnswer) {
        warnings.push('Correct answer should be provided for better evaluation');
      }
      break;

    case 'vocabulary_marking':
      if (!exercise.targetWords || exercise.targetWords.length === 0) {
        errors.push('Target words are required for vocabulary marking exercises');
      }
      if (exercise.targetWords && exercise.targetWords.length > 10) {
        warnings.push('Too many target words may make the exercise too difficult');
      }
      break;

    case 'cloze':
      if (!exercise.clozeSentence) {
        errors.push('Cloze sentence is required for cloze exercises');
      }
      if (!exercise.targetWords || exercise.targetWords.length === 0) {
        errors.push('Target words are required for cloze exercises');
      }
      break;
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
  exerciseType: ExerciseType,
  testCases: Array<{
    userAnswer: string | string[];
    correctAnswer: string | string[];
    expectedResult: boolean;
    description: string;
  }>
) => {
  const results = testCases.map(testCase => {
    let evaluationResult;

    if (exerciseType === 'vocabulary_marking') {
      evaluationResult = evaluateVocabularyMarking(
        testCase.userAnswer as string[],
        testCase.correctAnswer as string[],
        true
      );
    } else {
      evaluationResult = evaluateAnswer(
        testCase.userAnswer as string,
        testCase.correctAnswer as string | string[],
        exerciseType
      );
    }

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
 * Predefined test cases for different exercise types
 */
export const getTestCases = (exerciseType: ExerciseType) => {
  switch (exerciseType) {
    case 'translation':
      return [
        {
          userAnswer: 'Hola, ¿cómo estás?',
          correctAnswer: 'Hola, ¿cómo estás?',
          expectedResult: true,
          description: 'Exact match'
        },
        {
          userAnswer: 'Hola, como estas?',
          correctAnswer: 'Hola, ¿cómo estás?',
          expectedResult: true,
          description: 'Close match without accents'
        },
        {
          userAnswer: 'Hello, how are you?',
          correctAnswer: 'Hola, ¿cómo estás?',
          expectedResult: false,
          description: 'Wrong language'
        },
        {
          userAnswer: '',
          correctAnswer: 'Hola, ¿cómo estás?',
          expectedResult: false,
          description: 'Empty answer'
        }
      ];

    case 'vocabulary_marking':
      return [
        {
          userAnswer: ['casa', 'perro'],
          correctAnswer: ['casa', 'perro'],
          expectedResult: true,
          description: 'Perfect selection'
        },
        {
          userAnswer: ['casa'],
          correctAnswer: ['casa', 'perro'],
          expectedResult: true,
          description: 'Partial correct selection'
        },
        {
          userAnswer: ['gato'],
          correctAnswer: ['casa', 'perro'],
          expectedResult: false,
          description: 'Wrong words selected'
        },
        {
          userAnswer: [],
          correctAnswer: ['casa', 'perro'],
          expectedResult: true,
          description: 'No selection (valid for vocabulary marking)'
        }
      ];

    case 'cloze':
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
        }
      ];

    default:
      return [];
  }
};
