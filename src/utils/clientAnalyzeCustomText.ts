
/**
 * Analyze a custom reading exercise text client-side for improved performance.
 * Splits the text into sentences, extracts simple 'words', 
 * and generates placeholder grammar and structure info.
 */
export interface ClientAnalyzedCustomTextResult {
  sentences: Array<{
    text: string;
    analysis: {
      words: Array<{
        word: string;
        definition: string;
        exampleSentence: string;
      }>;
      grammarInsights: string[];
      structure: string;
    };
  }>;
  commonPatterns: string[];
  summary: string;
  englishTranslation?: string;
}

export function clientAnalyzeCustomText(text: string): ClientAnalyzedCustomTextResult {
  // Basic regex for sentence splitting (could be improved)
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences = text.match(sentenceRegex) || [text];

  // Collect all words for finding common patterns etc.
  const allWords: string[] = [];
  const sentenceObjects = sentences.map((sentenceText) => {
    // Naive word extraction (remove punctuation, split by whitespace)
    const wordList = (sentenceText.replace(/[.,!?;:()[\]{}"“”'’\-–—]/g, "").split(/\s+/)).filter(Boolean);
    allWords.push(...wordList);

    // Simple placeholder analysis for each word
    const uniqueWords = Array.from(new Set(wordList));
    const words = uniqueWords.map((word) => ({
      word,
      definition: "Definition not available (custom text)",
      exampleSentence: sentenceText.trim(),
    }));

    return {
      text: sentenceText.trim(),
      analysis: {
        words,
        grammarInsights: [
          "This is a custom sentence. Detailed grammar insights are unavailable for custom text.",
        ],
        structure: "Sentence structure analysis unavailable for custom text."
      }
    };
  });

  // Find 'common patterns' by simplistic frequency
  const wordCounts: Record<string, number> = {};
  allWords.forEach(word => {
    wordCounts[word.toLowerCase()] = (wordCounts[word.toLowerCase()] || 0) + 1;
  });
  const commonPatterns = Object.entries(wordCounts)
    .filter(([_, count]) => count > 1)
    .map(([word]) => `The word "${word}" appears multiple times.`);

  return {
    sentences: sentenceObjects,
    commonPatterns,
    summary: `Custom text provided by the user. Detailed summary not available.`,
    englishTranslation: undefined
  };
}
