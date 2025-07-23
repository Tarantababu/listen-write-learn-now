
/**
 * Advanced text comparison utilities for sentence mining exercises
 */

/**
 * Calculate string similarity using multiple algorithms
 */
export const stringSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  
  // Normalize strings
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Use Levenshtein distance for similarity
  const levenshteinSimilarity = 1 - (levenshteinDistance(s1, s2) / Math.max(s1.length, s2.length));
  
  // Use token-based similarity
  const tokenSimilarity = calculateTokenSimilarity(s1, s2);
  
  // Return weighted average
  return (levenshteinSimilarity * 0.6) + (tokenSimilarity * 0.4);
};

/**
 * Compare texts and return detailed comparison result
 */
export const compareTexts = (expected: string, actual: string): { accuracy: number; differences: string[] } => {
  if (!expected || !actual) {
    return { accuracy: 0, differences: ['Empty input'] };
  }
  
  const normalizedExpected = normalizeText(expected);
  const normalizedActual = normalizeText(actual);
  
  // Exact match
  if (normalizedExpected === normalizedActual) {
    return { accuracy: 100, differences: [] };
  }
  
  // Calculate similarity
  const similarity = stringSimilarity(normalizedExpected, normalizedActual);
  const accuracy = Math.round(similarity * 100);
  
  // Find differences
  const differences = findDifferences(normalizedExpected, normalizedActual);
  
  return { accuracy, differences };
};

/**
 * Normalize text for comparison
 */
const normalizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .trim()
    .toLowerCase()
    // Normalize quotes and apostrophes
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    // Normalize dashes
    .replace(/[\u2013\u2014\u2015]/g, '-')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove common punctuation differences
    .replace(/[.!?;:,]/g, '')
    .trim();
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
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

/**
 * Calculate token-based similarity
 */
const calculateTokenSimilarity = (str1: string, str2: string): number => {
  const tokens1 = new Set(str1.split(/\s+/));
  const tokens2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...tokens1].filter(token => tokens2.has(token)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
};

/**
 * Find differences between expected and actual text
 */
const findDifferences = (expected: string, actual: string): string[] => {
  const differences: string[] = [];
  
  const expectedTokens = expected.split(/\s+/);
  const actualTokens = actual.split(/\s+/);
  
  // Find missing words
  const missingWords = expectedTokens.filter(word => !actualTokens.includes(word));
  if (missingWords.length > 0) {
    differences.push(`Missing words: ${missingWords.join(', ')}`);
  }
  
  // Find extra words
  const extraWords = actualTokens.filter(word => !expectedTokens.includes(word));
  if (extraWords.length > 0) {
    differences.push(`Extra words: ${extraWords.join(', ')}`);
  }
  
  return differences;
};
