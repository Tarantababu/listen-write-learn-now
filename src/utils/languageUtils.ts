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
    'English': '🇺🇸',
    'Spanish': '🇪🇸', 
    'French': '🇫🇷',
    'German': '🇩🇪',
    'Italian': '🇮🇹',
    'Portuguese': '🇵🇹',
    'Dutch': '🇳🇱',
    'Russian': '🇷🇺',
    'Chinese': '🇨🇳',
    'Japanese': '🇯🇵',
    'Korean': '🇰🇷',
    'Arabic': '🇸🇦',
    'Turkish': '🇹🇷',
    'Swedish': '🇸🇪',
    'Norwegian': '🇳🇴',
    'Danish': '🇩🇰',
    'Finnish': '🇫🇮',
    'Greek': '🇬🇷',
    'Polish': '🇵🇱',
    'Czech': '🇨🇿',
    'Hungarian': '🇭🇺',
    'Romanian': '🇷🇴',
    'Bulgarian': '🇧🇬',
    'Croatian': '🇭🇷',
    'Serbian': '🇷🇸',
    'Slovak': '🇸🇰',
    'Slovenian': '🇸🇮',
    'Estonian': '🇪🇪',
    'Latvian': '🇱🇻',
    'Lithuanian': '🇱🇹',
    'Ukrainian': '🇺🇦',
    'Belarusian': '🇧🇾',
    'Moldovan': '🇲🇩',
    'Albanian': '🇦🇱',
    'Macedonian': '🇲🇰',
    'Bosnian': '🇧🇦',
    'Montenegrin': '🇲🇪'
  };
  
  return flagMap[language] || '🌍';
}

/**
 * Gets the flag emoji code for a given language
 * @param language The language to get the flag code for
 * @returns Flag emoji code for the language
 */
export function getLanguageFlagCode(language: string): FlagIconCode {
  const flagCodeMap: Record<string, FlagIconCode> = {
    'English': 'US',
    'Spanish': 'ES', 
    'French': 'FR',
    'German': 'DE',
    'Italian': 'IT',
    'Portuguese': 'PT',
    'Dutch': 'NL',
    'Russian': 'RU',
    'Chinese': 'CN',
    'Japanese': 'JP',
    'Korean': 'KR',
    'Arabic': 'SA',
    'Turkish': 'TR',
    'Swedish': 'SE',
    'Norwegian': 'NO',
    'Danish': 'DK',
    'Finnish': 'FI',
    'Greek': 'GR',
    'Polish': 'PL',
    'Czech': 'CZ',
    'Hungarian': 'HU',
    'Romanian': 'RO',
    'Bulgarian': 'BG',
    'Croatian': 'HR',
    'Serbian': 'RS',
    'Slovak': 'SK',
    'Slovenian': 'SI',
    'Estonian': 'EE',
    'Latvian': 'LV',
    'Lithuanian': 'LT',
    'Ukrainian': 'UA',
    'Belarusian': 'BY',
    'Moldovan': 'MD',
    'Albanian': 'AL',
    'Macedonian': 'MK',
    'Bosnian': 'BA',
    'Montenegrin': 'ME'
  };
  
  return flagCodeMap[language] || 'US';
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
