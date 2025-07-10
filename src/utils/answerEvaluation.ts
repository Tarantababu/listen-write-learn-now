
import { compareTexts, stringSimilarity } from './textComparison';

export interface AnswerEvaluationResult {
  isCorrect: boolean;
  accuracy: number;
  feedback: string;
  similarityScore: number;
  category: 'perfect' | 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Enhanced answer evaluation with multiple matching strategies
 */
export const evaluateAnswer = (
  userAnswer: string,
  correctAnswers: string | string[],
  exerciseType: 'translation' | 'cloze' | 'vocabulary_marking' | 'multiple_choice' = 'translation',
  threshold: number = 0.7
): AnswerEvaluationResult => {
  
  // Normalize inputs
  const normalizedUser = userAnswer.trim().toLowerCase();
  const answerArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];
  const normalizedCorrect = answerArray.map(ans => ans.trim().toLowerCase());

  if (!normalizedUser) {
    return {
      isCorrect: false,
      accuracy: 0,
      feedback: 'Please provide an answer.',
      similarityScore: 0,
      category: 'poor'
    };
  }

  let bestMatch = { accuracy: 0, similarity: 0 };

  // Test against all possible correct answers
  for (const correctAnswer of normalizedCorrect) {
    // Exact match check
    if (normalizedUser === correctAnswer) {
      return {
        isCorrect: true,
        accuracy: 100,
        feedback: 'Perfect match!',
        similarityScore: 1,
        category: 'perfect'
      };
    }

    // Fuzzy matching using text comparison
    const comparisonResult = compareTexts(correctAnswer, normalizedUser);
    const stringSim = stringSimilarity(correctAnswer, normalizedUser);
    
    if (comparisonResult.accuracy > bestMatch.accuracy) {
      bestMatch = {
        accuracy: comparisonResult.accuracy,
        similarity: stringSim
      };
    }
  }

  // Determine correctness based on threshold
  const isCorrect = bestMatch.accuracy >= (threshold * 100);
  
  // Categorize performance
  let category: AnswerEvaluationResult['category'];
  if (bestMatch.accuracy >= 95) category = 'perfect';
  else if (bestMatch.accuracy >= 85) category = 'excellent';
  else if (bestMatch.accuracy >= 70) category = 'good';
  else if (bestMatch.accuracy >= 50) category = 'fair';
  else category = 'poor';

  // Generate feedback
  let feedback: string;
  if (category === 'perfect') {
    feedback = 'Excellent work!';
  } else if (category === 'excellent') {
    feedback = 'Very close! Minor differences detected.';
  } else if (category === 'good') {
    feedback = 'Good attempt! You\'re on the right track.';
  } else if (category === 'fair') {
    feedback = 'Getting there! Keep practicing.';
  } else {
    feedback = 'Not quite right. Try again!';
  }

  return {
    isCorrect,
    accuracy: bestMatch.accuracy,
    feedback,
    similarityScore: bestMatch.similarity,
    category
  };
};

/**
 * Vocabulary marking specific evaluation
 */
export const evaluateVocabularyMarking = (
  selectedWords: string[],
  targetWords: string[],
  allowPartialCredit: boolean = true
): AnswerEvaluationResult => {
  
  if (selectedWords.length === 0) {
    return {
      isCorrect: false,
      accuracy: 0,
      feedback: 'Please select some words to learn.',
      similarityScore: 0,
      category: 'poor'
    };
  }

  const normalizedSelected = selectedWords.map(w => w.toLowerCase());
  const normalizedTarget = targetWords.map(w => w.toLowerCase());

  // Calculate overlap
  const correctSelections = normalizedSelected.filter(word => 
    normalizedTarget.includes(word)
  ).length;

  const extraSelections = normalizedSelected.length - correctSelections;
  const missedWords = normalizedTarget.length - correctSelections;

  // Calculate accuracy with penalties for extra selections
  let accuracy = 0;
  if (normalizedTarget.length > 0) {
    const baseAccuracy = (correctSelections / normalizedTarget.length) * 100;
    const penalty = (extraSelections * 10); // 10% penalty per extra word
    accuracy = Math.max(0, baseAccuracy - penalty);
  }

  const isCorrect = allowPartialCredit ? accuracy >= 60 : correctSelections === normalizedTarget.length;

  let feedback: string;
  if (correctSelections === normalizedTarget.length && extraSelections === 0) {
    feedback = 'Perfect! You identified all the target words.';
  } else if (correctSelections > 0) {
    feedback = `Good! You identified ${correctSelections} out of ${normalizedTarget.length} target words.`;
    if (extraSelections > 0) {
      feedback += ` You also selected ${extraSelections} additional word(s).`;
    }
  } else {
    feedback = 'None of the selected words were target words. Try again!';
  }

  return {
    isCorrect,
    accuracy: Math.round(accuracy),
    feedback,
    similarityScore: correctSelections / Math.max(normalizedTarget.length, normalizedSelected.length),
    category: accuracy >= 90 ? 'excellent' : accuracy >= 70 ? 'good' : accuracy >= 50 ? 'fair' : 'poor'
  };
};

/**
 * Multiple choice evaluation
 */
export const evaluateMultipleChoice = (
  selectedOption: string,
  correctAnswer: string
): AnswerEvaluationResult => {
  
  const isCorrect = selectedOption === correctAnswer;
  
  return {
    isCorrect,
    accuracy: isCorrect ? 100 : 0,
    feedback: isCorrect ? 'Correct!' : 'That\'s not the right answer.',
    similarityScore: isCorrect ? 1 : 0,
    category: isCorrect ? 'perfect' : 'poor'
  };
};
