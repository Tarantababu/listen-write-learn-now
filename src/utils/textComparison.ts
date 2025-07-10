
/**
 * Computes the Levenshtein distance between two strings
 * This algorithm measures the minimum number of single-character edits 
 * needed to change one string into another
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  
  // For all i and j, d[i,j] holds the Levenshtein distance between
  // the first i characters of str1 and the first j characters of str2
  const d: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Base cases: empty string transformations
  for (let i = 0; i <= m; i++) {
    d[i][0] = i; // deletion
  }
  
  for (let j = 0; j <= n; j++) {
    d[0][j] = j; // insertion
  }
  
  // Fill the matrix
  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      
      d[i][j] = Math.min(
        d[i - 1][j] + 1,                   // deletion
        d[i][j - 1] + 1,                   // insertion
        d[i - 1][j - 1] + substitutionCost // substitution
      );
    }
  }
  
  return d[m][n];
};

/**
 * Calculates the similarity between two strings as a value between 0 and 1
 * 1 means identical, 0 means completely different
 */
export const stringSimilarity = (str1: string, str2: string): number => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1; // Both strings are empty
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
};

/**
 * Categorizes a token comparison based on similarity score
 */
export interface TokenComparisonResult {
  originalToken: string;
  userToken: string | null;
  status: 'correct' | 'almost' | 'incorrect' | 'missing' | 'extra';
  similarity: number;
}

/**
 * Improved text normalization that's consistent with answer evaluation
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    // Normalize different types of quotes and apostrophes
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    // Normalize different types of dashes
    .replace(/[\u2013\u2014\u2015]/g, '-')
    // Remove punctuation for word comparison
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"']/g, '')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Implements the Needleman-Wunsch algorithm for optimal sequence alignment
 * between original text and user input tokens
 */
export const alignSequences = (originalTokens: string[], userTokens: string[]): {
  alignedOriginal: (string | null)[];
  alignedUser: (string | null)[];
} => {
  const m = originalTokens.length;
  const n = userTokens.length;
  
  // Create score matrix
  const score: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Create traceback matrix to reconstruct the alignment
  // 0: diagonal (match/mismatch), 1: left (deletion), 2: up (insertion)
  const traceback: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Initialize first row and column with gap penalties
  for (let i = 0; i <= m; i++) {
    score[i][0] = i * -1;
    if (i > 0) traceback[i][0] = 2; // up
  }
  
  for (let j = 0; j <= n; j++) {
    score[0][j] = j * -1;
    if (j > 0) traceback[0][j] = 1; // left
  }
  
  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      // Calculate similarity score between tokens
      const similarity = stringSimilarity(originalTokens[i - 1], userTokens[j - 1]);
      
      // Scoring: +1 for exact match, +0.5 for fuzzy match, -1 for mismatch
      let matchScore;
      if (similarity === 1) {
        matchScore = 1; // Exact match
      } else if (similarity >= 0.8) {
        matchScore = 0.5; // Fuzzy match
      } else {
        matchScore = -1; // Mismatch
      }
      
      const diagScore = score[i - 1][j - 1] + matchScore;
      const upScore = score[i - 1][j] - 1; // Gap in user input (missing)
      const leftScore = score[i][j - 1] - 1; // Gap in original (extra)
      
      // Choose the maximum score
      if (diagScore >= upScore && diagScore >= leftScore) {
        score[i][j] = diagScore;
        traceback[i][j] = 0; // diagonal
      } else if (upScore >= leftScore) {
        score[i][j] = upScore;
        traceback[i][j] = 2; // up
      } else {
        score[i][j] = leftScore;
        traceback[i][j] = 1; // left
      }
    }
  }
  
  // Traceback to get alignment
  const alignedOriginal: (string | null)[] = [];
  const alignedUser: (string | null)[] = [];
  
  let i = m;
  let j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && traceback[i][j] === 0) {
      // Match or mismatch - add both tokens
      alignedOriginal.unshift(originalTokens[i - 1]);
      alignedUser.unshift(userTokens[j - 1]);
      i--;
      j--;
    } else if (j > 0 && traceback[i][j] === 1) {
      // Extra word in user input
      alignedOriginal.unshift(null);
      alignedUser.unshift(userTokens[j - 1]);
      j--;
    } else if (i > 0 && traceback[i][j] === 2) {
      // Missing word in user input
      alignedOriginal.unshift(originalTokens[i - 1]);
      alignedUser.unshift(null);
      i--;
    } else {
      // Should not happen, but just in case
      if (i > 0) {
        alignedOriginal.unshift(originalTokens[i - 1]);
        alignedUser.unshift(null);
        i--;
      } else if (j > 0) {
        alignedOriginal.unshift(null);
        alignedUser.unshift(userTokens[j - 1]);
        j--;
      }
    }
  }
  
  return { alignedOriginal, alignedUser };
};

