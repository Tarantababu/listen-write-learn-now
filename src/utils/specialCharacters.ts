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
    // Umlauts using double colons (most distinctive)
    { shortcut: 'a::', character: 'ä', description: 'a:: → ä' },
    { shortcut: 'o::', character: 'ö', description: 'o:: → ö' },
    { shortcut: 'u::', character: 'ü', description: 'u:: → ü' },
    { shortcut: 'A::', character: 'Ä', description: 'A:: → Ä' },
    { shortcut: 'O::', character: 'Ö', description: 'O:: → Ö' },
    { shortcut: 'U::', character: 'Ü', description: 'U:: → Ü' },
    // Alternative double letter shortcuts
    { shortcut: 'ae+', character: 'ä', description: 'ae+ → ä' },
    { shortcut: 'oe+', character: 'ö', description: 'oe+ → ö' },
    { shortcut: 'ue+', character: 'ü', description: 'ue+ → ü' },
    { shortcut: 'Ae+', character: 'Ä', description: 'Ae+ → Ä' },
    { shortcut: 'Oe+', character: 'Ö', description: 'Oe+ → Ö' },
    { shortcut: 'Ue+', character: 'Ü', description: 'Ue+ → Ü' },
    // Eszett - only ss+ (removed sz to avoid conflicts)
    { shortcut: 'ss+', character: 'ß', description: 'ss+ → ß' },
    // Fallback slash shortcuts
    { shortcut: 'a/', character: 'ä', description: 'a/ → ä' },
    { shortcut: 'o/', character: 'ö', description: 'o/ → ö' },
    { shortcut: 'u/', character: 'ü', description: 'u/ → ü' },
    { shortcut: 'A/', character: 'Ä', description: 'A/ → Ä' },
    { shortcut: 'O/', character: 'Ö', description: 'O/ → Ö' },
    { shortcut: 'U/', character: 'Ü', description: 'U/ → Ü' },
    { shortcut: 's/', character: 'ß', description: 's/ → ß' }
  ],
  french: [
    // Grave accents (using `)
    { shortcut: 'a`', character: 'à', description: 'a` → à' },
    { shortcut: 'e`', character: 'è', description: 'e` → è' },
    { shortcut: 'u`', character: 'ù', description: 'u` → ù' },
    { shortcut: 'A`', character: 'À', description: 'A` → À' },
    { shortcut: 'E`', character: 'È', description: 'E` → È' },
    { shortcut: 'U`', character: 'Ù', description: 'U` → Ù' },
    // Acute accents (using +)
    { shortcut: 'a+', character: 'á', description: 'a+ → á' },
    { shortcut: 'e+', character: 'é', description: 'e+ → é' },
    { shortcut: 'i+', character: 'í', description: 'i+ → í' },
    { shortcut: 'o+', character: 'ó', description: 'o+ → ó' },
    { shortcut: 'u+', character: 'ú', description: 'u+ → ú' },
    { shortcut: 'A+', character: 'Á', description: 'A+ → Á' },
    { shortcut: 'E+', character: 'É', description: 'E+ → É' },
    { shortcut: 'I+', character: 'Í', description: 'I+ → Í' },
    { shortcut: 'O+', character: 'Ó', description: 'O+ → Ó' },
    { shortcut: 'U+', character: 'Ú', description: 'U+ → Ú' },
    // Circumflex (using ^)
    { shortcut: 'a^', character: 'â', description: 'a^ → â' },
    { shortcut: 'e^', character: 'ê', description: 'e^ → ê' },
    { shortcut: 'i^', character: 'î', description: 'i^ → î' },
    { shortcut: 'o^', character: 'ô', description: 'o^ → ô' },
    { shortcut: 'u^', character: 'û', description: 'u^ → û' },
    { shortcut: 'A^', character: 'Â', description: 'A^ → Â' },
    { shortcut: 'E^', character: 'Ê', description: 'E^ → Ê' },
    { shortcut: 'I^', character: 'Î', description: 'I^ → Î' },
    { shortcut: 'O^', character: 'Ô', description: 'O^ → Ô' },
    { shortcut: 'U^', character: 'Û', description: 'U^ → Û' },
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
    { shortcut: 'c,', character: 'ç', description: 'c, → ç' },
    { shortcut: 'C,', character: 'Ç', description: 'C, → Ç' },
    // French quotation marks
    { shortcut: '<<', character: '«', description: '<< → «' },
    { shortcut: '>>', character: '»', description: '>> → »' }
  ],
  spanish: [
    // Acute accents (using +)
    { shortcut: 'a+', character: 'á', description: 'a+ → á' },
    { shortcut: 'e+', character: 'é', description: 'e+ → é' },
    { shortcut: 'i+', character: 'í', description: 'i+ → í' },
    { shortcut: 'o+', character: 'ó', description: 'o+ → ó' },
    { shortcut: 'u+', character: 'ú', description: 'u+ → ú' },
    { shortcut: 'A+', character: 'Á', description: 'A+ → Á' },
    { shortcut: 'E+', character: 'É', description: 'E+ → É' },
    { shortcut: 'I+', character: 'Í', description: 'I+ → Í' },
    { shortcut: 'O+', character: 'Ó', description: 'O+ → Ó' },
    { shortcut: 'U+', character: 'Ú', description: 'U+ → Ú' },
    // Tilde
    { shortcut: 'n~', character: 'ñ', description: 'n~ → ñ' },
    { shortcut: 'N~', character: 'Ñ', description: 'N~ → Ñ' },
    // Diaeresis
    { shortcut: 'u::', character: 'ü', description: 'u:: → ü' },
    { shortcut: 'U::', character: 'Ü', description: 'U:: → Ü' },
    // Inverted punctuation
    { shortcut: '?+', character: '¿', description: '?+ → ¿' },
    { shortcut: '!+', character: '¡', description: '!+ → ¡' }
  ],
  portuguese: [
    // Grave accents
    { shortcut: 'a`', character: 'à', description: 'a` → à' },
    { shortcut: 'A`', character: 'À', description: 'A` → À' },
    // Acute accents (using +)
    { shortcut: 'a+', character: 'á', description: 'a+ → á' },
    { shortcut: 'e+', character: 'é', description: 'e+ → é' },
    { shortcut: 'i+', character: 'í', description: 'i+ → í' },
    { shortcut: 'o+', character: 'ó', description: 'o+ → ó' },
    { shortcut: 'u+', character: 'ú', description: 'u+ → ú' },
    { shortcut: 'A+', character: 'Á', description: 'A+ → Á' },
    { shortcut: 'E+', character: 'É', description: 'E+ → É' },
    { shortcut: 'I+', character: 'Í', description: 'I+ → Í' },
    { shortcut: 'O+', character: 'Ó', description: 'O+ → Ó' },
    { shortcut: 'U+', character: 'Ú', description: 'U+ → Ú' },
    // Circumflex (using ^)
    { shortcut: 'a^', character: 'â', description: 'a^ → â' },
    { shortcut: 'e^', character: 'ê', description: 'e^ → ê' },
    { shortcut: 'i^', character: 'î', description: 'i^ → î' },
    { shortcut: 'o^', character: 'ô', description: 'o^ → ô' },
    { shortcut: 'u^', character: 'û', description: 'u^ → û' },
    { shortcut: 'A^', character: 'Â', description: 'A^ → Â' },
    { shortcut: 'E^', character: 'Ê', description: 'E^ → Ê' },
    { shortcut: 'I^', character: 'Î', description: 'I^ → Î' },
    { shortcut: 'O^', character: 'Ô', description: 'O^ → Ô' },
    { shortcut: 'U^', character: 'Û', description: 'U^ → Û' },
    // Tilde
    { shortcut: 'a~', character: 'ã', description: 'a~ → ã' },
    { shortcut: 'o~', character: 'õ', description: 'o~ → õ' },
    { shortcut: 'A~', character: 'Ã', description: 'A~ → Ã' },
    { shortcut: 'O~', character: 'Õ', description: 'O~ → Õ' },
    // Cedilla
    { shortcut: 'c,', character: 'ç', description: 'c, → ç' },
    { shortcut: 'C,', character: 'Ç', description: 'C, → Ç' }
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
    // Acute accents (using +)
    { shortcut: 'e+', character: 'é', description: 'e+ → é' },
    { shortcut: 'i+', character: 'í', description: 'i+ → í' },
    { shortcut: 'o+', character: 'ó', description: 'o+ → ó' },
    { shortcut: 'u+', character: 'ú', description: 'u+ → ú' },
    { shortcut: 'E+', character: 'É', description: 'E+ → É' },
    { shortcut: 'I+', character: 'Í', description: 'I+ → Í' },
    { shortcut: 'O+', character: 'Ó', description: 'O+ → Ó' },
    { shortcut: 'U+', character: 'Ú', description: 'U+ → Ú' }
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
    // IJ ligature
    { shortcut: 'ij+', character: 'ĳ', description: 'ij+ → ĳ' },
    { shortcut: 'IJ+', character: 'Ĳ', description: 'IJ+ → Ĳ' }
  ],
  turkish: [
    // Cedilla
    { shortcut: 'c,', character: 'ç', description: 'c, → ç' },
    { shortcut: 'C,', character: 'Ç', description: 'C, → Ç' },
    { shortcut: 's,', character: 'ş', description: 's, → ş' },
    { shortcut: 'S,', character: 'Ş', description: 'S, → Ş' },
    // Breve
    { shortcut: 'g^', character: 'ğ', description: 'g^ → ğ' },
    { shortcut: 'G^', character: 'Ğ', description: 'G^ → Ğ' },
    // Dotless i and dotted I
    { shortcut: 'i-', character: 'ı', description: 'i- → ı' },
    { shortcut: 'I+', character: 'İ', description: 'I+ → İ' },
    // Diaeresis
    { shortcut: 'o::', character: 'ö', description: 'o:: → ö' },
    { shortcut: 'u::', character: 'ü', description: 'u:: → ü' },
    { shortcut: 'O::', character: 'Ö', description: 'O:: → Ö' },
    { shortcut: 'U::', character: 'Ü', description: 'U:: → Ü' }
  ],
  polish: [
    // Polish diacritics using + (cleaner than ++)
    { shortcut: 'a+', character: 'ą', description: 'a+ → ą' },
    { shortcut: 'c+', character: 'ć', description: 'c+ → ć' },
    { shortcut: 'e+', character: 'ę', description: 'e+ → ę' },
    { shortcut: 'l+', character: 'ł', description: 'l+ → ł' },
    { shortcut: 'n+', character: 'ń', description: 'n+ → ń' },
    { shortcut: 'o+', character: 'ó', description: 'o+ → ó' },
    { shortcut: 's+', character: 'ś', description: 's+ → ś' },
    { shortcut: 'z+', character: 'ź', description: 'z+ → ź' },
    { shortcut: 'z.', character: 'ż', description: 'z. → ż' },
    { shortcut: 'A+', character: 'Ą', description: 'A+ → Ą' },
    { shortcut: 'C+', character: 'Ć', description: 'C+ → Ć' },
    { shortcut: 'E+', character: 'Ę', description: 'E+ → Ę' },
    { shortcut: 'L+', character: 'Ł', description: 'L+ → Ł' },
    { shortcut: 'N+', character: 'Ń', description: 'N+ → Ń' },
    { shortcut: 'O+', character: 'Ó', description: 'O+ → Ó' },
    { shortcut: 'S+', character: 'Ś', description: 'S+ → Ś' },
    { shortcut: 'Z+', character: 'Ź', description: 'Z+ → Ź' },
    { shortcut: 'Z.', character: 'Ż', description: 'Z. → Ż' }
  ],
  czech: [
    // Czech diacritics using + for consistency
    { shortcut: 'a+', character: 'á', description: 'a+ → á' },
    { shortcut: 'c+', character: 'č', description: 'c+ → č' },
    { shortcut: 'd+', character: 'ď', description: 'd+ → ď' },
    { shortcut: 'e+', character: 'é', description: 'e+ → é' },
    { shortcut: 'e^', character: 'ě', description: 'e^ → ě' },
    { shortcut: 'i+', character: 'í', description: 'i+ → í' },
    { shortcut: 'n+', character: 'ň', description: 'n+ → ň' },
    { shortcut: 'o+', character: 'ó', description: 'o+ → ó' },
    { shortcut: 'r+', character: 'ř', description: 'r+ → ř' },
    { shortcut: 's+', character: 'š', description: 's+ → š' },
    { shortcut: 't+', character: 'ť', description: 't+ → ť' },
    { shortcut: 'u+', character: 'ú', description: 'u+ → ú' },
    { shortcut: 'u::', character: 'ů', description: 'u:: → ů' },
    { shortcut: 'y+', character: 'ý', description: 'y+ → ý' },
    { shortcut: 'z+', character: 'ž', description: 'z+ → ž' },
    // Uppercase variants
    { shortcut: 'A+', character: 'Á', description: 'A+ → Á' },
    { shortcut: 'C+', character: 'Č', description: 'C+ → Č' },
    { shortcut: 'D+', character: 'Ď', description: 'D+ → Ď' },
    { shortcut: 'E+', character: 'É', description: 'E+ → É' },
    { shortcut: 'E^', character: 'Ě', description: 'E^ → Ě' },
    { shortcut: 'I+', character: 'Í', description: 'I+ → Í' },
    { shortcut: 'N+', character: 'Ň', description: 'N+ → Ň' },
    { shortcut: 'O+', character: 'Ó', description: 'O+ → Ó' },
    { shortcut: 'R+', character: 'Ř', description: 'R+ → Ř' },
    { shortcut: 'S+', character: 'Š', description: 'S+ → Š' },
    { shortcut: 'T+', character: 'Ť', description: 'T+ → Ť' },
    { shortcut: 'U+', character: 'Ú', description: 'U+ → Ú' },
    { shortcut: 'U::', character: 'Ů', description: 'U:: → Ů' },
    { shortcut: 'Y+', character: 'Ý', description: 'Y+ → Ý' },
    { shortcut: 'Z+', character: 'Ž', description: 'Z+ → Ž' }
  ],
  mandarin: [
    // Chinese quotation marks (using distinctive shortcuts)
    { shortcut: 'q+', character: '"', description: 'q+ → "' },
    { shortcut: 'Q+', character: '"', description: 'Q+ → "' },
    { shortcut: "q'", character: "'", description: "q' → '" },
    { shortcut: "Q'", character: "'", description: "Q' → '" },
    // Chinese punctuation
    { shortcut: ',+', character: '，', description: ',+ → ，' },
    { shortcut: '.+', character: '。', description: '.+ → 。' },
    { shortcut: '?+', character: '？', description: '?+ → ？' },
    { shortcut: '!+', character: '！', description: '!+ → ！' },
    { shortcut: ':+', character: '：', description: ':+ → ：' },
    { shortcut: ';+', character: '；', description: ';+ → ；' }
  ],
  japanese: [
    // Japanese quotation marks
    { shortcut: 'q+', character: '「', description: 'q+ → 「' },
    { shortcut: 'Q+', character: '」', description: 'Q+ → 」' },
    // Japanese punctuation
    { shortcut: ',+', character: '、', description: ',+ → 、' },
    { shortcut: '.+', character: '。', description: '.+ → 。' },
    { shortcut: '-+', character: 'ー', description: '-+ → ー' }
  ],
  korean: [
    // Korean quotation marks
    { shortcut: 'q+', character: '「', description: 'q+ → 「' },
    { shortcut: 'Q+', character: '」', description: 'Q+ → 」' }
  ],
  russian: [
    // Russian quotation marks
    { shortcut: '<<', character: '«', description: '<< → «' },
    { shortcut: '>>', character: '»', description: '>> → »' },
    // Cyrillic soft and hard signs
    { shortcut: 'b+', character: 'ь', description: 'b+ → ь' },
    { shortcut: 'B+', character: 'Ь', description: 'B+ → Ь' },
    { shortcut: 'bb', character: 'ъ', description: 'bb → ъ' },
    { shortcut: 'BB', character: 'Ъ', description: 'BB → Ъ' }
  ],
  swedish: [
    // Swedish specific characters
    { shortcut: 'a::', character: 'ä', description: 'a:: → ä' },
    { shortcut: 'o::', character: 'ö', description: 'o:: → ö' },
    { shortcut: 'a+', character: 'å', description: 'a+ → å' },
    { shortcut: 'A::', character: 'Ä', description: 'A:: → Ä' },
    { shortcut: 'O::', character: 'Ö', description: 'O:: → Ö' },
    { shortcut: 'A+', character: 'Å', description: 'A+ → Å' }
  ],
  norwegian: [
    // Norwegian specific characters
    { shortcut: 'a::', character: 'ä', description: 'a:: → ä' },
    { shortcut: 'o::', character: 'ö', description: 'o:: → ö' },
    { shortcut: 'a+', character: 'å', description: 'a+ → å' },
    { shortcut: 'o/', character: 'ø', description: 'o/ → ø' },
    { shortcut: 'ae+', character: 'æ', description: 'ae+ → æ' },
    { shortcut: 'A::', character: 'Ä', description: 'A:: → Ä' },
    { shortcut: 'O::', character: 'Ö', description: 'O:: → Ö' },
    { shortcut: 'A+', character: 'Å', description: 'A+ → Å' },
    { shortcut: 'O/', character: 'Ø', description: 'O/ → Ø' },
    { shortcut: 'AE+', character: 'Æ', description: 'AE+ → Æ' }
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
