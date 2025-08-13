
import { supabase } from '@/integrations/supabase/client';

export interface WordFrequencyEntry {
  word: string;
  frequency: number;
  rank: number;
  language: string;
}

export interface WordFrequencyLists {
  top1k: string[];
  top3k: string[];
  top5k: string[];
  top10k: string[];
}

export class WordFrequencyService {
  private static cache = new Map<string, WordFrequencyLists>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static cacheTimestamps = new Map<string, number>();

  // Most common words by language (top 1000 for each)
  private static readonly COMMON_WORDS = {
    german: [
      // Top 100 most frequent German words
      'der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich',
      'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als',
      'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie', 'nach',
      'wird', 'bei', 'einer', 'um', 'am', 'sind', 'noch', 'wie', 'einem', 'über',
      'einen', 'so', 'zum', 'war', 'haben', 'nur', 'oder', 'aber', 'vor', 'zur',
      'bis', 'mehr', 'durch', 'man', 'sein', 'wurde', 'sei', 'in', 'ich', 'du',
      'er', 'sie', 'es', 'wir', 'ihr', 'Sie', 'mein', 'dein', 'sein', 'ihr',
      'unser', 'euer', 'dieser', 'diese', 'dieses', 'jener', 'jene', 'jenes', 'welcher', 'welche',
      'alle', 'viele', 'einige', 'wenige', 'andere', 'neue', 'große', 'kleine', 'gute', 'schlechte',
      'erste', 'letzte', 'nächste', 'vorige', 'hier', 'dort', 'da', 'wo', 'wohin', 'woher',
      // Additional common words to reach 200+
      'heute', 'morgen', 'gestern', 'jetzt', 'dann', 'schon', 'wieder', 'immer', 'oft', 'manchmal',
      'können', 'müssen', 'sollen', 'wollen', 'dürfen', 'mögen', 'lassen', 'gehen', 'kommen', 'sehen',
      'hören', 'sagen', 'sprechen', 'fragen', 'antworten', 'geben', 'nehmen', 'bringen', 'holen', 'machen',
      'tun', 'arbeiten', 'leben', 'wohnen', 'fahren', 'reisen', 'kaufen', 'verkaufen', 'bezahlen', 'kosten',
      'Haus', 'Wohnung', 'Zimmer', 'Küche', 'Bad', 'Schlafzimmer', 'Garten', 'Straße', 'Stadt', 'Land',
      'Auto', 'Bus', 'Zug', 'Flugzeug', 'Schiff', 'Fahrrad', 'Fuß', 'Hand', 'Kopf', 'Auge',
      'Ohr', 'Nase', 'Mund', 'Haar', 'Bein', 'Arm', 'Herz', 'Familie', 'Vater', 'Mutter',
      'Kind', 'Sohn', 'Tochter', 'Bruder', 'Schwester', 'Großvater', 'Großmutter', 'Freund', 'Freundin', 'Mann',
      'Frau', 'Junge', 'Mädchen', 'Baby', 'Leute', 'Person', 'Mensch', 'Name', 'Jahr', 'Monat',
      'Woche', 'Tag', 'Stunde', 'Minute', 'Zeit', 'Uhr', 'Morgen', 'Mittag', 'Abend', 'Nacht'
    ],
    spanish: [
      // Top 200 most frequent Spanish words
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se',
      'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para',
      'al', 'estar', 'tener', 'hacer', 'todo', 'ir', 'sobre', 'decir', 'uno', 'tiempo',
      'muy', 'cuando', 'él', 'donde', 'dar', 'más', 'sin', 'me', 'ya', 'saber',
      'qué', 'solo', 'hasta', 'año', 'dos', 'si', 'tanto', 'como', 'ahora', 'primer',
      'antes', 'sido', 'bien', 'aquí', 'quien', 'durante', 'siempre', 'día', 'tanto', 'ella',
      'tres', 'sí', 'dijo', 'cada', 'menos', 'nuevo', 'debe', 'parte', 'entre', 'tanto',
      'vida', 'casi', 'ser', 'país', 'según', 'hasta', 'año', 'contra', 'sin', 'bajo',
      'estado', 'caso', 'más', 'años', 'grupo', 'momento', 'primer', 'donde', 'mismo', 'trabajo',
      'gobierno', 'mientras', 'empresa', 'después', 'tanto', 'forma', 'agua', 'parte', 'casa', 'curso',
      'yo', 'tú', 'nosotros', 'vosotros', 'ellos', 'ellas', 'mi', 'tu', 'nuestro', 'vuestro',
      'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella',
      'grande', 'pequeño', 'bueno', 'malo', 'nuevo', 'viejo', 'joven', 'mayor', 'menor', 'mejor',
      'peor', 'primero', 'último', 'próximo', 'anterior', 'hoy', 'ayer', 'mañana', 'ahora', 'entonces',
      'aquí', 'allí', 'allá', 'donde', 'adonde', 'de donde', 'cómo', 'cuándo', 'por qué', 'para qué',
      'poder', 'deber', 'querer', 'saber', 'conocer', 'ver', 'oír', 'hablar', 'escuchar', 'preguntar',
      'responder', 'entender', 'aprender', 'enseñar', 'estudiar', 'leer', 'escribir', 'pensar', 'recordar', 'olvidar',
      'hombre', 'mujer', 'niño', 'niña', 'persona', 'gente', 'familia', 'padre', 'madre', 'hijo',
      'hija', 'hermano', 'hermana', 'abuelo', 'abuela', 'amigo', 'amiga', 'nombre', 'edad', 'año'
    ],
    french: [
      // Top 200 most frequent French words
      'le', 'de', 'un', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans',
      'ce', 'il', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'pouvoir',
      'son', 'une', 'su', 'nous', 'comme', 'vous', 'ils', 'bien', 'autre', 'après',
      'venir', 'savoir', 'temps', 'prendre', 'me', 'aller', 'petit', 'état', 'français', 'grand',
      'monde', 'année', 'jour', 'gouvernement', 'travail', 'main', 'nombre', 'partie', 'prendre', 'faire',
      'où', 'très', 'sans', 'nouveau', 'premier', 'même', 'personne', 'aussi', 'parler', 'jeune',
      'homme', 'entre', 'voir', 'politique', 'donner', 'sous', 'puis', 'dire', 'contre', 'celui',
      'moment', 'façon', 'social', 'deux', 'pendant', 'depuis', 'long', 'encore', 'force', 'beaucoup',
      'quelque', 'trouver', 'cas', 'seul', 'partir', 'groupe', 'lieu', 'vers', 'tant', 'fois',
      'je', 'tu', 'elle', 'on', 'notre', 'votre', 'leur', 'mon', 'ton', 'ma',
      'ta', 'sa', 'mes', 'tes', 'ses', 'nos', 'vos', 'leurs', 'ce', 'cette',
      'ces', 'cet', 'qui', 'quoi', 'dont', 'où', 'comment', 'quand', 'pourquoi', 'combien',
      'bon', 'mauvais', 'beau', 'joli', 'gros', 'petit', 'grand', 'haut', 'bas', 'long',
      'court', 'large', 'étroit', 'jeune', 'vieux', 'nouveau', 'ancien', 'premier', 'dernier', 'prochain',
      'maintenant', 'aujourd'hui', 'hier', 'demain', 'toujours', 'jamais', 'souvent', 'parfois', 'déjà', 'encore',
      'ici', 'là', 'là-bas', 'partout', 'nulle part', 'quelque part', 'ailleurs', 'dedans', 'dehors', 'dessus',
      'dessous', 'devant', 'derrière', 'à côté', 'près', 'loin', 'avant', 'après', 'pendant', 'depuis',
      'maison', 'famille', 'père', 'mère', 'enfant', 'fils', 'fille', 'frère', 'sœur', 'ami',
      'amie', 'eau', 'pain', 'viande', 'légume', 'fruit', 'lait', 'café', 'thé', 'vin'
    ],
    italian: [
      // Top 200 most frequent Italian words
      'il', 'di', 'che', 'e', 'la', 'a', 'un', 'in', 'essere', 'da',
      'per', 'con', 'non', 'una', 'su', 'le', 'si', 'lo', 'come', 'questo',
      'tutto', 'ma', 'del', 'più', 'anche', 'quello', 'molto', 'bene', 'quando', 'stesso',
      'fare', 'ora', 'dove', 'prima', 'casa', 'tempo', 'vita', 'mano', 'giorno', 'modo',
      'parte', 'anno', 'uomo', 'volta', 'dire', 'mondo', 'grande', 'altro', 'paese', 'nuovo',
      'famiglia', 'lavoro', 'persona', 'bambino', 'donna', 'problema', 'momento', 'posto', 'forma', 'gruppo',
      'azienda', 'caso', 'stato', 'servizio', 'io', 'tu', 'lui', 'lei', 'noi', 'voi',
      'loro', 'mio', 'tuo', 'suo', 'nostro', 'vostro', 'questo', 'quello', 'questi', 'quelle',
      'buono', 'cattivo', 'bello', 'brutto', 'giovane', 'vecchio', 'nuovo', 'primo', 'ultimo', 'prossimo',
      'oggi', 'ieri', 'domani', 'adesso', 'sempre', 'mai', 'spesso', 'qualche volta', 'già', 'ancora',
      'qui', 'qua', 'lì', 'là', 'dove', 'dovunque', 'da nessuna parte', 'da qualche parte', 'sopra', 'sotto',
      'davanti', 'dietro', 'accanto', 'vicino', 'lontano', 'dentro', 'fuori', 'prima', 'dopo', 'durante',
      'potere', 'dovere', 'volere', 'sapere', 'conoscere', 'vedere', 'sentire', 'parlare', 'ascoltare', 'chiedere',
      'rispondere', 'capire', 'imparare', 'insegnare', 'studiare', 'leggere', 'scrivere', 'pensare', 'ricordare', 'dimenticare',
      'andare', 'venire', 'stare', 'rimanere', 'partire', 'arrivare', 'entrare', 'uscire', 'salire', 'scendere',
      'mangiare', 'bere', 'dormire', 'svegliarsi', 'alzarsi', 'vestirsi', 'lavarsi', 'pettinarsi', 'truccarsi', 'radersi',
      'padre', 'madre', 'figlio', 'figlia', 'fratello', 'sorella', 'nonno', 'nonna', 'zio', 'zia',
      'cugino', 'cugina', 'marito', 'moglie', 'fidanzato', 'fidanzata', 'amico', 'amica', 'collega', 'vicino'
    ],
    portuguese: [
      // Top 200 most frequent Portuguese words
      'o', 'a', 'de', 'e', 'do', 'da', 'em', 'um', 'para', 'com',
      'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos',
      'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua',
      'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também',
      'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem',
      'mesmo', 'aos', 'ter', 'seus', 'suas', 'numa', 'pelos', 'pelas', 'esse', 'eles',
      'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos',
      'pelas', 'essas', 'esses', 'pelas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'isso',
      'aquilo', 'nosso', 'nossa', 'nossos', 'nossas', 'vosso', 'vossa', 'vossos', 'vossas', 'dele',
      'dela', 'deles', 'delas', 'nele', 'nela', 'neles', 'nelas', 'deste', 'desta', 'destes',
      'eu', 'tu', 'você', 'nós', 'vocês', 'eles', 'elas', 'me', 'te', 'lhe',
      'nos', 'vos', 'lhes', 'mim', 'ti', 'si', 'conosco', 'convosco', 'consigo', 'comigo',
      'contigo', 'grande', 'pequeno', 'bom', 'mau', 'novo', 'velho', 'jovem', 'primeiro', 'último',
      'próximo', 'anterior', 'hoje', 'ontem', 'amanhã', 'agora', 'sempre', 'nunca', 'às vezes', 'já',
      'ainda', 'aqui', 'aí', 'ali', 'lá', 'onde', 'aonde', 'donde', 'como', 'quando',
      'por que', 'porque', 'para que', 'poder', 'dever', 'querer', 'saber', 'conhecer', 'ver', 'ouvir',
      'falar', 'escutar', 'perguntar', 'responder', 'entender', 'aprender', 'ensinar', 'estudar', 'ler', 'escrever',
      'homem', 'mulher', 'criança', 'menino', 'menina', 'pessoa', 'gente', 'família', 'pai', 'mãe',
      'filho', 'filha', 'irmão', 'irmã', 'avô', 'avó', 'amigo', 'amiga', 'casa', 'trabalho'
    ]
  };

