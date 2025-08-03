
import { supabase } from '@/integrations/supabase/client';
import { SpacedRepetitionEngine } from './spacedRepetitionEngine';
import { WordCooldownSystem } from './wordCooldownSystem';

export interface WordCandidate {
  word: string;
  score: number;
  noveltyScore: number;
  difficultyScore: number;
  reviewUrgency: number;
  lastUsedDays: number;
  usageFrequency: number;
  masteryLevel: number;
  isReview: boolean;
  isStruggling: boolean;
  isNew: boolean;
  reasons: string[];
}

export interface WordSelectionConfig {
  reviewWordRatio: number;      // 0.3 = 30% review words
  strugglingWordRatio: number;  // 0.2 = 20% struggling words
  newWordRatio: number;         // 0.3 = 30% new words
  noveltyWordRatio: number;     // 0.2 = 20% completely novel words
  minNoveltyScore: number;      // Minimum novelty threshold
  maxUsageFrequency: number;    // Maximum recent usage frequency
}

export class AdvancedWordSelectionEngine {
  private static readonly DEFAULT_CONFIG: WordSelectionConfig = {
    reviewWordRatio: 0.3,
    strugglingWordRatio: 0.2,
    newWordRatio: 0.3,
    noveltyWordRatio: 0.2,
    minNoveltyScore: 0.6,
    maxUsageFrequency: 3
  };

