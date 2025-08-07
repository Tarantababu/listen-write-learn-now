
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';

export interface WordPoolEntry {
  word: string;
  frequency: number;
  difficulty: number;
  contexts: string[];
  lastUsed?: Date;
  masteryLevel: number;
  priority: number;
}

export interface WordPoolStats {
  totalWords: number;
  availableWords: number;
  coolingDownWords: number;
  masteredWords: number;
  averageDifficulty: number;
}

export class IntelligentWordPoolManager {
  private static readonly LANGUAGE_WORD_POOLS = {
    beginner: {
      german: ['der', 'die', 'das', 'und', 'ich', 'du', 'er', 'sie', 'es', 'haben', 'sein', 'werden', 'können', 'müssen', 'wollen', 'gehen', 'kommen', 'sehen', 'sagen', 'machen', 'gut', 'groß', 'neu', 'alt', 'jung', 'schön', 'klein', 'lang', 'kurz', 'hoch', 'Haus', 'Auto', 'Hund', 'Katze', 'Kind', 'Mann', 'Frau', 'Tag', 'Nacht', 'Zeit', 'Wasser', 'Brot', 'Milch', 'Käse', 'Apfel', 'Buch', 'Tisch', 'Stuhl', 'Bett', 'Zimmer', 'Schule', 'Arbeit', 'Freund', 'Familie', 'Mutter', 'Vater', 'Bruder', 'Schwester', 'Geld', 'Jahr', 'Monat', 'Woche', 'heute', 'morgen', 'gestern', 'jetzt', 'hier', 'da', 'dort', 'wie', 'was', 'wer', 'wo', 'wann', 'warum', 'viel', 'wenig', 'alle', 'keine', 'mehr', 'weniger', 'erste', 'letzte', 'nächste', 'richtig', 'falsch', 'wichtig', 'einfach', 'schwer'],
      spanish: ['el', 'la', 'los', 'las', 'un', 'una', 'y', 'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ser', 'estar', 'tener', 'hacer', 'ir', 'ver', 'dar', 'saber', 'querer', 'llegar', 'pasar', 'deber', 'poner', 'parecer', 'quedar', 'creer', 'hablar', 'llevar', 'dejar', 'seguir', 'encontrar', 'llamar', 'venir', 'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar', 'mirar', 'contar', 'empezar', 'esperar', 'casa', 'tiempo', 'persona', 'año', 'día', 'hombre', 'mujer', 'niño', 'trabajo', 'vida', 'mano', 'mundo', 'país', 'agua', 'comida', 'familia', 'amigo', 'amor', 'dinero', 'problema', 'hora', 'momento', 'lugar', 'forma', 'manera', 'parte', 'grupo', 'empresa', 'caso', 'estado', 'servicio'],
      french: ['le', 'de', 'un', 'à', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'il', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'celui', 'me', 'bien', 'autre', 'comme', 'notre', 'ton', 'venir', 'sans', 'commun', 'premier', 'mettre', 'pendant', 'année', 'dire', 'bon', 'sous', 'écrire', 'marcher', 'problème', 'lieu', 'main', 'répondre', 'partie', 'prendre', 'connaître', 'eau', 'temps', 'personne', 'homme', 'femme', 'enfant', 'travail', 'vie', 'maison', 'monde', 'pays', 'famille', 'ami', 'amour', 'argent', 'heure', 'moment', 'endroit', 'façon', 'manière', 'groupe', 'entreprise', 'cas', 'état', 'service'],
      italian: ['il', 'di', 'che', 'e', 'la', 'a', 'un', 'in', 'essere', 'da', 'per', 'con', 'non', 'una', 'su', 'le', 'si', 'lo', 'come', 'questo', 'tutto', 'ma', 'del', 'più', 'anche', 'quello', 'molto', 'bene', 'quando', 'stesso', 'fare', 'ora', 'dove', 'prima', 'casa', 'tempo', 'vita', 'mano', 'giorno', 'modo', 'parte', 'anno', 'uomo', 'volta', 'dire', 'mondo', 'grande', 'altro', 'paese', 'nuovo', 'famiglia', 'lavoro', 'persona', 'bambino', 'donna', 'problema', 'momento', 'posto', 'forma', 'gruppo', 'azienda', 'caso', 'stato', 'servizio'],
      portuguese: ['o', 'a', 'de', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'casa', 'tempo', 'pessoa', 'ano', 'dia', 'homem', 'mulher', 'criança', 'trabalho', 'vida', 'família', 'amigo', 'amor', 'dinheiro', 'problema', 'hora', 'momento', 'lugar', 'forma', 'maneira', 'parte', 'grupo', 'empresa', 'caso', 'estado', 'serviço']
    },
    intermediate: {
      german: ['jedoch', 'obwohl', 'während', 'dadurch', 'außerdem', 'trotzdem', 'deshalb', 'deswegen', 'inzwischen', 'schließlich', 'allerdings', 'andererseits', 'beispielsweise', 'folgendermaßen', 'normalerweise', 'selbstverständlich', 'wahrscheinlich', 'möglicherweise', 'gelegentlich', 'regelmäßig', 'Gesellschaft', 'Regierung', 'Wirtschaft', 'Politik', 'Bildung', 'Gesundheit', 'Umwelt', 'Technologie', 'Wissenschaft', 'Kultur', 'Geschichte', 'Zukunft', 'Vergangenheit', 'Gegenwart', 'Möglichkeit', 'Gelegenheit', 'Erfahrung', 'Entwicklung', 'Veränderung', 'Entscheidung', 'Verantwortung', 'Beziehung', 'Kommunikation', 'Information', 'Diskussion', 'Lösung', 'Erfolg', 'Herausforderung'],
      spanish: ['sin embargo', 'aunque', 'mientras', 'por lo tanto', 'además', 'a pesar de', 'por eso', 'mientras tanto', 'finalmente', 'no obstante', 'por otra parte', 'por ejemplo', 'normalmente', 'probablemente', 'posiblemente', 'ocasionalmente', 'regularmente', 'frecuentemente', 'raramente', 'definitivamente', 'sociedad', 'gobierno', 'economía', 'política', 'educación', 'salud', 'ambiente', 'tecnología', 'ciencia', 'cultura', 'historia', 'futuro', 'pasado', 'presente', 'posibilidad', 'oportunidad', 'experiencia', 'desarrollo', 'cambio', 'decisión', 'responsabilidad', 'relación', 'comunicación', 'información', 'discusión', 'solución', 'éxito', 'desafío'],
      french: ['cependant', 'bien que', 'pendant que', 'par conséquent', 'en outre', 'malgré', 'c\'est pourquoi', 'en attendant', 'finalement', 'néanmoins', 'd\'autre part', 'par exemple', 'normalement', 'probablement', 'possiblement', 'occasionnellement', 'régulièrement', 'fréquemment', 'rarement', 'définitivement', 'société', 'gouvernement', 'économie', 'politique', 'éducation', 'santé', 'environnement', 'technologie', 'science', 'culture', 'histoire', 'futur', 'passé', 'présent', 'possibilité', 'opportunité', 'expérience', 'développement', 'changement', 'décision', 'responsabilité', 'relation', 'communication', 'information', 'discussion', 'solution', 'succès', 'défi'],
      italian: ['tuttavia', 'benché', 'mentre', 'pertanto', 'inoltre', 'nonostante', 'per questo', 'nel frattempo', 'finalmente', 'ciononostante', 'd\'altra parte', 'per esempio', 'normalmente', 'probabilmente', 'possibilmente', 'occasionalmente', 'regolarmente', 'frequentemente', 'raramente', 'definitivamente', 'società', 'governo', 'economia', 'politica', 'educazione', 'salute', 'ambiente', 'tecnologia', 'scienza', 'cultura', 'storia', 'futuro', 'passato', 'presente', 'possibilità', 'opportunità', 'esperienza', 'sviluppo', 'cambiamento', 'decisione', 'responsabilità', 'relazione', 'comunicazione', 'informazione', 'discussione', 'soluzione', 'successo', 'sfida'],
      portuguese: ['no entanto', 'embora', 'enquanto', 'portanto', 'além disso', 'apesar de', 'por isso', 'enquanto isso', 'finalmente', 'contudo', 'por outro lado', 'por exemplo', 'normalmente', 'provavelmente', 'possivelmente', 'ocasionalmente', 'regularmente', 'frequentemente', 'raramente', 'definitivamente', 'sociedade', 'governo', 'economia', 'política', 'educação', 'saúde', 'ambiente', 'tecnologia', 'ciência', 'cultura', 'história', 'futuro', 'passado', 'presente', 'possibilidade', 'oportunidade', 'experiência', 'desenvolvimento', 'mudança', 'decisão', 'responsabilidade', 'relacionamento', 'comunicação', 'informação', 'discussão', 'solução', 'sucesso', 'desafio']
    },
    advanced: {
      german: ['nichtsdestotrotz', 'gleichwohl', 'demzufolge', 'infolgedessen', 'dementsprechend', 'diesbezüglich', 'hinsichtlich', 'bezüglich', 'aufgrund', 'angesichts', 'zwecks', 'mittels', 'anhand', 'mithilfe', 'vermittels', 'kraft', 'laut', 'gemäß', 'entsprechend', 'zufolge', 'Angelegenheit', 'Betrachtung', 'Einstellung', 'Grundlage', 'Zusammenhang', 'Voraussetzung', 'Bedingung', 'Umstand', 'Verhältnis', 'Eigenschaft', 'Fähigkeit', 'Kompetenz', 'Qualifikation', 'Berechtigung', 'Verpflichtung', 'Anforderung', 'Erwartung', 'Vorstellung', 'Auffassung', 'Überzeugung'],
      spanish: ['no obstante', 'sin lugar a dudas', 'en consecuencia', 'por consiguiente', 'en efecto', 'efectivamente', 'ciertamente', 'indudablemente', 'evidentemente', 'obviamente', 'aparentemente', 'supuestamente', 'presumiblemente', 'teóricamente', 'prácticamente', 'virtualmente', 'esencialmente', 'fundamentalmente', 'básicamente', 'principalmente', 'circunstancia', 'consideración', 'perspectiva', 'fundamento', 'contexto', 'requisito', 'condición', 'situación', 'relación', 'característica', 'habilidad', 'competencia', 'cualificación', 'autorización', 'obligación', 'exigencia', 'expectativa', 'concepto', 'percepción', 'convicción'],
      french: ['néanmoins', 'toutefois', 'en conséquence', 'par conséquent', 'en effet', 'effectivement', 'certainement', 'indubitablement', 'évidemment', 'manifestement', 'apparemment', 'soi-disant', 'prétendument', 'théoriquement', 'pratiquement', 'virtuellement', 'essentiellement', 'fondamentalement', 'principalement', 'notamment', 'circonstance', 'considération', 'perspective', 'fondement', 'contexte', 'exigence', 'condition', 'situation', 'rapport', 'caractéristique', 'capacité', 'compétence', 'qualification', 'autorisation', 'obligation', 'exigence', 'attente', 'conception', 'perception', 'conviction'],
      italian: ['nondimeno', 'tuttavia', 'di conseguenza', 'pertanto', 'infatti', 'effettivamente', 'certamente', 'indubbiamente', 'evidentemente', 'ovviamente', 'apparentemente', 'presumibilmente', 'teoricamente', 'praticamente', 'virtualmente', 'essenzialmente', 'fondamentalmente', 'principalmente', 'soprattutto', 'specialmente', 'circostanza', 'considerazione', 'prospettiva', 'fondamento', 'contesto', 'requisito', 'condizione', 'situazione', 'rapporto', 'caratteristica', 'capacità', 'competenza', 'qualifica', 'autorizzazione', 'obbligo', 'requisito', 'aspettativa', 'concezione', 'percezione', 'convinzione'],
      portuguese: ['não obstante', 'sem dúvida alguma', 'em consequência', 'por conseguinte', 'com efeito', 'efetivamente', 'certamente', 'indubitavelmente', 'evidentemente', 'obviamente', 'aparentemente', 'supostamente', 'presumivelmente', 'teoricamente', 'praticamente', 'virtualmente', 'essencialmente', 'fundamentalmente', 'basicamente', 'principalmente', 'circunstância', 'consideração', 'perspectiva', 'fundamento', 'contexto', 'requisito', 'condição', 'situação', 'relação', 'característica', 'habilidade', 'competência', 'qualificação', 'autorização', 'obrigação', 'exigência', 'expectativa', 'concepção', 'percepção', 'convicção']
    }
  };

