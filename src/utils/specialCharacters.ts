export interface SpecialCharacterShortcut {
  shortcut: string;
  character: string;
  description: string;
}

export interface LanguageShortcuts {
  [language: string]: SpecialCharacterShortcut[];
}

export const languageShortcuts: LanguageShortcuts = {
  german: [
    // Umlauts using double letters (more intuitive)
    { shortcut: 'aa', character: 'ä', description: 'aa → ä' },
    { shortcut: 'oo', character: 'ö', description: 'oo → ö' },
    { shortcut: 'uu', character: 'ü', description: 'uu → ü' },
    { shortcut: 'AA', character: 'Ä', description: 'AA → Ä' },
    { shortcut: 'OO', character: 'Ö', description: 'OO → Ö' },
    { shortcut: 'UU', character: 'Ü', description: 'UU → Ü' },
    // Eszett using ss+ or sz
    { shortcut: 'ss+', character: 'ß', description: 'ss+ → ß' },
    { shortcut: 'sz', character: 'ß', description: 'sz → ß' },
    // Alternative slash shortcuts for compatibility
    { shortcut: 'a/', character: 'ä', description: 'a/ → ä' },
    { shortcut: 'o/', character: 'ö', description: 'o/ → ö' },
    { shortcut: 'u/', character: 'ü', description: 'u/ → ü' },
    { shortcut: 'A/', character: 'Ä', description: 'A/ → Ä' },
    { shortcut: 'O/', character: 'Ö', description: 'O/ → Ö' },
    { shortcut: 'U/', character: 'Ü', description: 'U/ → Ü' }
  ],
  french: [
    // Grave accents (using `)
    { shortcut: 'a`', character: 'à', description: 'a` → à' },
    { shortcut: 'e`', character: 'è', description: 'e` → è' },
    { shortcut: 'u`', character: 'ù', description: 'u` → ù' },
    { shortcut: 'A`', character: 'À', description: 'A` → À' },
    { shortcut: 'E`', character: 'È', description: 'E` → È' },
    { shortcut: 'U`', character: 'Ù', description: 'U` → Ù' },
    // Acute accents (using ++)
    { shortcut: 'a++', character: 'á', description: 'a++ → á' },
    { shortcut: 'e++', character: 'é', description: 'e++ → é' },
    { shortcut: 'i++', character: 'í', description: 'i++ → í' },
    { shortcut: 'o++', character: 'ó', description: 'o++ → ó' },
    { shortcut: 'u++', character: 'ú', description: 'u++ → ú' },
    { shortcut: 'A++', character: 'Á', description: 'A++ → Á' },
    { shortcut: 'E++', character: 'É', description: 'E++ → É' },
    { shortcut: 'I++', character: 'Í', description: 'I++ → Í' },
    { shortcut: 'O++', character: 'Ó', description: 'O++ → Ó' },
    { shortcut: 'U++', character: 'Ú', description: 'U++ → Ú' },
    // Circumflex (using ^^)
    { shortcut: 'a^^', character: 'â', description: 'a^^ → â' },
    { shortcut: 'e^^', character: 'ê', description: 'e^^ → ê' },
    { shortcut: 'i^^', character: 'î', description: 'i^^ → î' },
    { shortcut: 'o^^', character: 'ô', description: 'o^^ → ô' },
    { shortcut: 'u^^', character: 'û', description: 'u^^ → û' },
    { shortcut: 'A^^', character: 'Â', description: 'A^^ → Â' },
    { shortcut: 'E^^', character: 'Ê', description: 'E^^ → Ê' },
    { shortcut: 'I^^', character: 'Î', description: 'I^^ → Î' },
    { shortcut: 'O^^', character: 'Ô', description: 'O^^ → Ô' },
    { shortcut: 'U^^', character: 'Û', description: 'U^^ → Û' },
    // Diaeresis (using ::)
    { shortcut: 'e::', character: 'ë', description: 'e:: → ë' },
    { shortcut: 'i::', character: 'ï', description: 'i:: → ï' },
    { shortcut: 'u::', character: 'ü', description: 'u:: → ü' },
    { shortcut: 'y::', character: 'ÿ', description: 'y:: → ÿ' },
    { shortcut: 'E::', character: 'Ë', description: 'E:: → Ë' },
    { shortcut: 'I::', character: 'Ï', description: 'I:: → Ï' },
    { shortcut: 'U::', character: 'Ü', description: 'U:: → Ü' },
    { shortcut: 'Y::', character: 'Ÿ', description: 'Y:: → Ÿ' },
    // Cedilla
    { shortcut: 'c,,', character: 'ç', description: 'c,, → ç' },
    { shortcut: 'C,,', character: 'Ç', description: 'C,, → Ç' },
    // French quotation marks
    { shortcut: '<<', character: '«', description: '<< → «' },
    { shortcut: '>>', character: '»', description: '>> → »' }
  ],
  spanish: [
    // Acute accents (using ++)
    { shortcut: 'a++', character: 'á', description: 'a++ → á' },
    { shortcut: 'e++', character: 'é', description: 'e++ → é' },
    { shortcut: 'i++', character: 'í', description: 'i++ → í' },
    { shortcut: 'o++', character: 'ó', description: 'o++ → ó' },
    { shortcut: 'u++', character: 'ú', description: 'u++ → ú' },
    { shortcut: 'A++', character: 'Á', description: 'A++ → Á' },
    { shortcut: 'E++', character: 'É', description: 'E++ → É' },
    { shortcut: 'I++', character: 'Í', description: 'I++ → Í' },
    { shortcut: 'O++', character: 'Ó', description: 'O++ → Ó' },
    { shortcut: 'U++', character: 'Ú', description: 'U++ → Ú' },
    // Tilde
    { shortcut: 'n~~', character: 'ñ', description: 'n~~ → ñ' },
    { shortcut: 'N~~', character: 'Ñ', description: 'N~~ → Ñ' },
    // Diaeresis
    { shortcut: 'u::', character: 'ü', description: 'u:: → ü' },
    { shortcut: 'U::', character: 'Ü', description: 'U:: → Ü' },
    // Inverted punctuation
    { shortcut: '??', character: '¿', description: '?? → ¿' },
    { shortcut: '!!', character: '¡', description: '!! → ¡' }
  ],
  portuguese: [
    // Grave accents
    { shortcut: 'a`', character: 'à', description: 'a` → à' },
    { shortcut: 'A`', character: 'À', description: 'A` → À' },
    // Acute accents (using ++)
    { shortcut: 'a++', character: 'á', description: 'a++ → á' },
    { shortcut: 'e++', character: 'é', description: 'e++ → é' },
    { shortcut: 'i++', character: 'í', description: 'i++ → í' },
    { shortcut: 'o++', character: 'ó', description: 'o++ → ó' },
    { shortcut: 'u++', character: 'ú', description: 'u++ → ú' },
    { shortcut: 'A++', character: 'Á', description: 'A++ → Á' },
    { shortcut: 'E++', character: 'É', description: 'E++ → É' },
    { shortcut: 'I++', character: 'Í', description: 'I++ → Í' },
    { shortcut: 'O++', character: 'Ó', description: 'O++ → Ó' },
    { shortcut: 'U++', character: 'Ú', description: 'U++ → Ú' },
    // Circumflex (using ^^)
    { shortcut: 'a^^', character: 'â', description: 'a^^ → â' },
    { shortcut: 'e^^', character: 'ê', description: 'e^^ → ê' },
    { shortcut: 'i^^', character: 'î', description: 'i^^ → î' },
    { shortcut: 'o^^', character: 'ô', description: 'o^^ → ô' },
    { shortcut: 'u^^', character: 'û', description: 'u^^ → û' },
    { shortcut: 'A^^', character: 'Â', description: 'A^^ → Â' },
    { shortcut: 'E^^', character: 'Ê', description: 'E^^ → Ê' },
    { shortcut: 'I^^', character: 'Î', description: 'I^^ → Î' },
    { shortcut: 'O^^', character: 'Ô', description: 'O^^ → Ô' },
    { shortcut: 'U^^', character: 'Û', description: 'U^^ → Û' },
    // Tilde
    { shortcut: 'a~~', character: 'ã', description: 'a~~ → ã' },
    { shortcut: 'o~~', character: 'õ', description: 'o~~ → õ' },
    { shortcut: 'A~~', character: 'Ã', description: 'A~~ → Ã' },
    { shortcut: 'O~~', character: 'Õ', description: 'O~~ → Õ' },
    // Cedilla
    { shortcut: 'c,,', character: 'ç', description: 'c,, → ç' },
    { shortcut: 'C,,', character: 'Ç', description: 'C,, → Ç' }
  ],
  italian: [
    // Grave accents (most common in Italian)
    { shortcut: 'a`', character: 'à', description: 'a` → à' },
    { shortcut: 'e`', character: 'è', description: 'e` → è' },
    { shortcut: 'i`', character: 'ì', description: 'i` → ì' },
    { shortcut: 'o`', character: 'ò', description: 'o` → ò' },
    { shortcut: 'u`', character: 'ù', description: 'u` → ù' },
    { shortcut: 'A`', character: 'À', description: 'A` → À' },
    { shortcut: 'E`', character: 'È', description: 'E` → È' },
    { shortcut: 'I`', character: 'Ì', description: 'I` → Ì' },
    { shortcut: 'O`', character: 'Ò', description: 'O` → Ò' },
    { shortcut: 'U`', character: 'Ù', description: 'U` → Ù' },
    // Acute accents (using ++ to avoid conflicts)
    { shortcut: 'e++', character: 'é', description: 'e++ → é' },
    { shortcut: 'i++', character: 'í', description: 'i++ → í' },
    { shortcut: 'o++', character: 'ó', description: 'o++ → ó' },
    { shortcut: 'u++', character: 'ú', description: 'u++ → ú' },
    { shortcut: 'E++', character: 'É', description: 'E++ → É' },
    { shortcut: 'I++', character: 'Í', description: 'I++ → Í' },
    { shortcut: 'O++', character: 'Ó', description: 'O++ → Ó' },
    { shortcut: 'U++', character: 'Ú', description: 'U++ → Ú' }
  ],
  dutch: [
    // Diaeresis (using ::)
    { shortcut: 'a::', character: 'ä', description: 'a:: → ä' },
    { shortcut: 'e::', character: 'ë', description: 'e:: → ë' },
    { shortcut: 'i::', character: 'ï', description: 'i:: → ï' },
    { shortcut: 'o::', character: 'ö', description: 'o:: → ö' },
    { shortcut: 'u::', character: 'ü', description: 'u:: → ü' },
    { shortcut: 'A::', character: 'Ä', description: 'A:: → Ä' },
    { shortcut: 'E::', character: 'Ë', description: 'E:: → Ë' },
    { shortcut: 'I::', character: 'Ï', description: 'I:: → Ï' },
    { shortcut: 'O::', character: 'Ö', description: 'O:: → Ö' },
    { shortcut: 'U::', character: 'Ü', description: 'U:: → Ü' },
    // Dutch quotation marks
    { shortcut: '""', character: '„', description: '"" → „' }
  ],
  turkish: [
    // Cedilla
    { shortcut: 'c,,', character: 'ç', description: 'c,, → ç' },
    { shortcut: 'C,,', character: 'Ç', description: 'C,, → Ç' },
    { shortcut: 's,,', character: 'ş', description: 's,, → ş' },
    { shortcut: 'S,,', character: 'Ş', description: 'S,, → Ş' },
    // Breve
    { shortcut: 'g^^', character: 'ğ', description: 'g^^ → ğ' },
    { shortcut: 'G^^', character: 'Ğ', description: 'G^^ → Ğ' },
    // Dotless i and dotted I
    { shortcut: 'i..', character: 'ı', description: 'i.. → ı' },
    { shortcut: 'I..', character: 'İ', description: 'I.. → İ' },
    // Diaeresis
    { shortcut: 'o::', character: 'ö', description: 'o:: → ö' },
    { shortcut: 'u::', character: 'ü', description: 'u:: → ü' },
    { shortcut: 'O::', character: 'Ö', description: 'O:: → Ö' },
    { shortcut: 'U::', character: 'Ü', description: 'U:: → Ü' }
  ],
  // Adding more languages with common special characters
  mandarin: [
    // Chinese quotation marks
    { shortcut: '""', character: '"', description: '"" → "' },
    { shortcut: "''", character: '’', description: "'' → '" },
    // Chinese punctuation
    { shortcut: ',,', character: '，', description: ',, → ，' },
    { shortcut: '..', character: '。', description: '.. → 。' },
    { shortcut: '??', character: '？', description: '?? → ？' },
    { shortcut: '!!', character: '！', description: '!! → ！' }
  ],
  japanese: [
    // Japanese quotation marks
    { shortcut: '""', character: '「', description: '"" → 「' },
    { shortcut: '""""', character: '」', description: '"""" → 」' },
    // Japanese punctuation
    { shortcut: ',,', character: '、', description: ',, → 、' },
    { shortcut: '..', character: '。', description: '.. → 。' }
  ],
  korean: [
    // Korean quotation marks
    { shortcut: '""', character: '「', description: '"" → 「' },
    { shortcut: '""""', character: '」', description: '"""" → 」' }
  ],
  russian: [
    // Russian quotation marks
    { shortcut: '<<', character: '«', description: '<< → «' },
    { shortcut: '>>', character: '»', description: '>> → »' },
    // Cyrillic soft and hard signs (common shortcuts)
    { shortcut: 'b++', character: 'ь', description: 'b++ → ь' },
    { shortcut: 'B++', character: 'Ь', description: 'B++ → Ь' },
    { shortcut: 'bb', character: 'ъ', description: 'bb → ъ' },
    { shortcut: 'BB', character: 'Ъ', description: 'BB → Ъ' }
  ],
  polish: [
    // Polish diacritics using ++
    { shortcut: 'a++', character: 'ą', description: 'a++ → ą' },
    { shortcut: 'c++', character: 'ć', description: 'c++ → ć' },
    { shortcut: 'e++', character: 'ę', description: 'e++ → ę' },
    { shortcut: 'l++', character: 'ł', description: 'l++ → ł' },
    { shortcut: 'n++', character: 'ń', description: 'n++ → ń' },
    { shortcut: 'o++', character: 'ó', description: 'o++ → ó' },
    { shortcut: 's++', character: 'ś', description: 's++ → ś' },
    { shortcut: 'z++', character: 'ź', description: 'z++ → ź' },
    { shortcut: 'z,,', character: 'ż', description: 'z,, → ż' },
    { shortcut: 'A++', character: 'Ą', description: 'A++ → Ą' },
    { shortcut: 'C++', character: 'Ć', description: 'C++ → Ć' },
    { shortcut: 'E++', character: 'Ę', description: 'E++ → Ę' },
    { shortcut: 'L++', character: 'Ł', description: 'L++ → Ł' },
    { shortcut: 'N++', character: 'Ń', description: 'N++ → Ń' },
    { shortcut: 'O++', character: 'Ó', description: 'O++ → Ó' },
    { shortcut: 'S++', character: 'Ś', description: 'S++ → Ś' },
    { shortcut: 'Z++', character: 'Ź', description: 'Z++ → Ź' },
    { shortcut: 'Z,,', character: 'Ż', description: 'Z,, → Ż' }
  ],
  czech: [
    // Czech diacritics
    { shortcut: 'a++', character: 'á', description: 'a++ → á' },
    { shortcut: 'c++', character: 'č', description: 'c++ → č' },
    { shortcut: 'd++', character: 'ď', description: 'd++ → ď' },
    { shortcut: 'e++', character: 'é', description: 'e++ → é' },
    { shortcut: 'e^^', character: 'ě', description: 'e^^ → ě' },
    { shortcut: 'i++', character: 'í', description: 'i++ → í' },
    { shortcut: 'n++', character: 'ň', description: 'n++ → ň' },
    { shortcut: 'o++', character: 'ó', description: 'o++ → ó' },
    { shortcut: 'r++', character: 'ř', description: 'r++ → ř' },
    { shortcut: 's++', character: 'š', description: 's++ → š' },
    { shortcut: 't++', character: 'ť', description: 't++ → ť' },
    { shortcut: 'u++', character: 'ú', description: 'u++ → ú' },
    { shortcut: 'u::', character: 'ů', description: 'u:: → ů' },
    { shortcut: 'y++', character: 'ý', description: 'y++ → ý' },
    { shortcut: 'z++', character: 'ž', description: 'z++ → ž' }
  ]
};

export function getLanguageShortcuts(language: string): SpecialCharacterShortcut[] {
  return languageShortcuts[language.toLowerCase()] || [];
}

export function applyShortcuts(text: string, shortcuts: SpecialCharacterShortcut[]): string {
  let result = text;
  
  // Sort shortcuts by length (descending) to handle longer shortcuts first
  const sortedShortcuts = shortcuts.sort((a, b) => b.shortcut.length - a.shortcut.length);
  
  for (const { shortcut, character } of sortedShortcuts) {
    // Replace all occurrences of the shortcut with the special character
    result = result.replace(new RegExp(escapeRegExp(shortcut), 'g'), character);
  }
  
  return result;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