  private static readonly DIFFICULTY_WORD_POOLS = {
    beginner: {
      german: ['der', 'die', 'das', 'und', 'ich', 'du', 'er', 'sie', 'es', 'haben', 'sein', 'werden', 'können', 'müssen', 'wollen', 'gehen', 'kommen', 'sehen', 'sagen', 'machen', 'gut', 'groß', 'neu', 'alt', 'jung', 'schön', 'klein', 'lang', 'kurz', 'hoch', 'Haus', 'Auto', 'Hund', 'Katze', 'Kind', 'Mann', 'Frau', 'Tag', 'Nacht', 'Zeit', 'Wasser', 'Brot', 'Milch', 'Käse', 'Apfel', 'Buch', 'Tisch', 'Stuhl', 'Bett', 'Zimmer', 'Küche', 'Bad', 'Garten', 'Straße', 'Stadt', 'Land', 'Berg', 'Meer', 'Himmel'],
      spanish: ['el', 'la', 'los', 'las', 'un', 'una', 'y', 'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ser', 'estar', 'tener', 'hacer', 'ir', 'ver', 'dar', 'saber', 'querer', 'llegar', 'pasar', 'deber', 'poner', 'parecer', 'quedar', 'creer', 'hablar', 'llevar', 'dejar', 'seguir', 'encontrar', 'llamar', 'venir', 'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar', 'mirar', 'contar', 'empezar', 'esperar', 'casa', 'tiempo', 'día', 'año', 'mundo', 'vida', 'hombre', 'mujer', 'niño', 'ciudad'],
      french: ['le', 'de', 'un', 'à', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'il', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'celui', 'me', 'bien', 'autre', 'comme', 'notre', 'ton', 'venir', 'sans', 'commun', 'premier', 'mettre', 'pendant', 'année', 'dire', 'bon', 'sous', 'écrire', 'marcher', 'problème', 'lieu', 'main', 'répondre', 'partie', 'prendre', 'connaître', 'eau', 'maison', 'temps', 'jour', 'vie', 'homme', 'femme', 'enfant', 'ville', 'pays'],
      portuguese: ['o', 'a', 'de', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'casa', 'tempo', 'dia', 'ano', 'mundo', 'vida', 'homem', 'mulher', 'criança', 'cidade'],
      italian: ['il', 'di', 'che', 'e', 'la', 'a', 'un', 'in', 'essere', 'da', 'per', 'con', 'non', 'una', 'su', 'le', 'si', 'lo', 'come', 'questo', 'tutto', 'ma', 'del', 'più', 'anche', 'quello', 'molto', 'bene', 'quando', 'stesso', 'fare', 'ora', 'dove', 'prima', 'casa', 'tempo', 'giorno', 'modo', 'parte', 'anno', 'uomo', 'volta', 'dire', 'mondo', 'grande', 'altro', 'paese', 'nuovo', 'donna', 'bambino', 'città', 'vita']
    },
    intermediate: {
      german: ['jedoch', 'obwohl', 'während', 'dadurch', 'außerdem', 'trotzdem', 'deshalb', 'deswegen', 'inzwischen', 'schließlich', 'allerdings', 'andererseits', 'beispielsweise', 'folgendermaßen', 'normalerweise', 'selbstverständlich', 'wahrscheinlich', 'möglicherweise', 'gelegentlich', 'regelmäßig', 'Gesellschaft', 'Wirtschaft', 'Politik', 'Bildung', 'Gesundheit', 'Umwelt', 'Technologie', 'Kultur', 'Geschichte', 'Zukunft'],
      spanish: ['sin embargo', 'aunque', 'mientras', 'por lo tanto', 'además', 'a pesar de', 'por eso', 'mientras tanto', 'finalmente', 'no obstante', 'por otra parte', 'por ejemplo', 'normalmente', 'probablemente', 'posiblemente', 'ocasionalmente', 'regularmente', 'frecuentemente', 'raramente', 'definitivamente', 'sociedad', 'economía', 'política', 'educación', 'salud', 'ambiente', 'tecnología', 'cultura', 'historia', 'futuro'],
      french: ['cependant', 'bien que', 'pendant que', 'par conséquent', 'en outre', 'malgré', 'c\'est pourquoi', 'en attendant', 'finalement', 'néanmoins', 'd\'autre part', 'par exemple', 'normalement', 'probablement', 'possiblement', 'occasionnellement', 'régulièrement', 'fréquemment', 'rarement', 'définitivement', 'société', 'économie', 'politique', 'éducation', 'santé', 'environnement', 'technologie', 'culture', 'histoire', 'avenir'],
      portuguese: ['no entanto', 'embora', 'enquanto', 'portanto', 'além disso', 'apesar de', 'por isso', 'enquanto isso', 'finalmente', 'contudo', 'por outro lado', 'por exemplo', 'normalmente', 'provavelmente', 'possivelmente', 'ocasionalmente', 'regularmente', 'frequentemente', 'raramente', 'definitivamente', 'sociedade', 'economia', 'política', 'educação', 'saúde', 'ambiente', 'tecnologia', 'cultura', 'história', 'futuro'],
      italian: ['tuttavia', 'benché', 'mentre', 'pertanto', 'inoltre', 'nonostante', 'per questo', 'nel frattempo', 'finalmente', 'ciononostante', 'd\'altra parte', 'per esempio', 'normalmente', 'probabilmente', 'possibilmente', 'occasionalmente', 'regolarmente', 'frequentemente', 'raramente', 'definitivamente', 'società', 'economia', 'politica', 'educazione', 'salute', 'ambiente', 'tecnologia', 'cultura', 'storia', 'futuro']
    },
    advanced: {
      german: ['nichtsdestotrotz', 'gleichwohl', 'demzufolge', 'infolgedessen', 'dementsprechend', 'diesbezüglich', 'hinsichtlich', 'bezüglich', 'aufgrund', 'angesichts', 'zwecks', 'mittels', 'anhand', 'mithilfe', 'vermittels', 'kraft', 'laut', 'gemäß', 'entsprechend', 'zufolge', 'Verantwortung', 'Nachhaltigkeit', 'Globalisierung', 'Innovation', 'Digitalisierung', 'Komplexität', 'Effizienz', 'Kreativität', 'Authentizität', 'Transformation'],
      spanish: ['no obstante', 'sin lugar a dudas', 'en consecuencia', 'por consiguiente', 'en efecto', 'efectivamente', 'ciertamente', 'indudablemente', 'evidentemente', 'obviamente', 'aparentemente', 'supuestamente', 'presumiblemente', 'teóricamente', 'prácticamente', 'virtualmente', 'esencialmente', 'fundamentalmente', 'básicamente', 'principalmente', 'responsabilidad', 'sostenibilidad', 'globalización', 'innovación', 'digitalización', 'complejidad', 'eficiencia', 'creatividad', 'autenticidad', 'transformación'],
      french: ['néanmoins', 'toutefois', 'en conséquence', 'par conséquent', 'en effet', 'effectivement', 'certainement', 'indubitablement', 'évidemment', 'manifestement', 'apparemment', 'soi-disant', 'prétendument', 'théoriquement', 'pratiquement', 'virtuellement', 'essentiellement', 'fondamentalement', 'principalement', 'notamment', 'responsabilité', 'durabilité', 'mondialisation', 'innovation', 'numérisation', 'complexité', 'efficacité', 'créativité', 'authenticité', 'transformation'],
      portuguese: ['não obstante', 'sem dúvida alguma', 'em consequência', 'por conseguinte', 'com efeito', 'efetivamente', 'certamente', 'indubitavelmente', 'evidentemente', 'obviamente', 'aparentemente', 'supostamente', 'presumivelmente', 'teoricamente', 'praticamente', 'virtualmente', 'essencialmente', 'fundamentalmente', 'basicamente', 'principalmente', 'responsabilidade', 'sustentabilidade', 'globalização', 'inovação', 'digitalização', 'complexidade', 'eficiência', 'criatividade', 'autenticidade', 'transformação'],
      italian: ['nondimeno', 'tuttavia', 'di conseguenza', 'pertanto', 'infatti', 'effettivamente', 'certamente', 'indubbiamente', 'evidentemente', 'ovviamente', 'apparentemente', 'presumibilmente', 'teoricamente', 'praticamente', 'virtualmente', 'essenzialmente', 'fondamentalmente', 'principalmente', 'soprattutto', 'specialmente', 'responsabilità', 'sostenibilità', 'globalizzazione', 'innovazione', 'digitalizzazione', 'complessità', 'efficienza', 'creatività', 'autenticità', 'trasformazione']
    }
  };