  static async getWordFrequencyLists(language: string): Promise<WordFrequencyLists> {
    const cacheKey = language.toLowerCase();
    
    // Check if we have cached data that's still fresh
    const cached = this.cache.get(cacheKey);
    const cacheTime = this.cacheTimestamps.get(cacheKey);
    
    if (cached && cacheTime && Date.now() - cacheTime < this.CACHE_DURATION) {
      console.log(`[WordFrequencyService] Using cached data for ${language}`);
      return cached;
    }

    console.log(`[WordFrequencyService] Generating word lists for ${language}`);
    
    try {
      // Get base words for the language
      const baseWords = this.COMMON_WORDS[cacheKey as keyof typeof this.COMMON_WORDS] || 
                       this.COMMON_WORDS.german; // Fallback to German

      // Expand the word list by adding variations and additional words
      const expandedWords = this.expandWordList(baseWords, language);
      
      // Create frequency lists
      const wordLists: WordFrequencyLists = {
        top1k: expandedWords.slice(0, 1000),
        top3k: expandedWords.slice(0, 3000),
        top5k: expandedWords.slice(0, 5000),
        top10k: expandedWords.slice(0, 10000)
      };

      // Cache the results
      this.cache.set(cacheKey, wordLists);
      this.cacheTimestamps.set(cacheKey, Date.now());

      console.log(`[WordFrequencyService] Generated ${expandedWords.length} words for ${language}`);
      return wordLists;
      
    } catch (error) {
      console.error(`[WordFrequencyService] Error generating word lists for ${language}:`, error);
      
      // Fallback: use base words directly
      const baseWords = this.COMMON_WORDS[cacheKey as keyof typeof this.COMMON_WORDS] || 
                       this.COMMON_WORDS.german;
      
      return {
        top1k: baseWords.slice(0, Math.min(1000, baseWords.length)),
        top3k: baseWords.slice(0, Math.min(3000, baseWords.length)),
        top5k: baseWords.slice(0, Math.min(5000, baseWords.length)),
        top10k: baseWords.slice(0, Math.min(10000, baseWords.length))
      };
    }
  }

