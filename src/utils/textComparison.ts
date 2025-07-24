
/**
 * Advanced text comparison utilities for sentence mining exercises
 */

/**
 * Token comparison result interface
 */
export interface TokenComparisonResult {
  originalToken: string;
  userToken: string;
  status: 'correct' | 'almost' | 'incorrect' | 'missing' | 'extra';
  similarity?: number;
}

/**
 * Detailed comparison result interface
 */
export interface DetailedComparisonResult {
  accuracy: number;
  differences: string[];
  tokenResults: TokenComparisonResult[];
  correct: number;
  almost: number;
  incorrect: number;
  missing: number;
  extra: number;
}

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
export const compareTexts = (expected: string, actual: string): DetailedComparisonResult => {
  if (!expected || !actual) {
    return { 
      accuracy: 0, 
      differences: ['Empty input'],
      tokenResults: [],
      correct: 0,
      almost: 0,
      incorrect: 0,
      missing: 0,
      extra: 0
    };
  }
  
  const normalizedExpected = normalizeText(expected);
  const normalizedActual = normalizeText(actual);
  
  // Exact match
  if (normalizedExpected === normalizedActual) {
    const tokens = normalizedExpected.split(/\s+/).filter(t => t.length > 0);
    const tokenResults = tokens.map(token => ({
      originalToken: token,
      userToken: token,
      status: 'correct' as const
    }));
    
    return { 
      accuracy: 100, 
      differences: [],
      tokenResults,
      correct: tokens.length,
      almost: 0,
      incorrect: 0,
      missing: 0,
      extra: 0
    };
  }
  
  // Perform detailed token comparison
  const tokenResults = performTokenComparison(normalizedExpected, normalizedActual);
  
  // Calculate statistics
  const stats = {
    correct: tokenResults.filter(t => t.status === 'correct').length,
    almost: tokenResults.filter(t => t.status === 'almost').length,
    incorrect: tokenResults.filter(t => t.status === 'incorrect').length,
    missing: tokenResults.filter(t => t.status === 'missing').length,
    extra: tokenResults.filter(t => t.status === 'extra').length
  };
  
  // Calculate overall accuracy
  const totalTokens = stats.correct + stats.almost + stats.incorrect + stats.missing + stats.extra;
  const weightedScore = (stats.correct * 1.0) + (stats.almost * 0.8) + (stats.incorrect * 0.0) + (stats.missing * 0.0) + (stats.extra * 0.0);
  const accuracy = totalTokens > 0 ? (weightedScore / totalTokens) * 100 : 0;
  
  // Find differences
  const differences = findDifferences(normalizedExpected, normalizedActual);
  
  return { 
    accuracy, 
    differences, 
    tokenResults,
    ...stats
  };
};

/**
 * Perform detailed token-by-token comparison
 */
const performTokenComparison = (expected: string, actual: string): TokenComparisonResult[] => {
  const expectedTokens = expected.split(/\s+/).filter(t => t.length > 0);
  const actualTokens = actual.split(/\s+/).filter(t => t.length > 0);
  
  const results: TokenComparisonResult[] = [];
  const usedActualIndices = new Set<number>();
  
  // First pass: find exact and almost matches
  for (let i = 0; i < expectedTokens.length; i++) {
    const expectedToken = expectedTokens[i];
    let bestMatch: { index: number; similarity: number; status: 'correct' | 'almost' } | null = null;
    
    for (let j = 0; j < actualTokens.length; j++) {
      if (usedActualIndices.has(j)) continue;
      
      const actualToken = actualTokens[j];
      const similarity = stringSimilarity(expectedToken, actualToken);
      
      if (similarity === 1) {
        bestMatch = { index: j, similarity, status: 'correct' };
        break;
      } else if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { index: j, similarity, status: 'almost' };
      }
    }
    
    if (bestMatch) {
      usedActualIndices.add(bestMatch.index);
      results.push({
        originalToken: expectedToken,
        userToken: actualTokens[bestMatch.index],
        status: bestMatch.status,
        similarity: bestMatch.similarity
      });
    } else {
      results.push({
        originalToken: expectedToken,
        userToken: '',
        status: 'missing'
      });
    }
  }
  
  // Second pass: find incorrect matches for remaining expected tokens
  for (let i = 0; i < expectedTokens.length; i++) {
    if (results[i] && results[i].status !== 'missing') continue;
    
    const expectedToken = expectedTokens[i];
    let bestMatch: { index: number; similarity: number } | null = null;
    
    for (let j = 0; j < actualTokens.length; j++) {
      if (usedActualIndices.has(j)) continue;
      
      const actualToken = actualTokens[j];
      const similarity = stringSimilarity(expectedToken, actualToken);
      
      if (similarity > 0.3 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { index: j, similarity };
      }
    }
    
    if (bestMatch) {
      usedActualIndices.add(bestMatch.index);
      results[i] = {
        originalToken: expectedToken,
        userToken: actualTokens[bestMatch.index],
        status: 'incorrect',
        similarity: bestMatch.similarity
      };
    }
  }
  
  // Third pass: mark remaining actual tokens as extra
  for (let j = 0; j < actualTokens.length; j++) {
    if (!usedActualIndices.has(j)) {
      results.push({
        originalToken: '',
        userToken: actualTokens[j],
        status: 'extra'
      });
    }
  }
  
  return results;
};

/**
 * Generate highlighted text from token comparison results
 */
export const generateHighlightedText = (tokenResults: TokenComparisonResult[]): string => {
  return tokenResults.map(result => {
    const token = result.userToken || result.originalToken;
    
    switch (result.status) {
      case 'correct':
        return `<span class="bg-green-100 text-green-800 px-1 rounded">${token}</span>`;
      case 'almost':
        return `<span class="bg-yellow-100 text-yellow-800 px-1 rounded">${token}</span>`;
      case 'incorrect':
        return `<span class="bg-red-100 text-red-800 px-1 rounded">${token}</span>`;
      case 'missing':
        return `<span class="bg-blue-100 text-blue-800 px-1 rounded opacity-50">[${result.originalToken}]</span>`;
      case 'extra':
        return `<span class="bg-purple-100 text-purple-800 px-1 rounded">${token}</span>`;
      default:
        return token;
    }
  }).join(' ');
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
