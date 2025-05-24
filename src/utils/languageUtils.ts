import { Language } from '@/types';
import { FlagIconCode } from 'react-flag-kit';

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
  const flagMap: Record<string, string> = {
    'english': '🇺🇸',
    'spanish': '🇪🇸', 
    'french': '🇫🇷',
    'german': '🇩🇪',
    'italian': '🇮🇹',
    'portuguese': '🇵🇹',
    'dutch': '🇳🇱',
    'russian': '🇷🇺',
    'chinese': '🇨🇳',
    'japanese': '🇯🇵',
    'korean': '🇰🇷',
    'arabic': '🇸🇦',
    'turkish': '🇹🇷',
    'swedish': '🇸🇪',
    'norwegian': '🇳🇴',
    'danish': '🇩🇰',
    'finnish': '🇫🇮',
    'greek': '🇬🇷',
    'polish': '🇵🇱',
    'czech': '🇨🇿',
    'hungarian': '🇭🇺',
    'romanian': '🇷🇴',
    'bulgarian': '🇧🇬',
    'croatian': '🇭🇷',
    'serbian': '🇷🇸',
    'slovak': '🇸🇰',
    'slovenian': '🇸🇮',
    'estonian': '🇪🇪',
    'latvian': '🇱🇻',
    'lithuanian': '🇱🇹',
    'ukrainian': '🇺🇦',
    'belarusian': '🇧🇾',
    'moldovan': '🇲🇩',
    'albanian': '🇦🇱',
    'macedonian': '🇲🇰',
    'bosnian': '🇧🇦',
    'montenegrin': '🇲🇪'
  };
  
  return flagMap[language.toLowerCase()] || '🌍';
}

/**
 * Gets the flag icon code for a given language (for use with react-flag-kit)
 * @param language The language to get the flag code for
 * @returns Flag icon code for the language
 */
export function getLanguageFlagCode(language: string): FlagIconCode {
  const flagCodeMap: Record<string, FlagIconCode> = {
    'english': 'US',
    'spanish': 'ES', 
    'french': 'FR',
    'german': 'DE',
    'italian': 'IT',
    'portuguese': 'PT',
    'dutch': 'NL',
    'russian': 'RU',
    'chinese': 'CN',
    'japanese': 'JP',
    'korean': 'KR',
    'arabic': 'SA',
    'turkish': 'TR',
    'swedish': 'SE',
    'norwegian': 'NO',
    'danish': 'DK',
    'finnish': 'FI',
    'greek': 'GR',
    'polish': 'PL',
    'czech': 'CZ',
    'hungarian': 'HU',
    'romanian': 'RO',
    'bulgarian': 'BG',
    'croatian': 'HR',
    'serbian': 'RS',
    'slovak': 'SK',
    'slovenian': 'SI',
    'estonian': 'EE',
    'latvian': 'LV',
    'lithuanian': 'LT',
    'ukrainian': 'UA',
    'belarusian': 'BY',
    'moldovan': 'MD',
    'albanian': 'AL',
    'macedonian': 'MK',
    'bosnian': 'BA',
    'montenegrin': 'ME'
  };
  
  return flagCodeMap[language.toLowerCase()] || 'US';
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

/**
 * Gets the display name for a given language code
 * @param code The language code to get the display name for
 * @returns Display name for the language code
 */
export function getLanguageDisplayName(code: string): string {
  const languages: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'nl': 'Dutch',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'tr': 'Turkish',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'el': 'Greek',
    'pl': 'Polish',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'bg': 'Bulgarian',
    'hr': 'Croatian',
    'sr': 'Serbian',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'et': 'Estonian',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'uk': 'Ukrainian',
    'be': 'Belarusian',
    'md': 'Moldovan',
    'sq': 'Albanian',
    'mk': 'Macedonian',
    'bs': 'Bosnian',
    'me': 'Montenegrin'
  };
  
  return languages[code] || code;
}

/**
 * Gets the language code for a given display name
 * @param displayName The language display name to get the code for
 * @returns Language code for the display name
 */
export function getLanguageCode(displayName: string): string {
  const codes: Record<string, string> = {
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Dutch': 'nl',
    'Russian': 'ru',
    'Chinese': 'zh',
    'Japanese': 'ja',
    'Korean': 'ko',
    'Arabic': 'ar',
    'Turkish': 'tr',
    'Swedish': 'sv',
    'Norwegian': 'no',
    'Danish': 'da',
    'Finnish': 'fi',
    'Greek': 'el',
    'Polish': 'pl',
    'Czech': 'cs',
    'Hungarian': 'hu',
    'Romanian': 'ro',
    'Bulgarian': 'bg',
    'Croatian': 'hr',
    'Serbian': 'sr',
    'Slovak': 'sk',
    'Slovenian': 'sl',
    'Estonian': 'et',
    'Latvian': 'lv',
    'Lithuanian': 'lt',
    'Ukrainian': 'uk',
    'Belarusian': 'be',
    'Moldovan': 'md',
    'Albanian': 'sq',
    'Macedonian': 'mk',
    'Bosnian': 'bs',
    'Montenegrin': 'me'
  };
  
  return codes[displayName] || displayName.toLowerCase();
}
