
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
 * Normalized a string by converting to lowercase and removing punctuation
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    // Remove all punctuation and special characters
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"']/g, '')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Compares two texts token by token with fuzzy matching
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
  // Stage 1: Input Normalization
  const normalizedOriginal = normalizeText(originalText);
  const normalizedUser = normalizeText(userText);
  
  // Split into tokens
  const originalTokens = normalizedOriginal.split(' ');
  const userTokens = normalizedUser.split(' ');
  
  // Stage 2 & 3: Token Alignment and Comparison
  const tokenResults: TokenComparisonResult[] = [];
  let correct = 0;
  let almost = 0;
  let incorrect = 0;
  let missing = 0;
  let extra = 0;
  
  // Compare available tokens
  const minLength = Math.min(originalTokens.length, userTokens.length);
  
  for (let i = 0; i < minLength; i++) {
    const originalToken = originalTokens[i];
    const userToken = userTokens[i];
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
  
  // Handle missing tokens (original is longer than user input)
  if (originalTokens.length > userTokens.length) {
    for (let i = minLength; i < originalTokens.length; i++) {
      tokenResults.push({
        originalToken: originalTokens[i],
        userToken: null,
        status: 'missing',
        similarity: 0
      });
      missing++;
    }
  }
  
  // Handle extra tokens (user input is longer than original)
  if (userTokens.length > originalTokens.length) {
    for (let i = minLength; i < userTokens.length; i++) {
      tokenResults.push({
        originalToken: '',
        userToken: userTokens[i],
        status: 'extra',
        similarity: 0
      });
      extra++;
    }
  }
  
  // Stage 4: Scoring Logic
  const totalExpectedWords = originalTokens.length;
  // Count both correct and almost correct (with reduced weight) for accuracy
  const effectiveCorrect = correct + (almost * 0.5);
  const accuracy = Math.round((effectiveCorrect / totalExpectedWords) * 100);
  
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