  static async selectOptimalWords(params: {
    language: string;
    difficultyLevel: string;
    userId: string;
    sessionId: string;
    targetCount?: number;
    config?: Partial<WordSelectionConfig>;
  }): Promise<{
    selectedWords: string[];
    candidates: WordCandidate[];
    selectionQuality: number;
    diversityScore: number;
  }> {
    const { language, difficultyLevel, userId, sessionId, targetCount = 1 } = params;
    const config = { ...this.DEFAULT_CONFIG, ...params.config };

    console.log(`[AdvancedWordSelection] Starting enhanced word selection for ${language} (${difficultyLevel})`);

    try {
      // Step 1: Get all candidate words from difficulty pool
      const allCandidates = this.getCandidateWords(language, difficultyLevel);
      
      // Step 2: Score all candidates with comprehensive metrics
      const scoredCandidates = await this.scoreWordCandidates({
        words: allCandidates,
        userId,
        language,
        sessionId,
        difficultyLevel
      });

      // Step 3: Apply novelty and cooldown filters
      const filteredCandidates = await this.applyAdvancedFilters(
        scoredCandidates,
        userId,
        sessionId,
        config
      );

      // Step 4: Select optimal mix using advanced algorithm
      const selection = this.selectOptimalMix(filteredCandidates, targetCount, config);

      console.log(`[AdvancedWordSelection] Selected ${selection.selectedWords.length} words with quality score: ${selection.selectionQuality}`);
      
      return selection;

    } catch (error) {
      console.error('[AdvancedWordSelection] Error in word selection:', error);
      // Fallback to simple selection
      const fallbackWords = this.getCandidateWords(language, difficultyLevel).slice(0, targetCount);
      return {
        selectedWords: fallbackWords,
        candidates: [],
        selectionQuality: 50,
        diversityScore: 30
      };
    }
  }