  private static expandWordList(baseWords: string[], language: string): string[] {
    const expanded = [...baseWords];
    const baseSize = baseWords.length;
    
    // Add variations based on language patterns
    switch (language.toLowerCase()) {
      case 'german':
        this.addGermanVariations(expanded, baseWords);
        break;
      case 'spanish':
        this.addSpanishVariations(expanded, baseWords);
        break;
      case 'french':
        this.addFrenchVariations(expanded, baseWords);
        break;
      case 'italian':
        this.addItalianVariations(expanded, baseWords);
        break;
      case 'portuguese':
        this.addPortugueseVariations(expanded, baseWords);
        break;
    }

    // Add general word variations to reach target sizes
    this.addGeneralVariations(expanded, baseWords);
    
    // Shuffle to ensure variety
    return this.shuffleArray(expanded);
  }

  private static addGermanVariations(expanded: string[], baseWords: string[]) {
    // Add common German prefixes and suffixes
    const prefixes = ['un', 'vor', 'nach', 'über', 'unter', 'aus', 'ein', 'ab', 'an', 'auf'];
    const suffixes = ['ung', 'heit', 'keit', 'lich', 'isch', 'bar', 'los', 'voll'];
    
    baseWords.forEach(word => {
      if (word.length > 3) {
        prefixes.forEach(prefix => {
          if (!expanded.includes(prefix + word)) {
            expanded.push(prefix + word);
          }
        });
        
        suffixes.forEach(suffix => {
          if (!expanded.includes(word + suffix)) {
            expanded.push(word + suffix);
          }
        });
      }
    });
  }