  static async getIntelligentWordPool(
    userId: string,
    language: string,
    difficulty: DifficultyLevel,
    excludeRecent: boolean = true,
    targetSize: number = 50
  ): Promise<WordPoolEntry[]> {
    try {
      console.log(`[IntelligentWordPoolManager] Building word pool for ${language} (${difficulty})`);

      // Get base word pool for the language and difficulty
      const baseWords = this.getBaseWordPool(language, difficulty);
      
      // Get user's word performance data
      const userWordData = await this.getUserWordPerformance(userId, language);
      
      // Get recent usage data if excluding recent words
      const recentUsage = excludeRecent ? 
        await this.getRecentWordUsage(userId, language, 24) : new Map();

      // Build intelligent word pool
      const wordPool: WordPoolEntry[] = [];
      
      for (const word of baseWords) {
        const userData = userWordData.get(word.toLowerCase());
        const recentCount = recentUsage.get(word.toLowerCase()) || 0;
        
        // Skip if used too recently
        if (excludeRecent && recentCount >= 2) {
          continue;
        }
        
        const entry: WordPoolEntry = {
          word,
          frequency: this.calculateWordFrequency(word, language),
          difficulty: this.calculateWordDifficulty(word, difficulty),
          contexts: [], // Would be populated from context analysis
          lastUsed: userData?.lastUsed,
          masteryLevel: userData?.masteryLevel || 0,
          priority: this.calculateWordPriority(word, userData, recentCount, difficulty)
        };
        
        wordPool.push(entry);
      }

      // Sort by priority and take top words
      wordPool.sort((a, b) => b.priority - a.priority);
      const selectedPool = wordPool.slice(0, targetSize);

      console.log(`[IntelligentWordPoolManager] Built pool with ${selectedPool.length} words, avg priority: ${Math.round(selectedPool.reduce((sum, w) => sum + w.priority, 0) / selectedPool.length)}`);

      return selectedPool;
    } catch (error) {
      console.error('[IntelligentWordPoolManager] Error building word pool:', error);
      // Fallback to basic word pool
      const baseWords = this.getBaseWordPool(language, difficulty);
      return baseWords.slice(0, targetSize).map(word => ({
        word,
        frequency: 50,
        difficulty: 50,
        contexts: [],
        masteryLevel: 0,
        priority: 50
      }));
    }
  }