  private static getCandidateWords(language: string, difficultyLevel: string): string[] {
    const pool = this.DIFFICULTY_WORD_POOLS[difficultyLevel as keyof typeof this.DIFFICULTY_WORD_POOLS];
    const words = pool?.[language as keyof typeof pool] || pool?.['german'] || [];
    
    // Shuffle to avoid always getting the same first words
    return this.shuffleArray([...words]);
  }

  private static async scoreWordCandidates(params: {
    words: string[];
    userId: string;
    language: string;
    sessionId: string;
    difficultyLevel: string;
  }): Promise<WordCandidate[]> {
    const { words, userId, language, sessionId } = params;
    const candidates: WordCandidate[] = [];

    // Get review and struggling words
    const reviewWords = await SpacedRepetitionEngine.getWordsForReview(userId, language, 20);
    const strugglingWords = await SpacedRepetitionEngine.getStrugglingWords(userId, language, 10);
    
    // Get usage statistics
    const usageStats = await WordCooldownSystem.getWordUsageStats(userId, language, sessionId, 168); // 1 week

    for (const word of words) {
      const performance = await SpacedRepetitionEngine.getWordPerformance(userId, word, language);
      const usageFrequency = usageStats.get(word) || 0;
      const isReview = reviewWords.includes(word);
      const isStruggling = strugglingWords.includes(word);
      const isNew = !performance;

      // Calculate comprehensive scores
      const noveltyScore = this.calculateNoveltyScore(word, usageFrequency, performance);
      const difficultyScore = this.calculateDifficultyScore(word, performance);
      const reviewUrgency = this.calculateReviewUrgency(word, performance, isReview, isStruggling);
      
      let baseScore = 50;
      const reasons: string[] = [];

      // Boost struggling words significantly
      if (isStruggling) {
        baseScore += 40;
        reasons.push('Needs reinforcement');
      }

      // Boost review words
      if (isReview && !isStruggling) {
        baseScore += 30;
        reasons.push('Due for review');
      }

      // Boost new words moderately
      if (isNew) {
        baseScore += 20;
        reasons.push('New vocabulary');
      }

      // Apply novelty bonus
      baseScore += noveltyScore * 20;
      if (noveltyScore > 0.7) {
        reasons.push('High novelty');
      }

      // Penalize overused words heavily
      if (usageFrequency > 2) {
        baseScore -= usageFrequency * 15;
        reasons.push(`Used ${usageFrequency} times recently`);
      }

      // Add randomization for diversity
      baseScore += (Math.random() - 0.5) * 10;

      candidates.push({
        word,
        score: Math.max(0, baseScore),
        noveltyScore,
        difficultyScore,
        reviewUrgency,
        lastUsedDays: performance?.lastReviewDate ? 
          Math.floor((Date.now() - performance.lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)) : 999,
        usageFrequency,
        masteryLevel: performance?.masteryScore || 0,
        isReview,
        isStruggling,
        isNew,
        reasons
      });
    }

    return candidates.sort((a, b) => b.score - a.score);
  }

  private static async applyAdvancedFilters(
    candidates: WordCandidate[],
    userId: string,
    sessionId: string,
    config: WordSelectionConfig
  ): Promise<WordCandidate[]> {
    const filtered: WordCandidate[] = [];

    for (const candidate of candidates) {
      // Apply novelty filter
      if (candidate.noveltyScore < config.minNoveltyScore && !candidate.isStruggling && !candidate.isReview) {
        continue;
      }

      // Apply usage frequency filter
      if (candidate.usageFrequency > config.maxUsageFrequency && !candidate.isStruggling) {
        continue;
      }

      // Apply cooldown filter
      if (candidate.lastUsedDays < 1 && !candidate.isStruggling) {
        continue;
      }

      filtered.push(candidate);
    }

    return filtered;
  }

