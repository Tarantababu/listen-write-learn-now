
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
    { shortcut: 'a/', character: 'ä', description: 'a/ → ä' },
    { shortcut: 'o/', character: 'ö', description: 'o/ → ö' },
    { shortcut: 'u/', character: 'ü', description: 'u/ → ü' },
    { shortcut: 'A/', character: 'Ä', description: 'A/ → Ä' },
    { shortcut: 'O/', character: 'Ö', description: 'O/ → Ö' },
    { shortcut: 'U/', character: 'Ü', description: 'U/ → Ü' },
    { shortcut: 'B/', character: 'ß', description: 'B/ → ß' },
    { shortcut: 's/', character: 'ß', description: 's/ → ß' }
  ],
  french: [
    { shortcut: 'a`', character: 'à', description: 'a` → à' },
    { shortcut: "a'", character: 'á', description: "a' → á" },
    { shortcut: 'a^', character: 'â', description: 'a^ → â' },
    { shortcut: 'e`', character: 'è', description: 'e` → è' },
    { shortcut: "e'", character: 'é', description: "e' → é" },
    { shortcut: 'e^', character: 'ê', description: 'e^ → ê' },
    { shortcut: 'e:', character: 'ë', description: 'e: → ë' },
    { shortcut: 'i^', character: 'î', description: 'i^ → î' },
    { shortcut: 'i:', character: 'ï', description: 'i: → ï' },
    { shortcut: 'o^', character: 'ô', description: 'o^ → ô' },
    { shortcut: 'u`', character: 'ù', description: 'u` → ù' },
    { shortcut: 'u^', character: 'û', description: 'u^ → û' },
    { shortcut: 'u:', character: 'ü', description: 'u: → ü' },
    { shortcut: 'c,', character: 'ç', description: 'c, → ç' },
    { shortcut: 'C,', character: 'Ç', description: 'C, → Ç' }
  ],
  spanish: [
    { shortcut: 'a`', character: 'á', description: 'a` → á' },
    { shortcut: 'e`', character: 'é', description: 'e` → é' },
    { shortcut: 'i`', character: 'í', description: 'i` → í' },
    { shortcut: 'o`', character: 'ó', description: 'o` → ó' },
    { shortcut: 'u`', character: 'ú', description: 'u` → ú' },
    { shortcut: 'A`', character: 'Á', description: 'A` → Á' },
    { shortcut: 'E`', character: 'É', description: 'E` → É' },
    { shortcut: 'I`', character: 'Í', description: 'I` → Í' },
    { shortcut: 'O`', character: 'Ó', description: 'O` → Ó' },
    { shortcut: 'U`', character: 'Ú', description: 'U` → Ú' },
    { shortcut: 'n~', character: 'ñ', description: 'n~ → ñ' },
    { shortcut: 'N~', character: 'Ñ', description: 'N~ → Ñ' },
    { shortcut: 'u:', character: 'ü', description: 'u: → ü' },
    { shortcut: 'U:', character: 'Ü', description: 'U: → Ü' }
  ],
  portuguese: [
    { shortcut: 'a`', character: 'à', description: 'a` → à' },
    { shortcut: "a'", character: 'á', description: "a' → á" },
    { shortcut: 'a^', character: 'â', description: 'a^ → â' },
    { shortcut: 'a~', character: 'ã', description: 'a~ → ã' },
    { shortcut: "e'", character: 'é', description: "e' → é" },
    { shortcut: 'e^', character: 'ê', description: 'e^ → ê' },
    { shortcut: "i'", character: 'í', description: "i' → í" },
    { shortcut: "o'", character: 'ó', description: "o' → ó" },
    { shortcut: 'o^', character: 'ô', description: 'o^ → ô' },
    { shortcut: 'o~', character: 'õ', description: 'o~ → õ' },
    { shortcut: "u'", character: 'ú', description: "u' → ú" },
    { shortcut: 'c,', character: 'ç', description: 'c, → ç' },
    { shortcut: 'C,', character: 'Ç', description: 'C, → Ç' }
  ],
  italian: [
    { shortcut: 'a`', character: 'à', description: 'a` → à' },
    { shortcut: 'e`', character: 'è', description: 'e` → è' },
    { shortcut: "e'", character: 'é', description: "e' → é" },
    { shortcut: 'i`', character: 'ì', description: 'i` → ì' },
    { shortcut: "i'", character: 'í', description: "i' → í" },
    { shortcut: 'o`', character: 'ò', description: 'o` → ò' },
    { shortcut: "o'", character: 'ó', description: "o' → ó" },
    { shortcut: 'u`', character: 'ù', description: 'u` → ù' },
    { shortcut: "u'", character: 'ú', description: "u' → ú" }
  ],
  dutch: [
    { shortcut: 'a:', character: 'ä', description: 'a: → ä' },
    { shortcut: 'e:', character: 'ë', description: 'e: → ë' },
    { shortcut: 'i:', character: 'ï', description: 'i: → ï' },
    { shortcut: 'o:', character: 'ö', description: 'o: → ö' },
    { shortcut: 'u:', character: 'ü', description: 'u: → ü' },
    { shortcut: 'A:', character: 'Ä', description: 'A: → Ä' },
    { shortcut: 'E:', character: 'Ë', description: 'E: → Ë' },
    { shortcut: 'I:', character: 'Ï', description: 'I: → Ï' },
    { shortcut: 'O:', character: 'Ö', description: 'O: → Ö' },
    { shortcut: 'U:', character: 'Ü', description: 'U: → Ü' }
  ],
  turkish: [
    { shortcut: 'c,', character: 'ç', description: 'c, → ç' },
    { shortcut: 'C,', character: 'Ç', description: 'C, → Ç' },
    { shortcut: 'g^', character: 'ğ', description: 'g^ → ğ' },
    { shortcut: 'G^', character: 'Ğ', description: 'G^ → Ğ' },
    { shortcut: 'i.', character: 'ı', description: 'i. → ı' },
    { shortcut: 'I.', character: 'İ', description: 'I. → İ' },
    { shortcut: 'o:', character: 'ö', description: 'o: → ö' },
    { shortcut: 'O:', character: 'Ö', description: 'O: → Ö' },
    { shortcut: 's,', character: 'ş', description: 's, → ş' },
    { shortcut: 'S,', character: 'Ş', description: 'S, → Ş' },
    { shortcut: 'u:', character: 'ü', description: 'u: → ü' },
    { shortcut: 'U:', character: 'Ü', description: 'U: → Ü' }
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
