
import { Language } from '@/types';

export function getLanguageFlag(language: Language): string {
  switch (language) {
    case 'english':
      return '🇬🇧';
    case 'german':
      return '🇩🇪';
    default:
      return '🌍';
  }
}

export function getLanguageStatsPrefix(language: Language): string {
  switch (language) {
    case 'english':
      return 'English';
    case 'german':
      return 'German';
    default:
      return language;
  }
}
