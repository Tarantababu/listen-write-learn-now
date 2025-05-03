
import { Language } from '@/types';

export function getLanguageFlag(language: Language): string {
  switch (language) {
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
    default:
      return language;
  }
}
