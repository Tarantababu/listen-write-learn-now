
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
    // Umlauts using double colons (consistent pattern)
    { shortcut: 'a::', character: 'ä', description: 'a:: → ä' },
    { shortcut: 'o::', character: 'ö', description: 'o:: → ö' },
    { shortcut: 'u::', character: 'ü', description: 'u:: → ü' },
    { shortcut: 'A::', character: 'Ä', description: 'A:: → Ä' },
    { shortcut: 'O::', character: 'Ö', description: 'O:: → Ö' },
    { shortcut: 'U::', character: 'Ü', description: 'U:: → Ü' },
    // Eszett
    { shortcut: 'ss++', character: 'ß', description: 'ss++ → ß' },
    // Alternative shortcuts for compatibility
    { shortcut: 'a/', character: 'ä', description: 'a/ → ä' },
    { shortcut: 'o/', character: 'ö', description: 'o/ → ö' },
    { shortcut: 'u/', character: 'ü', description: 'u/ → ü' },
    { shortcut: 'A/', character: 'Ä', description: 'A/ → Ä' },
    { shortcut: 'O/', character: 'Ö', description: 'O/ → Ö' },
    { shortcut: 'U/', character: 'Ü', description: 'U/ → Ü' },
    // German quotation marks
    { shortcut: '<<', character: '„', description: '<< → „' },
    { shortcut: '>>', character: '"', description: '>> → "' }
  ],
  french: [
    // Grave accents
    { shortcut: 'a`', character: 'à', description: 'a` → à' },
    { shortcut: 'e`', character: 'è', description: 'e` → è' },
    { shortcut: 'u`', character: 'ù', description: 'u` → ù' },
    { shortcut: 'A`', character: 'À', description: 'A` → À' },
    { shortcut: 'E`', character: 'È', description: 'E` → È' },
    { shortcut: 'U`', character: 'Ù', description: 'U` → Ù' },
    // Acute accents
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
    // Circumflex
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
    // Diaeresis
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
    { shortcut: '>>', character: '»', description: '>> → »' },
    // Ligatures
    { shortcut: 'oe++', character: 'œ', description: 'oe++ → œ' },
    { shortcut: 'OE++', character: 'Œ', description: 'OE++ → Œ' },
    { shortcut: 'ae++', character: 'æ', description: 'ae++ → æ' },
    { shortcut: 'AE++', character: 'Æ', description: 'AE++ → Æ' }
  ],
  spanish: [
    // Acute accents
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
    { shortcut: '!!', character: '¡', description: '!! → ¡' },
    // Spanish quotation marks
    { shortcut: '<<', character: '«', description: '<< → «' },
    { shortcut: '>>', character: '»', description: '>> → »' }
  ],
  portuguese: [
    // Grave accents
    { shortcut: 'a`', character: 'à', description: 'a` → à' },
    { shortcut: 'A`', character: 'À', description: 'A` → À' },
    // Acute accents
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
    // Circumflex
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
    { shortcut: 'C,,', character: 'Ç', description: 'C,, → Ç' },
    // Portuguese quotation marks
    { shortcut: '<<', character: '«', description: '<< → «' },
    { shortcut: '>>', character: '»', description: '>> → »' }
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
    // Acute accents (conflict-free)
    { shortcut: 'e++', character: 'é', description: 'e++ → é' },
    { shortcut: 'i++', character: 'í', description: 'i++ → í' },
    { shortcut: 'o++', character: 'ó', description: 'o++ → ó' },
    { shortcut: 'u++', character: 'ú', description: 'u++ → ú' },
    { shortcut: 'E++', character: 'É', description: 'E++ → É' },
    { shortcut: 'I++', character: 'Í', description: 'I++ → Í' },
    { shortcut: 'O++', character: 'Ó', description: 'O++ → Ó' },
    { shortcut: 'U++', character: 'Ú', description: 'U++ → Ú' },
    // Italian quotation marks
    { shortcut: '<<', character: '«', description: '<< → «' },
    { shortcut: '>>', character: '»', description: '>> → »' }
  ],
  dutch: [
    // Diaeresis
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
    // Dutch IJ ligature
    { shortcut: 'ij++', character: 'ĳ', description: 'ij++ → ĳ' },
    { shortcut: 'IJ++', character: 'Ĳ', description: 'IJ++ → Ĳ' },
    // Dutch quotation marks
    { shortcut: '<<', character: '„', description: '<< → „' },
    { shortcut: '>>', character: '"', description: '>> → "' }
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
  swedish: [
    // Swedish specific characters
    { shortcut: 'a::', character: 'ä', description: 'a:: → ä' },
    { shortcut: 'a^^', character: 'å', description: 'a^^ → å' },
    { shortcut: 'o::', character: 'ö', description: 'o:: → ö' },
    { shortcut: 'A::', character: 'Ä', description: 'A:: → Ä' },
    { shortcut: 'A^^', character: 'Å', description: 'A^^ → Å' },
    { shortcut: 'O::', character: 'Ö', description: 'O:: → Ö' },
    // Alternative shortcuts
    { shortcut: 'aa', character: 'å', description: 'aa → å' },
    { shortcut: 'AA', character: 'Å', description: 'AA → Å' }
  ],
  norwegian: [
    // Norwegian specific characters
    { shortcut: 'a::', character: 'ä', description: 'a:: → ä' },
    { shortcut: 'a^^', character: 'å', description: 'a^^ → å' },
    { shortcut: 'o::', character: 'ö', description: 'o:: → ö' },
    { shortcut: 'o/', character: 'ø', description: 'o/ → ø' },
    { shortcut: 'ae++', character: 'æ', description: 'ae++ → æ' },
    { shortcut: 'A::', character: 'Ä', description: 'A:: → Ä' },
    { shortcut: 'A^^', character: 'Å', description: 'A^^ → Å' },
    { shortcut: 'O::', character: 'Ö', description: 'O:: → Ö' },
    { shortcut: 'O/', character: 'Ø', description: 'O/ → Ø' },
    { shortcut: 'AE++', character: 'Æ', description: 'AE++ → Æ' },
    // Alternative shortcuts
    { shortcut: 'aa', character: 'å', description: 'aa → å' },
    { shortcut: 'AA', character: 'Å', description: 'AA → Å' }
  ],
  danish: [
    // Danish specific characters
    { shortcut: 'a^^', character: 'å', description: 'a^^ → å' },
    { shortcut: 'o/', character: 'ø', description: 'o/ → ø' },
    { shortcut: 'ae++', character: 'æ', description: 'ae++ → æ' },
    { shortcut: 'A^^', character: 'Å', description: 'A^^ → Å' },
    { shortcut: 'O/', character: 'Ø', description: 'O/ → Ø' },
    { shortcut: 'AE++', character: 'Æ', description: 'AE++ → Æ' },
    // Alternative shortcuts
    { shortcut: 'aa', character: 'å', description: 'aa → å' },
    { shortcut: 'AA', character: 'Å', description: 'AA → Å' }
  ],
  finnish: [
    // Finnish specific characters
    { shortcut: 'a::', character: 'ä', description: 'a:: → ä' },
    { shortcut: 'o::', character: 'ö', description: 'o:: → ö' },
    { shortcut: 'A::', character: 'Ä', description: 'A:: → Ä' },
    { shortcut: 'O::', character: 'Ö', description: 'O:: → Ö' }
  ],
  icelandic: [
    // Icelandic specific characters
    { shortcut: 'a++', character: 'á', description: 'a++ → á' },
    { shortcut: 'e++', character: 'é', description: 'e++ → é' },
    { shortcut: 'i++', character: 'í', description: 'i++ → í' },
    { shortcut: 'o++', character: 'ó', description: 'o++ → ó' },
    { shortcut: 'u++', character: 'ú', description: 'u++ → ú' },
    { shortcut: 'y++', character: 'ý', description: 'y++ → ý' },
    { shortcut: 'ae++', character: 'æ', description: 'ae++ → æ' },
    { shortcut: 'o/', character: 'ø', description: 'o/ → ø' },
    { shortcut: 'd/', character: 'ð', description: 'd/ → ð' },
    { shortcut: 'th++', character: 'þ', description: 'th++ → þ' },
    { shortcut: 'A++', character: 'Á', description: 'A++ → Á' },
    { shortcut: 'E++', character: 'É', description: 'E++ → É' },
    { shortcut: 'I++', character: 'Í', description: 'I++ → Í' },
    { shortcut: 'O++', character: 'Ó', description: 'O++ → Ó' },
    { shortcut: 'U++', character: 'Ú', description: 'U++ → Ú' },
    { shortcut: 'Y++', character: 'Ý', description: 'Y++ → Ý' },
    { shortcut: 'AE++', character: 'Æ', description: 'AE++ → Æ' },
    { shortcut: 'O/', character: 'Ø', description: 'O/ → Ø' },
    { shortcut: 'D/', character: 'Ð', description: 'D/ → Ð' },
    { shortcut: 'TH++', character: 'Þ', description: 'TH++ → Þ' }
  ],
  russian: [
    // Cyrillic letters with common shortcuts
    { shortcut: 'a++', character: 'а', description: 'a++ → а' },
    { shortcut: 'b++', character: 'б', description: 'b++ → б' },
    { shortcut: 'v++', character: 'в', description: 'v++ → в' },
    { shortcut: 'g++', character: 'г', description: 'g++ → г' },
    { shortcut: 'd++', character: 'д', description: 'd++ → д' },
    { shortcut: 'e++', character: 'е', description: 'e++ → е' },
    { shortcut: 'yo++', character: 'ё', description: 'yo++ → ё' },
    { shortcut: 'zh++', character: 'ж', description: 'zh++ → ж' },
    { shortcut: 'z++', character: 'з', description: 'z++ → з' },
    { shortcut: 'i++', character: 'и', description: 'i++ → и' },
    { shortcut: 'j++', character: 'й', description: 'j++ → й' },
    { shortcut: 'k++', character: 'к', description: 'k++ → к' },
    { shortcut: 'l++', character: 'л', description: 'l++ → л' },
    { shortcut: 'm++', character: 'м', description: 'm++ → м' },
    { shortcut: 'n++', character: 'н', description: 'n++ → н' },
    { shortcut: 'o++', character: 'о', description: 'o++ → о' },
    { shortcut: 'p++', character: 'п', description: 'p++ → п' },
    { shortcut: 'r++', character: 'р', description: 'r++ → р' },
    { shortcut: 's++', character: 'с', description: 's++ → с' },
    { shortcut: 't++', character: 'т', description: 't++ → т' },
    { shortcut: 'u++', character: 'у', description: 'u++ → у' },
    { shortcut: 'f++', character: 'ф', description: 'f++ → ф' },
    { shortcut: 'h++', character: 'х', description: 'h++ → х' },
    { shortcut: 'c++', character: 'ц', description: 'c++ → ц' },
    { shortcut: 'ch++', character: 'ч', description: 'ch++ → ч' },
    { shortcut: 'sh++', character: 'ш', description: 'sh++ → ш' },
    { shortcut: 'sch++', character: 'щ', description: 'sch++ → щ' },
    { shortcut: 'y++', character: 'ы', description: 'y++ → ы' },
    { shortcut: 'eh++', character: 'э', description: 'eh++ → э' },
    { shortcut: 'yu++', character: 'ю', description: 'yu++ → ю' },
    { shortcut: 'ya++', character: 'я', description: 'ya++ → я' },
    // Soft and hard signs
    { shortcut: 'sb++', character: 'ь', description: 'sb++ → ь' },
    { shortcut: 'hb++', character: 'ъ', description: 'hb++ → ъ' },
    // Russian quotation marks
    { shortcut: '<<', character: '«', description: '<< → «' },
    { shortcut: '>>', character: '»', description: '>> → »' }
  ],
  polish: [
    // Polish diacritics
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
    { shortcut: 'Z,,', character: 'Ż', description: 'Z,, → Ż' },
    // Polish quotation marks
    { shortcut: '<<', character: '„', description: '<< → „' },
    { shortcut: '>>', character: '"', description: '>> → "' }
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
    { shortcut: 'z++', character: 'ž', description: 'z++ → ž' },
    { shortcut: 'A++', character: 'Á', description: 'A++ → Á' },
    { shortcut: 'C++', character: 'Č', description: 'C++ → Č' },
    { shortcut: 'D++', character: 'Ď', description: 'D++ → Ď' },
    { shortcut: 'E++', character: 'É', description: 'E++ → É' },
    { shortcut: 'E^^', character: 'Ě', description: 'E^^ → Ě' },
    { shortcut: 'I++', character: 'Í', description: 'I++ → Í' },
    { shortcut: 'N++', character: 'Ň', description: 'N++ → Ň' },
    { shortcut: 'O++', character: 'Ó', description: 'O++ → Ó' },
    { shortcut: 'R++', character: 'Ř', description: 'R++ → Ř' },
    { shortcut: 'S++', character: 'Š', description: 'S++ → Š' },
    { shortcut: 'T++', character: 'Ť', description: 'T++ → Ť' },
    { shortcut: 'U++', character: 'Ú', description: 'U++ → Ú' },
    { shortcut: 'U::', character: 'Ů', description: 'U:: → Ů' },
    { shortcut: 'Y++', character: 'Ý', description: 'Y++ → Ý' },
    { shortcut: 'Z++', character: 'Ž', description: 'Z++ → Ž' },
    // Czech quotation marks
    { shortcut: '<<', character: '„', description: '<< → „' },
    { shortcut: '>>', character: '"', description: '>> → "' }
  ],
  slovak: [
    // Slovak diacritics
    { shortcut: 'a++', character: 'á', description: 'a++ → á' },
    { shortcut: 'c++', character: 'č', description: 'c++ → č' },
    { shortcut: 'd++', character: 'ď', description: 'd++ → ď' },
    { shortcut: 'e++', character: 'é', description: 'e++ → é' },
    { shortcut: 'i++', character: 'í', description: 'i++ → í' },
    { shortcut: 'l++', character: 'ľ', description: 'l++ → ľ' },
    { shortcut: 'l^^', character: 'ĺ', description: 'l^^ → ĺ' },
    { shortcut: 'n++', character: 'ň', description: 'n++ → ň' },
    { shortcut: 'o++', character: 'ó', description: 'o++ → ó' },
    { shortcut: 'o^^', character: 'ô', description: 'o^^ → ô' },
    { shortcut: 'r++', character: 'ř', description: 'r++ → ř' },
    { shortcut: 'r^^', character: 'ŕ', description: 'r^^ → ŕ' },
    { shortcut: 's++', character: 'š', description: 's++ → š' },
    { shortcut: 't++', character: 'ť', description: 't++ → ť' },
    { shortcut: 'u++', character: 'ú', description: 'u++ → ú' },
    { shortcut: 'y++', character: 'ý', description: 'y++ → ý' },
    { shortcut: 'z++', character: 'ž', description: 'z++ → ž' },
    { shortcut: 'A++', character: 'Á', description: 'A++ → Á' },
    { shortcut: 'C++', character: 'Č', description: 'C++ → Č' },
    { shortcut: 'D++', character: 'Ď', description: 'D++ → Ď' },
    { shortcut: 'E++', character: 'É', description: 'E++ → É' },
    { shortcut: 'I++', character: 'Í', description: 'I++ → Í' },
    { shortcut: 'L++', character: 'Ľ', description: 'L++ → Ľ' },
    { shortcut: 'L^^', character: 'Ĺ', description: 'L^^ → Ĺ' },
    { shortcut: 'N++', character: 'Ň', description: 'N++ → Ň' },
    { shortcut: 'O++', character: 'Ó', description: 'O++ → Ó' },
    { shortcut: 'O^^', character: 'Ô', description: 'O^^ → Ô' },
    { shortcut: 'R++', character: 'Ř', description: 'R++ → Ř' },
    { shortcut: 'R^^', character: 'Ŕ', description: 'R^^ → Ŕ' },
    { shortcut: 'S++', character: 'Š', description: 'S++ → Š' },
    { shortcut: 'T++', character: 'Ť', description: 'T++ → Ť' },
    { shortcut: 'U++', character: 'Ú', description: 'U++ → Ú' },
    { shortcut: 'Y++', character: 'Ý', description: 'Y++ → Ý' },
    { shortcut: 'Z++', character: 'Ž', description: 'Z++ → Ž' }
  ],
  hungarian: [
    // Hungarian diacritics
    { shortcut: 'a++', character: 'á', description: 'a++ → á' },
    { shortcut: 'e++', character: 'é', description: 'e++ → é' },
    { shortcut: 'i++', character: 'í', description: 'i++ → í' },
    { shortcut: 'o++', character: 'ó', description: 'o++ → ó' },
    { shortcut: 'o::', character: 'ö', description: 'o:: → ö' },
    { shortcut: 'o^^', character: 'ő', description: 'o^^ → ő' },
    { shortcut: 'u++', character: 'ú', description: 'u++ → ú' },
    { shortcut: 'u::', character: 'ü', description: 'u:: → ü' },
    { shortcut: 'u^^', character: 'ű', description: 'u^^ → ű' },
    { shortcut: 'A++', character: 'Á', description: 'A++ → Á' },
    { shortcut: 'E++', character: 'É', description: 'E++ → É' },
    { shortcut: 'I++', character: 'Í', description: 'I++ → Í' },
    { shortcut: 'O++', character: 'Ó', description: 'O++ → Ó' },
    { shortcut: 'O::', character: 'Ö', description: 'O:: → Ö' },
    { shortcut: 'O^^', character: 'Ő', description: 'O^^ → Ő' },
    { shortcut: 'U++', character: 'Ú', description: 'U++ → Ú' },
    { shortcut: 'U::', character: 'Ü', description: 'U:: → Ü' },
    { shortcut: 'U^^', character: 'Ű', description: 'U^^ → Ű' },
    // Hungarian quotation marks
    { shortcut: '<<', character: '„', description: '<< → „' },
    { shortcut: '>>', character: '"', description: '>> → "' }
  ],
  romanian: [
    // Romanian diacritics
    { shortcut: 'a^^', character: 'â', description: 'a^^ → â' },
    { shortcut: 'a,,', character: 'ă', description: 'a,, → ă' },
    { shortcut: 'i^^', character: 'î', description: 'i^^ → î' },
    { shortcut: 's,,', character: 'ș', description: 's,, → ș' },
    { shortcut: 't,,', character: 'ț', description: 't,, → ț' },
    { shortcut: 'A^^', character: 'Â', description: 'A^^ → Â' },
    { shortcut: 'A,,', character: 'Ă', description: 'A,, → Ă' },
    { shortcut: 'I^^', character: 'Î', description: 'I^^ → Î' },
    { shortcut: 'S,,', character: 'Ș', description: 'S,, → Ș' },
    { shortcut: 'T,,', character: 'Ț', description: 'T,, → Ț' },
    // Romanian quotation marks
    { shortcut: '<<', character: '„', description: '<< → „' },
    { shortcut: '>>', character: '"', description: '>> → "' }
  ],
  chinese: [
    // Chinese quotation marks
    { shortcut: '<<', character: '"', description: '<< → "' },
    { shortcut: '>>', character: '"', description: '>> → "' },
    { shortcut: '"1', character: ''', description: '"1 → '' },
    { shortcut: '"2', character: ''', description: '"2 → '' },
    // Chinese punctuation
    { shortcut: ',,', character: '，', description: ',, → ，' },
    { shortcut: '..', character: '。', description: '.. → 。' },
    { shortcut: '??', character: '？', description: '?? → ？' },
    { shortcut: '!!', character: '！', description: '!! → ！' },
    { shortcut: '::' , character: '：', description: ':: → ：' },
    { shortcut: ';;', character: '；', description: ';; → ；' },
    // Chinese parentheses
    { shortcut: '((', character: '（', description: '(( → （' },
    { shortcut: '))', character: '）', description: ')) → ）' }
  ],
  japanese: [
    // Japanese quotation marks
    { shortcut: '<<', character: '「', description: '<< → 「' },
    { shortcut: '>>', character: '」', description: '>> → 」' },
    { shortcut: '<<<', character: '『', description: '<<< → 『' },
    { shortcut: '>>>', character: '』', description: '>>> → 』' },
    // Japanese punctuation
    { shortcut: ',,', character: '、', description: ',, → 、' },
    { shortcut: '..', character: '。', description: '.. → 。' },
    // Japanese symbols
    { shortcut: '~~', character: '〜', description: '~~ → 〜' },
    { shortcut: '**', character: '※', description: '** → ※' }
  ],
  korean: [
    // Korean quotation marks
    { shortcut: '<<', character: '「', description: '<< → 「' },
    { shortcut: '>>', character: '」', description: '>> → 」' },
    // Korean punctuation
    { shortcut: ',,', character: '，', description: ',, → ，' },
    { shortcut: '..', character: '。', description: '.. → 。' }
  ],
  arabic: [
    // Arabic diacritics
    { shortcut: 'a++', character: 'َ', description: 'a++ → fatha' },
    { shortcut: 'i++', character: 'ِ', description: 'i++ → kasra' },
    { shortcut: 'u++', character: 'ُ', description: 'u++ → damma' },
    { shortcut: 'an++', character: 'ً', description: 'an++ → tanween fath' },
    { shortcut: 'in++', character: 'ٍ', description: 'in++ → tanween kasr' },
    { shortcut: 'un++', character: 'ٌ', description: 'un++ → tanween damm' },
    { shortcut: 'o++', character: 'ْ', description: 'o++ → sukun' },
    { shortcut: 's++', character: 'ّ', description: 's++ → shadda' },
    // Arabic punctuation
    { shortcut: '??', character: '؟', description: '?? → ؟' },
    { shortcut: ',,', character: '،', description: ',, → ،' },
    { shortcut: ';;', character: '؛', description: ';; → ؛' },
    // Arabic quotation marks
    { shortcut: '<<', character: '«', description: '<< → «' },
    { shortcut: '>>', character: '»', description: '>> → »' }
  ],
  english: [
    // English quotation marks and symbols (for consistency)
    { shortcut: '<<', character: '"', description: '<< → "' },
    { shortcut: '>>', character: '"', description: '>> → "' },
    { shortcut: "'1", character: ''', description: "'1 → '" },
    { shortcut: "'2", character: ''', description: "'2 → '" },
    // Common symbols
    { shortcut: '..', character: '…', description: '.. → …' },
    { shortcut: '--', character: '—', description: '-- → —' },
    { shortcut: '+-', character: '±', description: '+- → ±' },
    { shortcut: '<<', character: '«', description: '<< → «' },
    { shortcut: '>>', character: '»', description: '>> → »' }
  ]
};

export function getLanguageShortcuts(language: string): SpecialCharacterShortcut[] {
  const normalizedLanguage = language.toLowerCase();
  
  // Handle language key mappings
  const languageMap: Record<string, string> = {
    'mandarin': 'chinese',
    'simplified chinese': 'chinese',
    'traditional chinese': 'chinese'
  };
  
  const mappedLanguage = languageMap[normalizedLanguage] || normalizedLanguage;
  return languageShortcuts[mappedLanguage] || [];
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
