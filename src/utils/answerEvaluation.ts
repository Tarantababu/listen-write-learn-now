
export interface EvaluationResult {
  isCorrect: boolean;
  accuracy: number;
  feedback: string;
  similarityScore: number;
  category: 'exact' | 'close' | 'incorrect' | 'skipped';
}

export const evaluateAnswer = (
  userAnswer: string,
  correctAnswer: string,
  exerciseType: 'cloze',
  threshold: number = 0.8
): EvaluationResult => {
  if (!userAnswer.trim()) {
    return {
      isCorrect: false,
      accuracy: 0,
      feedback: 'No answer provided',
      similarityScore: 0,
      category: 'incorrect'
    };
  }

  const normalizedUser = userAnswer.toLowerCase().trim();
  const normalizedCorrect = correctAnswer.toLowerCase().trim();

  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return {
      isCorrect: true,
      accuracy: 100,
      feedback: 'Perfect match!',
      similarityScore: 1,
      category: 'exact'
    };
  }

  // Calculate similarity score using simple string comparison
  const similarity = calculateStringSimilarity(normalizedUser, normalizedCorrect);
  
  if (similarity >= threshold) {
    return {
      isCorrect: true,
      accuracy: Math.round(similarity * 100),
      feedback: 'Close enough!',
      similarityScore: similarity,
      category: 'close'
    };
  }

  return {
    isCorrect: false,
    accuracy: Math.round(similarity * 100),
    feedback: 'Not quite right',
    similarityScore: similarity,
    category: 'incorrect'
  };
};

const calculateStringSimilarity = (str1: string, str2: string): number => {
  // Simple Levenshtein distance-based similarity
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array.from({ length: str2.length + 1 }, (_, i) => [i]);
  matrix[0] = Array.from({ length: str1.length + 1 }, (_, i) => i);

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2[i - 1] === str1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};