  static async getWordPoolStats(
    userId: string,
    language: string,
    difficulty: DifficultyLevel
  ): Promise<WordPoolStats> {
    try {
      const wordPool = await this.getIntelligentWordPool(userId, language, difficulty, false);
      const recentUsage = await this.getRecentWordUsage(userId, language, 48);
      
      const totalWords = wordPool.length;
      const coolingDownWords = wordPool.filter(w => 
        recentUsage.has(w.word.toLowerCase())
      ).length;
      const availableWords = totalWords - coolingDownWords;
      const masteredWords = wordPool.filter(w => w.masteryLevel >= 4).length;
      const averageDifficulty = wordPool.reduce((sum, w) => sum + w.difficulty, 0) / totalWords;

      return {
        totalWords,
        availableWords,
        coolingDownWords,
        masteredWords,
        averageDifficulty: Math.round(averageDifficulty)
      };
    } catch (error) {
      console.error('[IntelligentWordPoolManager] Error getting stats:', error);
      return {
        totalWords: 0,
        availableWords: 0,
        coolingDownWords: 0,
        masteredWords: 0,
        averageDifficulty: 0
      };
    }
  }

  static selectOptimalWords(
    wordPool: WordPoolEntry[],
    count: number = 1,
    diversityWeight: number = 0.3
  ): string[] {
    if (wordPool.length === 0) return [];
    
    // Filter out recently used words with high frequency
    const availableWords = wordPool.filter(entry => {
      const recentlyUsed = entry.lastUsed && 
        (Date.now() - entry.lastUsed.getTime()) < 4 * 60 * 60 * 1000; // 4 hours
      return !recentlyUsed || entry.priority > 70;
    });
    
    if (availableWords.length === 0) {
      // Fallback to any words if all are recently used
      return wordPool.slice(0, count).map(w => w.word);
    }
    
    // Apply diversity-aware selection
    const selected: string[] = [];
    const remaining = [...availableWords];
    
    for (let i = 0; i < count && remaining.length > 0; i++) {
      // Calculate selection scores with diversity consideration
      const scoredWords = remaining.map(entry => {
        let score = entry.priority;
        
        // Add diversity bonus for words not similar to already selected
        if (selected.length > 0) {
          const diversityBonus = this.calculateDiversityBonus(entry.word, selected);
          score += diversityBonus * diversityWeight * 100;
        }
        
        // Add some randomness
        score += (Math.random() - 0.5) * 10;
        
        return { word: entry.word, score, entry };
      });
      
      // Select highest scoring word
      scoredWords.sort((a, b) => b.score - a.score);
      const selectedWord = scoredWords[0];
      
      selected.push(selectedWord.word);
      
      // Remove selected word from remaining
      const index = remaining.findIndex(w => w.word === selectedWord.word);
      if (index >= 0) {
        remaining.splice(index, 1);
      }
    }
    
    return selected;
  }

