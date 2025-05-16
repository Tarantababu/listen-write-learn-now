
import { Language } from '@/types';

/**
 * Normalizes a language string to lowercase for consistent comparisons
 * @param language The language to normalize
 * @returns Normalized language string
 */
export function normalizeLanguage(language: string): string {
  return language.toLowerCase();
}

/**
 * Gets the flag emoji for a given language
 * @param language The language to get the flag for
 * @returns Flag emoji for the language
 */
export function getLanguageFlag(language: string): string {
  const lang = normalizeLanguage(language);
  
  switch (lang) {
    case 'english':
      return '🇬🇧';
    case 'spanish':
      return '🇪🇸';
    case 'french':
      return '🇫🇷';
    case 'german':
      return '🇩🇪';
    case 'italian':
      return '🇮🇹';
    case 'portuguese':
      return '🇵🇹';
    case 'chinese':
      return '🇨🇳';
    case 'japanese':
      return '🇯🇵';
    case 'korean':
      return '🇰🇷';
    case 'russian':
      return '🇷🇺';
    case 'arabic':
      return '🇸🇦';
    case 'dutch':
      return '🇳🇱';
    case 'swedish':
      return '🇸🇪';
    case 'turkish':
      return '🇹🇷';
    case 'polish':
      return '🇵🇱';
    case 'hindi':
      return '🇮🇳';
    default:
      return '🌐';
  }
}

/**
 * Capitalizes the first letter of a language name
 * @param language The language name to capitalize
 * @returns Capitalized language name
 */
export function capitalizeLanguage(language: string): string {
  if (!language) return '';
  return language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();
}