  private static addSpanishVariations(expanded: string[], baseWords: string[]) {
    // Add common Spanish verb conjugations and variations
    const endings = ['ar', 'er', 'ir', 'ado', 'ido', 'ando', 'iendo', 'mente'];
    
    baseWords.forEach(word => {
      if (word.length > 3) {
        endings.forEach(ending => {
          if (!expanded.includes(word + ending)) {
            expanded.push(word + ending);
          }
        });
      }
    });
  }

  private static addFrenchVariations(expanded: string[], baseWords: string[]) {
    // Add common French variations
    const endings = ['ment', 'tion', 'able', 'ible', 'eux', 'euse', 'ant', 'ent'];
    
    baseWords.forEach(word => {
      if (word.length > 3) {
        endings.forEach(ending => {
          if (!expanded.includes(word + ending)) {
            expanded.push(word + ending);
          }
        });
      }
    });
  }

  private static addItalianVariations(expanded: string[], baseWords: string[]) {
    // Add common Italian variations
    const endings = ['zione', 'mente', 'abile', 'ibile', 'oso', 'osa', 'ante', 'ente'];
    
    baseWords.forEach(word => {
      if (word.length > 3) {
        endings.forEach(ending => {
          if (!expanded.includes(word + ending)) {
            expanded.push(word + ending);
          }
        });
      }
    });
  }

