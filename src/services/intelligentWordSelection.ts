
import { SpacedRepetitionEngine } from './spacedRepetitionEngine';
import { WordCooldownSystem } from './wordCooldownSystem';
import { supabase } from '@/integrations/supabase/client';

export interface WordSelectionCriteria {
  language: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  userId: string;
  sessionId: string;
  previousWords?: string[];
  targetCount?: number;
}

export interface WordCandidate {
  word: string;
  score: number;
  reason: string[];
  isReview: boolean;
  isNew: boolean;
  masteryScore: number;
  lastSeen?: Date;
}

export interface WordSelectionResult {
  selectedWords: string[];
  reviewWords: string[];
  newWords: string[];
  reasons: string[];
  selectionQuality: number;
}

export class IntelligentWordSelection {
  private static readonly DIFFICULTY_WORD_POOLS = {
    beginner: {
      german: ['der', 'die', 'das', 'und', 'ich', 'du', 'er', 'sie', 'es', 'haben', 'sein', 'werden', 'können', 'müssen', 'wollen', 'gehen', 'kommen', 'sehen', 'sagen', 'machen', 'gut', 'groß', 'neu', 'alt', 'jung', 'schön', 'klein', 'lang', 'kurz', 'hoch', 'Haus', 'Auto', 'Hund', 'Katze', 'Kind', 'Mann', 'Frau', 'Tag', 'Nacht', 'Zeit', 'Wasser', 'Brot', 'Milch', 'Käse', 'Apfel', 'Buch', 'Tisch', 'Stuhl', 'Bett', 'Zimmer'],
      spanish: ['el', 'la', 'los', 'las', 'un', 'una', 'y', 'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ser', 'estar', 'tener', 'hacer', 'ir', 'ver', 'dar', 'saber', 'querer', 'llegar', 'pasar', 'deber', 'poner', 'parecer', 'quedar', 'creer', 'hablar', 'llevar', 'dejar', 'seguir', 'encontrar', 'llamar', 'venir', 'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar', 'mirar', 'contar', 'empezar', 'esperar'],
      french: ['le', 'de', 'un', 'à', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'il', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'celui', 'me', 'bien', 'autre', 'comme', 'notre', 'ton', 'venir', 'sans', 'commun', 'premier', 'mettre', 'pendant', 'année', 'dire', 'bon', 'sous', 'écrire', 'marcher', 'problème', 'lieu', 'main', 'répondre', 'partie', 'prendre', 'connaître', 'eau'],
      portuguese: ['o', 'a', 'de', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem'],
      italian: ['il', 'di', 'che', 'e', 'la', 'a', 'un', 'in', 'essere', 'da', 'per', 'con', 'non', 'una', 'su', 'le', 'si', 'lo', 'come', 'questo', 'tutto', 'ma', 'del', 'più', 'anche', 'quello', 'molto', 'bene', 'quando', 'stesso', 'fare', 'ora', 'dove', 'prima', 'casa', 'tempo', 'vita', 'mano', 'giorno', 'modo', 'parte', 'anno', 'uomo', 'volta', 'dire', 'mondo', 'grande', 'altro', 'paese', 'nuovo']
    },
    intermediate: {
      german: ['jedoch', 'obwohl', 'während', 'dadurch', 'außerdem', 'trotzdem', 'deshalb', 'deswegen', 'inzwischen', 'schließlich', 'allerdings', 'andererseits', 'beispielsweise', 'folgendermaßen', 'normalerweise', 'selbstverständlich', 'wahrscheinlich', 'möglicherweise', 'gelegentlich', 'regelmäßig'],
      spanish: ['sin embargo', 'aunque', 'mientras', 'por lo tanto', 'además', 'a pesar de', 'por eso', 'mientras tanto', 'finalmente', 'no obstante', 'por otra parte', 'por ejemplo', 'normalmente', 'probablemente', 'posiblemente', 'ocasionalmente', 'regularmente', 'frecuentemente', 'raramente', 'definitivamente'],
      french: ['cependant', 'bien que', 'pendant que', 'par conséquent', 'en outre', 'malgré', 'c\'est pourquoi', 'en attendant', 'finalement', 'néanmoins', 'd\'autre part', 'par exemple', 'normalement', 'probablement', 'possiblement', 'occasionnellement', 'régulièrement', 'fréquemment', 'rarement', 'définitivement'],
      portuguese: ['no entanto', 'embora', 'enquanto', 'portanto', 'além disso', 'apesar de', 'por isso', 'enquanto isso', 'finalmente', 'contudo', 'por outro lado', 'por exemplo', 'normalmente', 'provavelmente', 'possivelmente', 'ocasionalmente', 'regularmente', 'frequentemente', 'raramente', 'definitivamente'],
      italian: ['tuttavia', 'benché', 'mentre', 'pertanto', 'inoltre', 'nonostante', 'per questo', 'nel frattempo', 'finalmente', 'ciononostante', 'd\'altra parte', 'per esempio', 'normalmente', 'probabilmente', 'possibilmente', 'occasionalmente', 'regolarmente', 'frequentemente', 'raramente', 'definitivamente']
    },
    advanced: {
      german: ['nichtsdestotrotz', 'gleichwohl', 'demzufolge', 'infolgedessen', 'dementsprechend', 'diesbezüglich', 'hinsichtlich', 'bezüglich', 'aufgrund', 'angesichts', 'zwecks', 'mittels', 'anhand', 'mithilfe', 'vermittels', 'kraft', 'laut', 'gemäß', 'entsprechend', 'zufolge'],
      spanish: ['no obstante', 'sin lugar a dudas', 'en consecuencia', 'por consiguiente', 'en efecto', 'efectivamente', 'ciertamente', 'indudablemente', 'evidentemente', 'obviamente', 'aparentemente', 'supuestamente', 'presumiblemente', 'teóricamente', 'prácticamente', 'virtualmente', 'esencialmente', 'fundamentalmente', 'básicamente', 'principalmente'],
      french: ['néanmoins', 'toutefois', 'en conséquence', 'par conséquent', 'en effet', 'effectivement', 'certainement', 'indubitablement', 'évidemment', 'manifestement', 'apparemment', 'soi-disant', 'prétendument', 'théoriquement', 'pratiquement', 'virtuellement', 'essentiellement', 'fondamentalement', 'principalement', 'notamment'],
      portuguese: ['não obstante', 'sem dúvida alguma', 'em consequência', 'por conseguinte', 'com efeito', 'efetivamente', 'certamente', 'indubitavelmente', 'evidentemente', 'obviamente', 'aparentemente', 'supostamente', 'presumivelmente', 'teoricamente', 'praticamente', 'virtualmente', 'essencialmente', 'fundamentalmente', 'basicamente', 'principalmente'],
      italian: ['nondimeno', 'tuttavia', 'di conseguenza', 'pertanto', 'infatti', 'effettivamente', 'certamente', 'indubbiamente', 'evidentemente', 'ovviamente', 'apparentemente', 'presumibilmente', 'teoricamente', 'praticamente', 'virtualmente', 'essenzialmente', 'fondamentalmente', 'principalmente', 'soprattutto', 'specialmente']
    }
  };

  static async selectOptimalWords(criteria: WordSelectionCriteria): Promise<WordSelectionResult> {
    const { language, difficultyLevel, userId, sessionId, previousWords = [], targetCount = 1 } = criteria;

    console.log(`[IntelligentWordSelection] Starting word selection for ${language} (${difficultyLevel})`);

    try {
      // Step 1: Get candidate words from difficulty pool
      const candidateWords = this.getCandidateWords(language, difficultyLevel);
      
      // Step 2: Check word cooldowns
      const availableWords = await WordCooldownSystem.getAvailableWords(
        userId, language, candidateWords, sessionId
      );

      if (availableWords.length === 0) {
        console.warn(`No available words after cooldown filtering, falling back to candidates`);
        return this.createFallbackResult(candidateWords.slice(0, targetCount));
      }

      // Step 3: Get spaced repetition words (words due for review)
      const reviewWords = await SpacedRepetitionEngine.getWordsForReview(userId, language, 5);
      
      // Step 4: Get struggling words for reinforcement
      const strugglingWords = await SpacedRepetitionEngine.getStrugglingWords(userId, language, 3);

      // Step 5: Score and rank all candidates
      const scoredCandidates = await this.scoreWordCandidates({
        availableWords,
        reviewWords,
        strugglingWords,
        previousWords,
        userId,
        language,
        difficultyLevel
      });

      // Step 6: Select optimal mix of words
      const selection = this.selectOptimalMix(scoredCandidates, targetCount, reviewWords);

      console.log(`[IntelligentWordSelection] Selected ${selection.selectedWords.length} words:`, selection.selectedWords);
      
      return selection;

    } catch (error) {
      console.error('Error in intelligent word selection:', error);
      // Fallback to simple selection
      const fallbackWords = this.getCandidateWords(language, difficultyLevel).slice(0, targetCount);
      return this.createFallbackResult(fallbackWords);
    }
  }

  private static getCandidateWords(language: string, difficultyLevel: string): string[] {
    const pool = this.DIFFICULTY_WORD_POOLS[difficultyLevel as keyof typeof this.DIFFICULTY_WORD_POOLS];
    return pool?.[language as keyof typeof pool] || pool?.['german'] || [];
  }

  private static async scoreWordCandidates(params: {
    availableWords: string[];
    reviewWords: string[];
    strugglingWords: string[];
    previousWords: string[];
    userId: string;
    language: string;
    difficultyLevel: string;
  }): Promise<WordCandidate[]> {
    const { availableWords, reviewWords, strugglingWords, previousWords, userId, language } = params;
    
    const candidates: WordCandidate[] = [];

    for (const word of availableWords) {
      const isReview = reviewWords.includes(word);
      const isStruggling = strugglingWords.includes(word);
      const wasRecentlyUsed = previousWords.includes(word);
      
      // Get performance data
      const performance = await SpacedRepetitionEngine.getWordPerformance(userId, word, language);
      
      let score = 50; // Base score
      const reasons: string[] = [];

      // Boost review words
      if (isReview) {
        score += 30;
        reasons.push('Due for review');
      }

      // Heavily boost struggling words for reinforcement
      if (isStruggling) {
        score += 40;
        reasons.push('Needs reinforcement');
      }

      // Penalize recently used words
      if (wasRecentlyUsed) {
        score -= 20;
        reasons.push('Recently used');
      }

      // Boost words with low mastery for more practice
      if (performance && performance.masteryScore < 50) {
        score += 20;
        reasons.push('Low mastery');
      }

      // Slight boost for completely new words
      if (!performance) {
        score += 10;
        reasons.push('New word');
      }

      // Add some randomization to prevent predictability
      score += Math.random() * 10 - 5;

      candidates.push({
        word,
        score: Math.max(0, score),
        reason: reasons,
        isReview,
        isNew: !performance,
        masteryScore: performance?.masteryScore || 0,
        lastSeen: performance?.lastReviewDate
      });
    }

    return candidates.sort((a, b) => b.score - a.score);
  }

  private static selectOptimalMix(
    candidates: WordCandidate[],
    targetCount: number,
    reviewWords: string[]
  ): WordSelectionResult {
    const selected: string[] = [];
    const reviewSelected: string[] = [];
    const newSelected: string[] = [];
    const allReasons: string[] = [];

    // Prioritize review words (up to 60% of selection)
    const maxReviewCount = Math.ceil(targetCount * 0.6);
    const reviewCandidates = candidates.filter(c => c.isReview).slice(0, maxReviewCount);
    
    for (const candidate of reviewCandidates) {
      if (selected.length < targetCount) {
        selected.push(candidate.word);
        reviewSelected.push(candidate.word);
        allReasons.push(`${candidate.word}: ${candidate.reason.join(', ')}`);
      }
    }

    // Fill remaining slots with best scoring non-review words
    const nonReviewCandidates = candidates.filter(c => !c.isReview && !selected.includes(c.word));
    
    for (const candidate of nonReviewCandidates) {
      if (selected.length < targetCount) {
        selected.push(candidate.word);
        if (candidate.isNew) {
          newSelected.push(candidate.word);
        }
        allReasons.push(`${candidate.word}: ${candidate.reason.join(', ')}`);
      }
    }

    // Calculate selection quality score
    const avgScore = candidates.filter(c => selected.includes(c.word))
      .reduce((sum, c) => sum + c.score, 0) / selected.length;
    const selectionQuality = Math.min(100, Math.max(0, avgScore));

    return {
      selectedWords: selected,
      reviewWords: reviewSelected,
      newWords: newSelected,
      reasons: allReasons,
      selectionQuality
    };
  }

  private static createFallbackResult(words: string[]): WordSelectionResult {
    return {
      selectedWords: words,
      reviewWords: [],
      newWords: words,
      reasons: ['Fallback selection due to error'],
      selectionQuality: 50
    };
  }

  static async getWordFrequencyData(language: string): Promise<Map<string, number>> {
    // This would ideally connect to a word frequency database
    // For now, return empty map and rely on difficulty-based pools
    return new Map();
  }

  static async analyzeUserVocabularyGaps(
    userId: string,
    language: string,
    difficultyLevel: string
  ): Promise<string[]> {
    try {
      const candidateWords = this.getCandidateWords(language, difficultyLevel);
      
      // Get words the user has never seen
      const { data: knownWords } = await supabase
        .from('known_words')
        .select('word')
        .eq('user_id', userId)
        .eq('language', language);

      const knownWordSet = new Set(knownWords?.map(kw => kw.word) || []);
      const unknownWords = candidateWords.filter(word => !knownWordSet.has(word));

      console.log(`Found ${unknownWords.length} vocabulary gaps for ${language} (${difficultyLevel})`);
      
      return unknownWords;
    } catch (error) {
      console.error('Error analyzing vocabulary gaps:', error);
      return [];
    }
  }
}
