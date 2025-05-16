
import { Language } from '@/types';

export function getLanguageFlag(language: Language): string {
  switch (language.toLowerCase()) {
    case 'english':
      return '🇬🇧';
    case 'german':
      return '🇩🇪';
    case 'spanish':
      return '🇪🇸';
    case 'french':
      return '🇫🇷';
    case 'portuguese':
      return '🇵🇹';
    case 'italian':
      return '🇮🇹';
    case 'turkish':
      return '🇹🇷';
    case 'swedish':
      return '🇸🇪';
    case 'dutch':
      return '🇳🇱';
    case 'norwegian':
      return '🇳🇴';
    case 'russian':
      return '🇷🇺';
    case 'polish':
      return '🇵🇱';
    case 'chinese':
      return '🇨🇳';
    case 'japanese':
      return '🇯🇵';
    case 'korean':
      return '🇰🇷';
    case 'arabic':
      return '🇸🇦';
    default:
      return '🌍';
  }
}

export function getLanguageStatsPrefix(language: Language): string {
  // Case-insensitive mapping by first converting to lowercase
  const normalizedLanguage = language.toLowerCase() as Language;
  
  switch (normalizedLanguage) {
    case 'english':
      return 'English';
    case 'german':
      return 'German';
    case 'spanish':
      return 'Spanish';
    case 'french':
      return 'French';
    case 'portuguese':
      return 'Portuguese';
    case 'italian':
      return 'Italian';
    case 'turkish':
      return 'Turkish';
    case 'swedish':
      return 'Swedish';
    case 'dutch':
      return 'Dutch';
    case 'norwegian':
      return 'Norwegian';
    case 'russian':
      return 'Russian';
    case 'polish':
      return 'Polish';
    case 'chinese':
      return 'Chinese';
    case 'japanese':
      return 'Japanese';
    case 'korean':
      return 'Korean';
    case 'arabic':
      return 'Arabic';
    default:
      return language;
  }
}

// New utility function for normalizing language values
export function normalizeLanguage(language: string): Language {
  return language.toLowerCase() as Language;
}