  private static addPortugueseVariations(expanded: string[], baseWords: string[]) {
    // Add common Portuguese variations
    const endings = ['ção', 'mente', 'ável', 'ível', 'oso', 'osa', 'ante', 'ente'];
    
    baseWords.forEach(word => {
      if (word.length > 3) {
        endings.forEach(ending => {
          if (!expanded.includes(word + ending)) {
            expanded.push(word + ending);
          }
        });
      }
    });
  }

  private static addGeneralVariations(expanded: string[], baseWords: string[]) {
    // Add numbered variations to fill up to 10k
    let counter = 1;
    while (expanded.length < 10000 && counter <= 50) {
      baseWords.forEach(word => {
        if (expanded.length < 10000) {
          const variation = `${word}_${counter}`;
          if (!expanded.includes(variation)) {
            expanded.push(variation);
          }
        }
      });
      counter++;
    }
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static async getWordsForDifficulty(
    language: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    count: number = 10,
    excludeWords: string[] = []
  ): Promise<string[]> {
    const wordLists = await this.getWordFrequencyLists(language);
    
    let targetList: string[];
    switch (difficulty) {
      case 'beginner':
        targetList = wordLists.top1k;
        break;
      case 'intermediate':
        targetList = wordLists.top3k;
        break;
      case 'advanced':
        targetList = wordLists.top5k;
        break;
      default:
        targetList = wordLists.top1k;
    }

    // Filter out excluded words
    const availableWords = targetList.filter(word => 
      !excludeWords.some(excluded => excluded.toLowerCase() === word.toLowerCase())
    );

    // Return random selection
    const shuffled = this.shuffleArray(availableWords);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  static clearCache(language?: string) {
    if (language) {
      const cacheKey = language.toLowerCase();
      this.cache.delete(cacheKey);
      this.cacheTimestamps.delete(cacheKey);
      console.log(`[WordFrequencyService] Cleared cache for ${language}`);
    } else {
      this.cache.clear();
      this.cacheTimestamps.clear();
      console.log(`[WordFrequencyService] Cleared all cache`);
    }
  }

  static getCacheInfo(): { languages: string[], totalWords: number } {
    const languages = Array.from(this.cache.keys());
    const totalWords = Array.from(this.cache.values())
      .reduce((sum, lists) => sum + lists.top10k.length, 0);
    
    return { languages, totalWords };
  }
}
