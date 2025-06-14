
export interface TextSelectionInfo {
  text: string;
  wordCount: number;
  characterCount: number;
  isValidForDictation: boolean;
  isValidForVocabulary: boolean;
  isValidForTranslation: boolean;
  selectionType: 'word' | 'phrase' | 'sentence' | 'paragraph';
}

export const analyzeTextSelection = (text: string): TextSelectionInfo => {
  // CRITICAL: Preserve the original text exactly as received - no additional processing
  const preservedText = text;
  
  // Count words properly while preserving spacing
  const words = preservedText.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const characterCount = preservedText.length;

  // Determine selection type
  let selectionType: TextSelectionInfo['selectionType'] = 'word';
  if (wordCount === 1) {
    selectionType = 'word';
  } else if (wordCount <= 5) {
    selectionType = 'phrase';
  } else if (wordCount <= 15) {
    selectionType = 'sentence';
  } else {
    selectionType = 'paragraph';
  }

  // Determine validity for different exercise types
  const isValidForDictation = wordCount >= 3 && wordCount <= 50 && characterCount <= 500;
  const isValidForVocabulary = wordCount >= 1 && wordCount <= 3 && characterCount <= 100;
  const isValidForTranslation = wordCount >= 2 && wordCount <= 30 && characterCount <= 300;

  return {
    text: preservedText, // Return exactly what was passed in
    wordCount,
    characterCount,
    isValidForDictation,
    isValidForVocabulary,
    isValidForTranslation,
    selectionType
  };
};

export const getSelectionRecommendation = (info: TextSelectionInfo): string => {
  if (info.wordCount === 0) return '';
  
  if (info.wordCount === 1) {
    return 'Perfect for vocabulary! Try selecting a phrase for dictation.';
  }
  
  if (info.wordCount <= 5) {
    return 'Great for phrases! Good for vocabulary and translation exercises.';
  }
  
  if (info.wordCount <= 15) {
    return 'Ideal for dictation and translation exercises!';
  }
  
  if (info.wordCount <= 30) {
    return 'Good for dictation practice, but might be challenging.';
  }
  
  return 'Selection is quite long. Consider shorter segments for better practice.';
};

export const cleanTextForExercise = (text: string, exerciseType: 'dictation' | 'vocabulary' | 'translation'): string => {
  // CRITICAL: For dictation and translation, preserve original spacing completely
  let cleaned = text;
  
  // For vocabulary, clean punctuation more aggressively but preserve internal spacing
  if (exerciseType === 'vocabulary') {
    // Only trim leading/trailing whitespace, preserve internal spacing
    cleaned = text.replace(/^\s+|\s+$/g, '');
    // Remove punctuation but preserve spacing between words
    cleaned = cleaned.replace(/[.,!?;:"'()[\]{}]/g, '');
    // Clean up any double spaces that might result from punctuation removal
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
  } else {
    // For dictation and translation, only trim leading/trailing whitespace
    cleaned = text.replace(/^\s+|\s+$/g, '');
  }
  
  // For dictation, ensure proper sentence structure
  if (exerciseType === 'dictation') {
    // Capitalize first letter if it's not already
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    // Ensure proper ending punctuation for sentences
    if (cleaned.length > 10 && !/[.!?]$/.test(cleaned)) {
      cleaned += '.';
    }
  }
  
  return cleaned;
};
