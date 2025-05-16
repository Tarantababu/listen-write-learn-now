
import { Language } from "@/types";

/**
 * Converts from English language names to Language type codes
 */
export const convertToLanguageCode = (englishName: string): Language => {
  const languageMap: Record<string, Language> = {
    'english': 'en',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'portuguese': 'pt',
    'japanese': 'ja',
    'korean': 'ko',
    'chinese': 'zh'
  };
  
  return languageMap[englishName.toLowerCase()] || 'en';
};

/**
 * Converts from Language type codes to English language names
 */
export const convertToEnglishName = (code: Language): string => {
  const languageMap: Record<Language, string> = {
    'en': 'english',
    'es': 'spanish',
    'fr': 'french',
    'de': 'german',
    'it': 'italian',
    'pt': 'portuguese',
    'ja': 'japanese',
    'ko': 'korean',
    'zh': 'chinese'
  };
  
  return languageMap[code] || 'english';
};