  private static getBaseWordPool(language: string, difficulty: DifficultyLevel): string[] {
    const normalizedLang = language.toLowerCase();
    const pool = this.LANGUAGE_WORD_POOLS[difficulty]?.[normalizedLang as keyof typeof this.LANGUAGE_WORD_POOLS[typeof difficulty]] ||
                 this.LANGUAGE_WORD_POOLS[difficulty]?.['german'] ||
                 this.LANGUAGE_WORD_POOLS.beginner.german;
    
    return [...pool]; // Return copy
  }

  private static async getUserWordPerformance(
    userId: string,
    language: string
  ): Promise<Map<string, { masteryLevel: number; lastUsed?: Date }>> {
    const performanceMap = new Map();
    
    try {
      const { data: knownWords } = await supabase
        .from('known_words')
        .select('word, mastery_level, last_reviewed_at')
        .eq('user_id', userId)
        .eq('language', language);

      knownWords?.forEach(kw => {
        performanceMap.set(kw.word.toLowerCase(), {
          masteryLevel: kw.mastery_level,
          lastUsed: kw.last_reviewed_at ? new Date(kw.last_reviewed_at) : undefined
        });
      });
    } catch (error) {
      console.error('[IntelligentWordPoolManager] Error getting user performance:', error);
    }
    
    return performanceMap;
  }