  private static selectOptimalMix(
    candidates: WordCandidate[],
    targetCount: number,
    config: WordSelectionConfig
  ): {
    selectedWords: string[];
    candidates: WordCandidate[];
    selectionQuality: number;
    diversityScore: number;
  } {
    const selected: string[] = [];
    const selectedCandidates: WordCandidate[] = [];

    // Separate candidates by type
    const strugglingWords = candidates.filter(c => c.isStruggling);
    const reviewWords = candidates.filter(c => c.isReview && !c.isStruggling);
    const newWords = candidates.filter(c => c.isNew);
    const noveltyWords = candidates.filter(c => !c.isReview && !c.isStruggling && !c.isNew && c.noveltyScore > 0.8);

    // Calculate target counts for each category
    const strugglingTarget = Math.ceil(targetCount * config.strugglingWordRatio);
    const reviewTarget = Math.ceil(targetCount * config.reviewWordRatio);
    const newTarget = Math.ceil(targetCount * config.newWordRatio);
    const noveltyTarget = Math.ceil(targetCount * config.noveltyWordRatio);

    // Select struggling words first (highest priority)
    this.selectFromCategory(strugglingWords, strugglingTarget, selected, selectedCandidates);

    // Select review words
    this.selectFromCategory(reviewWords, Math.min(reviewTarget, targetCount - selected.length), selected, selectedCandidates);

    // Select new words
    this.selectFromCategory(newWords, Math.min(newTarget, targetCount - selected.length), selected, selectedCandidates);

    // Select novelty words
    this.selectFromCategory(noveltyWords, Math.min(noveltyTarget, targetCount - selected.length), selected, selectedCandidates);

    // Fill remaining slots with best candidates
    const remainingCandidates = candidates.filter(c => !selected.includes(c.word));
    this.selectFromCategory(remainingCandidates, targetCount - selected.length, selected, selectedCandidates);

    // Calculate quality metrics
    const avgScore = selectedCandidates.reduce((sum, c) => sum + c.score, 0) / selectedCandidates.length;
    const avgNovelty = selectedCandidates.reduce((sum, c) => sum + c.noveltyScore, 0) / selectedCandidates.length;
    
    const selectionQuality = Math.min(100, avgScore);
    const diversityScore = Math.min(100, avgNovelty * 100);

    return {
      selectedWords: selected,
      candidates: selectedCandidates,
      selectionQuality,
      diversityScore
    };
  }

  private static selectFromCategory(
    candidates: WordCandidate[],
    targetCount: number,
    selected: string[],
    selectedCandidates: WordCandidate[]
  ): void {
    let count = 0;
    for (const candidate of candidates) {
      if (count >= targetCount) break;
      if (!selected.includes(candidate.word)) {
        selected.push(candidate.word);
        selectedCandidates.push(candidate);
        count++;
      }
    }
  }

  private static calculateNoveltyScore(word: string, usageFrequency: number, performance: any): number {
    // Higher score for less used words
    const usageScore = Math.max(0, 1 - (usageFrequency / 5));
    
    // Higher score for words not seen recently
    const recencyScore = performance?.lastReviewDate ? 
      Math.min(1, (Date.now() - performance.lastReviewDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) : 1;
    
    return (usageScore * 0.6 + recencyScore * 0.4);
  }

  private static calculateDifficultyScore(word: string, performance: any): number {
    // Based on word length and mastery level
    const lengthScore = Math.min(1, word.length / 10);
    const masteryScore = performance ? (performance.masteryScore / 100) : 0.5;
    
    return lengthScore * 0.3 + (1 - masteryScore) * 0.7;
  }

  private static calculateReviewUrgency(word: string, performance: any, isReview: boolean, isStruggling: boolean): number {
    if (isStruggling) return 1.0;
    if (isReview) return 0.8;
    if (!performance) return 0.3;
    
    // Based on how overdue the review is
    const daysSinceReview = performance.lastReviewDate ? 
      (Date.now() - performance.lastReviewDate.getTime()) / (1000 * 60 * 60 * 24) : 0;
    
    return Math.min(1, daysSinceReview / 7); // Max urgency after 1 week
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