/**
 * Compares two texts token by token with fuzzy matching using optimal alignment
 */
export const compareTexts = (originalText: string, userText: string): {
  tokenResults: TokenComparisonResult[];
  correct: number;
  almost: number;
  incorrect: number;
  missing: number;
  extra: number;
  accuracy: number;
} => {
  console.log('compareTexts input:', { originalText, userText });
  
  // Stage 1: Input Normalization
  const normalizedOriginal = normalizeText(originalText);
  const normalizedUser = normalizeText(userText);
  
  console.log('After normalization:', { normalizedOriginal, normalizedUser });
  
  // For exact match comparison, let's also check without removing punctuation
  const simpleNormalizedOriginal = originalText.toLowerCase().trim().replace(/\s+/g, ' ');
  const simpleNormalizedUser = userText.toLowerCase().trim().replace(/\s+/g, ' ');
  
  console.log('Simple normalization:', { simpleNormalizedOriginal, simpleNormalizedUser });
  
  // If they match exactly after simple normalization, return perfect score
  if (simpleNormalizedOriginal === simpleNormalizedUser) {
    console.log('Exact match found with simple normalization!');
    return {
      tokenResults: [{
        originalToken: originalText,
        userToken: userText,
        status: 'correct',
        similarity: 1
      }],
      correct: 1,
      almost: 0,
      incorrect: 0,
      missing: 0,
      extra: 0,
      accuracy: 100
    };
  }
  
  // Split into tokens
  const originalTokens = normalizedOriginal.split(' ').filter(Boolean);
  const userTokens = normalizedUser.split(' ').filter(Boolean);
  
  console.log('Tokens:', { originalTokens, userTokens });
  
  // Stage 2: Sequence Alignment
  const { alignedOriginal, alignedUser } = alignSequences(originalTokens, userTokens);
  
  // Stage 3: Token Comparison
  const tokenResults: TokenComparisonResult[] = [];
  let correct = 0;
  let almost = 0;
  let incorrect = 0;
  let missing = 0;
  let extra = 0;
  
  for (let i = 0; i < alignedOriginal.length; i++) {
    const originalToken = alignedOriginal[i];
    const userToken = alignedUser[i];
    
    if (originalToken === null && userToken !== null) {
      // Extra word in user input
      tokenResults.push({
        originalToken: '',
        userToken,
        status: 'extra',
        similarity: 0
      });
      extra++;
    } else if (originalToken !== null && userToken === null) {
      // Missing word in user input
      tokenResults.push({
        originalToken,
        userToken: null,
        status: 'missing',
        similarity: 0
      });
      missing++;
    } else if (originalToken !== null && userToken !== null) {
      // Both tokens present, check similarity
      const similarity = stringSimilarity(originalToken, userToken);
      let status: TokenComparisonResult['status'];
      
      if (similarity === 1) {
        status = 'correct';
        correct++;
      } else if (similarity >= 0.8) {
        status = 'almost';
        almost++;
      } else {
        status = 'incorrect';
        incorrect++;
      }
      
      tokenResults.push({
        originalToken,
        userToken,
        status,
        similarity
      });
    }
  }
  
  // Stage 4: Scoring Logic
  const totalExpectedWords = originalTokens.length;
  // Count both correct and almost correct (with reduced weight) for accuracy
  const effectiveCorrect = correct + (almost * 0.5);
  const accuracy = Math.min(100, Math.round((effectiveCorrect / totalExpectedWords) * 100));
  
  console.log('Final comparison result:', {
    tokenResults,
    correct,
    almost,
    incorrect,
    missing,
    extra,
    accuracy
  });

  return {
    tokenResults,
    correct,
    almost,
    incorrect,
    missing,
    extra,
    accuracy
  };
};

/**
 * Generates HTML with highlighted errors and correct matches
 */
export const generateHighlightedText = (tokenResults: TokenComparisonResult[]): string => {
  return tokenResults
    .map(result => {
      if (!result.userToken) return '';
      
      switch (result.status) {
        case 'correct':
          return `<span class="text-success">${result.userToken}</span>`;
        case 'almost':
          return `<span class="text-amber-500">${result.userToken}</span>`;
        case 'incorrect':
        case 'extra':
          return `<span class="text-destructive">${result.userToken}</span>`;
        default:
          return result.userToken;
      }
    })
    .filter(Boolean)
    .join(' ');
};