  private static async getRecentWordUsage(
    userId: string,
    language: string,
    lookbackHours: number
  ): Promise<Map<string, number>> {
    const usageMap = new Map<string, number>();
    const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
    
    try {
      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('target_words')
        .gte('created_at', cutoffTime.toISOString());

      exercises?.forEach(exercise => {
        exercise.target_words?.forEach((word: string) => {
          const normalizedWord = word.toLowerCase();
          usageMap.set(normalizedWord, (usageMap.get(normalizedWord) || 0) + 1);
        });
      });
    } catch (error) {
      console.error('[IntelligentWordPoolManager] Error getting recent usage:', error);
    }
    
    return usageMap;
  }

  private static calculateWordFrequency(word: string, language: string): number {
    // Basic frequency estimation based on word characteristics
    const wordLength = word.length;
    
    if (wordLength <= 3) return 90; // Very common short words
    if (wordLength <= 5) return 70; // Common words
    if (wordLength <= 8) return 50; // Medium frequency
    return 30; // Less common longer words
  }

  private static calculateWordDifficulty(word: string, difficulty: DifficultyLevel): number {
    const baseScores = {
      beginner: 20,
      intermediate: 50,
      advanced: 80
    };
    
    let score = baseScores[difficulty];
    
    // Adjust based on word characteristics
    if (word.length > 10) score += 15;
    if (word.includes('ß') || word.includes('ä') || word.includes('ö') || word.includes('ü')) score += 10;
    if (word.includes('-')) score += 5;
    
    return Math.min(100, Math.max(0, score));
  }

  private static calculateWordPriority(
    word: string,
    userData: any,
    recentCount: number,
    difficulty: DifficultyLevel
  ): number {
    let priority = 50; // Base priority
    
    // Boost words that need review
    if (userData?.masteryLevel && userData.masteryLevel < 3) {
      priority += 30;
    }
    
    // Boost completely new words slightly
    if (!userData) {
      priority += 20;
    }
    
    // Penalize recently used words
    if (recentCount > 0) {
      priority -= Math.min(recentCount * 15, 40);
    }
    
    // Boost words appropriate for difficulty
    const wordDifficulty = this.calculateWordDifficulty(word, difficulty);
    const difficultyMatch = 100 - Math.abs(wordDifficulty - {
      beginner: 30,
      intermediate: 50,
      advanced: 70
    }[difficulty]);
    
    priority += (difficultyMatch - 50) * 0.2;
    
    return Math.max(0, Math.min(100, priority));
  }

  private static calculateDiversityBonus(word: string, selectedWords: string[]): number {
    // Calculate how different this word is from already selected ones
    let diversityScore = 1.0;
    
    for (const selected of selectedWords) {
      // Simple diversity calculation based on word characteristics
      const lengthDiff = Math.abs(word.length - selected.length);
      const startsDifferent = word[0]?.toLowerCase() !== selected[0]?.toLowerCase();
      const endsDifferent = word.slice(-2).toLowerCase() !== selected.slice(-2).toLowerCase();
      
      let similarity = 0;
      if (lengthDiff === 0) similarity += 0.2;
      if (!startsDifferent) similarity += 0.3;
      if (!endsDifferent) similarity += 0.2;
      
      diversityScore *= (1 - similarity);
    }
    
    return diversityScore;
  }
}
