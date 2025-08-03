
import { supabase } from '@/integrations/supabase/client';

export interface SentencePattern {
  id: string;
  structure: string;
  template: string;
  complexity: number;
  frequency: number;
  lastUsed: Date;
  language: string;
  contexts: string[];
  difficulty: string;
}

export interface PatternUsageStats {
  pattern: string;
  count: number;
  lastUsed: Date;
  contexts: string[];
}

export interface DiversityMetrics {
  structuralDiversity: number;
  contextualDiversity: number;
  temporalSpread: number;
  overallDiversity: number;
}

export class SentencePatternDiversityEngine {
  private static readonly PATTERN_TEMPLATES = {
    beginner: {
      german: [
        'SUBJECT VERB OBJECT',
        'SUBJECT VERB ADJECTIVE',
        'SUBJECT haben/sein OBJECT',
        'SUBJECT können/müssen VERB',
        'Es gibt OBJECT',
        'Ich möchte VERB',
        'Das ist ADJECTIVE',
        'SUBJECT geht nach LOCATION',
        'SUBJECT kommt aus LOCATION',
        'SUBJECT isst/trinkt OBJECT'
      ],
      spanish: [
        'SUBJECT VERB OBJECT',
        'SUBJECT estar/ser ADJECTIVE',
        'SUBJECT tener OBJECT',
        'SUBJECT ir a LOCATION',
        'SUBJECT venir de LOCATION',
        'Me gusta VERB/OBJECT',
        'Hay OBJECT en LOCATION',
        'SUBJECT puede VERB',
        'SUBJECT quiere VERB',
        'Este/Esta es OBJECT'
      ],
      french: [
        'SUBJECT VERB OBJECT',
        'SUBJECT être ADJECTIVE',
        'SUBJECT avoir OBJECT',
        'SUBJECT aller à LOCATION',
        'SUBJECT venir de LOCATION',
        'J\'aime VERB/OBJECT',
        'Il y a OBJECT',
        'SUBJECT peut VERB',
        'SUBJECT veut VERB',
        'C\'est ADJECTIVE/OBJECT'
      ],
      portuguese: [
        'SUBJECT VERB OBJECT',
        'SUBJECT ser/estar ADJECTIVE',
        'SUBJECT ter OBJECT',
        'SUBJECT ir para LOCATION',
        'SUBJECT vir de LOCATION',
        'Eu gosto de VERB/OBJECT',
        'Há OBJECT em LOCATION',
        'SUBJECT pode VERB',
        'SUBJECT quer VERB',
        'Este/Esta é OBJECT'
      ],
      italian: [
        'SUBJECT VERB OBJECT',
        'SUBJECT essere ADJECTIVE',
        'SUBJECT avere OBJECT',
        'SUBJECT andare a LOCATION',
        'SUBJECT venire da LOCATION',
        'Mi piace VERB/OBJECT',
        'C\'è OBJECT',
        'SUBJECT può VERB',
        'SUBJECT vuole VERB',
        'Questo/Questa è OBJECT'
      ]
    },
    intermediate: {
      german: [
        'SUBJECT VERB, weil CLAUSE',
        'Obwohl CLAUSE, VERB SUBJECT',
        'Nachdem SUBJECT VERB, CLAUSE',
        'SUBJECT VERB, damit CLAUSE',
        'Wenn CONDITION, dann RESULT',
        'SUBJECT hat OBJECT PAST_PARTICIPLE',
        'SUBJECT wird OBJECT VERB',
        'Je mehr SUBJECT VERB, desto ADJECTIVE',
        'SUBJECT sowohl VERB als auch VERB',
        'Anstatt zu VERB, SUBJECT VERB'
      ],
      spanish: [
        'SUBJECT VERB porque CLAUSE',
        'Aunque CLAUSE, SUBJECT VERB',
        'Después de VERB, SUBJECT CLAUSE',
        'SUBJECT VERB para que CLAUSE',
        'Si CONDITION, entonces RESULT',
        'SUBJECT ha/había PAST_PARTICIPLE',
        'SUBJECT va a VERB',
        'Cuanto más SUBJECT VERB, más ADJECTIVE',
        'SUBJECT tanto VERB como VERB',
        'En lugar de VERB, SUBJECT VERB'
      ],
      french: [
        'SUBJECT VERB parce que CLAUSE',
        'Bien que CLAUSE, SUBJECT VERB',
        'Après avoir PAST_PARTICIPLE, CLAUSE',
        'SUBJECT VERB pour que CLAUSE',
        'Si CONDITION, alors RESULT',
        'SUBJECT a/avait PAST_PARTICIPLE',
        'SUBJECT va VERB',
        'Plus SUBJECT VERB, plus ADJECTIVE',
        'SUBJECT non seulement VERB mais aussi VERB',
        'Au lieu de VERB, SUBJECT VERB'
      ],
      portuguese: [
        'SUBJECT VERB porque CLAUSE',
        'Embora CLAUSE, SUBJECT VERB',
        'Depois de VERB, SUBJECT CLAUSE',
        'SUBJECT VERB para que CLAUSE',
        'Se CONDITION, então RESULT',
        'SUBJECT tem/tinha PAST_PARTICIPLE',
        'SUBJECT vai VERB',
        'Quanto mais SUBJECT VERB, mais ADJECTIVE',
        'SUBJECT tanto VERB quanto VERB',
        'Em vez de VERB, SUBJECT VERB'
      ],
      italian: [
        'SUBJECT VERB perché CLAUSE',
        'Benché CLAUSE, SUBJECT VERB',
        'Dopo aver PAST_PARTICIPLE, CLAUSE',
        'SUBJECT VERB perché CLAUSE',
        'Se CONDITION, allora RESULT',
        'SUBJECT ha/aveva PAST_PARTICIPLE',
        'SUBJECT sta per VERB',
        'Più SUBJECT VERB, più ADJECTIVE',
        'SUBJECT non solo VERB ma anche VERB',
        'Invece di VERB, SUBJECT VERB'
      ]
    },
    advanced: {
      german: [
        'Infolgedessen VERB SUBJECT, wodurch CLAUSE',
        'Trotz der Tatsache, dass CLAUSE, VERB SUBJECT',
        'Soweit SUBJECT VERB, CLAUSE',
        'Unter der Voraussetzung, dass CLAUSE, VERB SUBJECT',
        'Abgesehen davon, dass CLAUSE, VERB SUBJECT',
        'Im Hinblick darauf, dass CLAUSE, VERB SUBJECT',
        'Ungeachtet dessen, dass CLAUSE, VERB SUBJECT',
        'Sofern SUBJECT nicht VERB, CLAUSE',
        'Insofern SUBJECT VERB, CLAUSE',
        'Unbeschadet der Tatsache, dass CLAUSE'
      ],
      spanish: [
        'Por consiguiente SUBJECT VERB, lo cual CLAUSE',
        'A pesar del hecho de que CLAUSE, SUBJECT VERB',
        'En la medida en que SUBJECT VERB, CLAUSE',
        'Bajo la condición de que CLAUSE, SUBJECT VERB',
        'Independientemente de que CLAUSE, SUBJECT VERB',
        'Con respecto al hecho de que CLAUSE, SUBJECT VERB',
        'Sin perjuicio de que CLAUSE, SUBJECT VERB',
        'A menos que SUBJECT VERB, CLAUSE',
        'En tanto que SUBJECT VERB, CLAUSE',
        'No obstante el hecho de que CLAUSE'
      ],
      french: [
        'Par conséquent SUBJECT VERB, ce qui CLAUSE',
        'Malgré le fait que CLAUSE, SUBJECT VERB',
        'Dans la mesure où SUBJECT VERB, CLAUSE',
        'À condition que CLAUSE, SUBJECT VERB',
        'Indépendamment du fait que CLAUSE, SUBJECT VERB',
        'En ce qui concerne le fait que CLAUSE, SUBJECT VERB',
        'Sans préjudice du fait que CLAUSE, SUBJECT VERB',
        'À moins que SUBJECT ne VERB, CLAUSE',
        'En tant que SUBJECT VERB, CLAUSE',
        'Nonobstant le fait que CLAUSE'
      ],
      portuguese: [
        'Por conseguinte SUBJECT VERB, o que CLAUSE',
        'Apesar do fato de que CLAUSE, SUBJECT VERB',
        'Na medida em que SUBJECT VERB, CLAUSE',
        'Sob a condição de que CLAUSE, SUBJECT VERB',
        'Independentemente do fato de que CLAUSE, SUBJECT VERB',
        'No que diz respeito ao fato de que CLAUSE, SUBJECT VERB',
        'Sem prejuízo do fato de que CLAUSE, SUBJECT VERB',
        'A menos que SUBJECT VERB, CLAUSE',
        'Na medida em que SUBJECT VERB, CLAUSE',
        'Não obstante o fato de que CLAUSE'
      ],
      italian: [
        'Di conseguenza SUBJECT VERB, il che CLAUSE',
        'Nonostante il fatto che CLAUSE, SUBJECT VERB',
        'Nella misura in cui SUBJECT VERB, CLAUSE',
        'A condizione che CLAUSE, SUBJECT VERB',
        'Indipendentemente dal fatto che CLAUSE, SUBJECT VERB',
        'Per quanto riguarda il fatto che CLAUSE, SUBJECT VERB',
        'Senza pregiudizio del fatto che CLAUSE, SUBJECT VERB',
        'A meno che SUBJECT non VERB, CLAUSE',
        'Nella misura in cui SUBJECT VERB, CLAUSE',
        'Ciononostante il fatto che CLAUSE'
      ]
    }
  };

  static async analyzePatternDiversity(
    userId: string,
    language: string,
    sessionId?: string,
    lookbackDays: number = 7
  ): Promise<DiversityMetrics> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

      // Get recent sentences
      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('sentence, created_at, session_id')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (!exercises || exercises.length === 0) {
        return {
          structuralDiversity: 100,
          contextualDiversity: 100,
          temporalSpread: 100,
          overallDiversity: 100
        };
      }

      // Analyze sentence patterns
      const patternStats = this.extractPatternStats(exercises, language);
      
      // Calculate diversity metrics
      const structuralDiversity = this.calculateStructuralDiversity(patternStats);
      const contextualDiversity = this.calculateContextualDiversity(patternStats);
      const temporalSpread = this.calculateTemporalSpread(exercises);
      
      const overallDiversity = (structuralDiversity + contextualDiversity + temporalSpread) / 3;

      return {
        structuralDiversity,
        contextualDiversity,
        temporalSpread,
        overallDiversity
      };
    } catch (error) {
      console.error('[PatternDiversity] Error analyzing diversity:', error);
      return {
        structuralDiversity: 50,
        contextualDiversity: 50,
        temporalSpread: 50,
        overallDiversity: 50
      };
    }
  }

  static async getAvoidancePatterns(
    userId: string,
    language: string,
    difficultyLevel: string,
    sessionId: string
  ): Promise<string[]> {
    const diversityMetrics = await this.analyzePatternDiversity(userId, language, sessionId);
    
    // If diversity is low, return overused patterns to avoid
    if (diversityMetrics.overallDiversity < 60) {
      const patternUsage = await this.getRecentPatternUsage(userId, language, sessionId);
      
      // Return the most frequently used patterns
      return patternUsage
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(p => p.pattern);
    }

    return [];
  }

  static async suggestNovelPatterns(
    language: string,
    difficultyLevel: string,
    avoidPatterns: string[] = []
  ): Promise<string[]> {
    const templates = this.PATTERN_TEMPLATES[difficultyLevel as keyof typeof this.PATTERN_TEMPLATES];
    const languageTemplates = templates?.[language as keyof typeof templates] || templates?.['german'] || [];
    
    // Filter out patterns to avoid
    const availablePatterns = languageTemplates.filter(pattern => 
      !avoidPatterns.some(avoid => pattern.includes(avoid))
    );

    // Shuffle and return top 3 novel patterns
    return this.shuffleArray(availablePatterns).slice(0, 3);
  }

  static extractSentenceStructure(sentence: string, language: string): string {
    // Simplified pattern extraction based on sentence structure
    const words = sentence.toLowerCase().split(/\s+/);
    
    // Language-specific pattern recognition
    switch (language) {
      case 'german':
        return this.extractGermanPattern(words);
      case 'spanish':
        return this.extractSpanishPattern(words);
      case 'french':
        return this.extractFrenchPattern(words);
      case 'portuguese':
        return this.extractPortuguesePattern(words);
      case 'italian':
        return this.extractItalianPattern(words);
      default:
        return this.extractGenericPattern(words);
    }
  }

  private static async getRecentPatternUsage(
    userId: string,
    language: string,
    sessionId: string
  ): Promise<PatternUsageStats[]> {
    const { data: exercises } = await supabase
      .from('sentence_mining_exercises')
      .select('sentence, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!exercises) return [];

    const patternCounts: Map<string, PatternUsageStats> = new Map();

    exercises.forEach(exercise => {
      const pattern = this.extractSentenceStructure(exercise.sentence, language);
      
      if (patternCounts.has(pattern)) {
        const stats = patternCounts.get(pattern)!;
        stats.count++;
        if (new Date(exercise.created_at) > stats.lastUsed) {
          stats.lastUsed = new Date(exercise.created_at);
        }
      } else {
        patternCounts.set(pattern, {
          pattern,
          count: 1,
          lastUsed: new Date(exercise.created_at),
          contexts: [this.extractContext(exercise.sentence)]
        });
      }
    });

    return Array.from(patternCounts.values());
  }

  private static extractPatternStats(exercises: any[], language: string): PatternUsageStats[] {
    const patternCounts: Map<string, PatternUsageStats> = new Map();

    exercises.forEach(exercise => {
      const pattern = this.extractSentenceStructure(exercise.sentence, language);
      
      if (patternCounts.has(pattern)) {
        const stats = patternCounts.get(pattern)!;
        stats.count++;
        if (new Date(exercise.created_at) > stats.lastUsed) {
          stats.lastUsed = new Date(exercise.created_at);
        }
      } else {
        patternCounts.set(pattern, {
          pattern,
          count: 1,
          lastUsed: new Date(exercise.created_at),
          contexts: [this.extractContext(exercise.sentence)]
        });
      }
    });

    return Array.from(patternCounts.values());
  }

  private static calculateStructuralDiversity(patternStats: PatternUsageStats[]): number {
    if (patternStats.length === 0) return 100;
    
    const totalUsage = patternStats.reduce((sum, stat) => sum + stat.count, 0);
    const uniquePatterns = patternStats.length;
    
    // Calculate entropy-like measure
    let entropy = 0;
    patternStats.forEach(stat => {
      const probability = stat.count / totalUsage;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    });
    
    // Normalize to 0-100 scale
    const maxEntropy = Math.log2(uniquePatterns);
    return maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
  }

  private static calculateContextualDiversity(patternStats: PatternUsageStats[]): number {
    const allContexts = patternStats.flatMap(stat => stat.contexts);
    const uniqueContexts = new Set(allContexts).size;
    
    // Score based on context variety
    return Math.min(100, (uniqueContexts / Math.max(1, allContexts.length)) * 100);
  }

  private static calculateTemporalSpread(exercises: any[]): number {
    if (exercises.length <= 1) return 100;
    
    const timestamps = exercises.map(e => new Date(e.created_at).getTime());
    const timeSpan = Math.max(...timestamps) - Math.min(...timestamps);
    const averageGap = timeSpan / (timestamps.length - 1);
    
    // Score based on temporal distribution
    const idealGap = 3600000; // 1 hour in milliseconds
    return Math.min(100, (averageGap / idealGap) * 100);
  }

  private static extractGermanPattern(words: string[]): string {
    // Basic German sentence pattern recognition
    if (words.includes('weil') || words.includes('dass')) return 'SUBORDINATE_CLAUSE';
    if (words.includes('haben') || words.includes('sein')) return 'PERFECT_TENSE';
    if (words.includes('werden')) return 'FUTURE_PASSIVE';
    if (words.some(w => w.endsWith('en') && words.indexOf(w) > 1)) return 'VERB_FINAL';
    return 'BASIC_SVO';
  }

  private static extractSpanishPattern(words: string[]): string {
    // Basic Spanish sentence pattern recognition
    if (words.includes('que') && words.includes('es')) return 'SUBJUNCTIVE_CLAUSE';
    if (words.includes('ha') || words.includes('había')) return 'PERFECT_TENSE';
    if (words.includes('está') || words.includes('es')) return 'COPULAR_VERB';
    if (words.includes('me') || words.includes('te') || words.includes('se')) return 'REFLEXIVE';
    return 'BASIC_SVO';
  }

  private static extractFrenchPattern(words: string[]): string {
    // Basic French sentence pattern recognition
    if (words.includes('que') && words.includes('il')) return 'SUBJUNCTIVE_CLAUSE';
    if (words.includes('a') || words.includes('avait')) return 'PERFECT_TENSE';
    if (words.includes('est') || words.includes('être')) return 'COPULAR_VERB';
    if (words.includes('me') || words.includes('te') || words.includes('se')) return 'REFLEXIVE';
    return 'BASIC_SVO';
  }

  private static extractPortuguesePattern(words: string[]): string {
    // Basic Portuguese sentence pattern recognition
    if (words.includes('que') && words.includes('é')) return 'SUBJUNCTIVE_CLAUSE';
    if (words.includes('tem') || words.includes('tinha')) return 'PERFECT_TENSE';
    if (words.includes('está') || words.includes('é')) return 'COPULAR_VERB';
    if (words.includes('me') || words.includes('te') || words.includes('se')) return 'REFLEXIVE';
    return 'BASIC_SVO';
  }

  private static extractItalianPattern(words: string[]): string {
    // Basic Italian sentence pattern recognition
    if (words.includes('che') && words.includes('è')) return 'SUBJUNCTIVE_CLAUSE';
    if (words.includes('ha') || words.includes('aveva')) return 'PERFECT_TENSE';
    if (words.includes('è') || words.includes('essere')) return 'COPULAR_VERB';
    if (words.includes('mi') || words.includes('ti') || words.includes('si')) return 'REFLEXIVE';
    return 'BASIC_SVO';
  }

  private static extractGenericPattern(words: string[]): string {
    // Generic pattern extraction
    if (words.length <= 3) return 'SHORT_SENTENCE';
    if (words.length >= 8) return 'LONG_SENTENCE';
    if (words.includes(',')) return 'COMPLEX_SENTENCE';
    return 'MEDIUM_SENTENCE';
  }

  private static extractContext(sentence: string): string {
    // Extract thematic context from sentence
    const lowerSentence = sentence.toLowerCase();
    
    if (lowerSentence.includes('haus') || lowerSentence.includes('home') || lowerSentence.includes('casa')) return 'home';
    if (lowerSentence.includes('essen') || lowerSentence.includes('food') || lowerSentence.includes('comida')) return 'food';
    if (lowerSentence.includes('arbeit') || lowerSentence.includes('work') || lowerSentence.includes('trabajo')) return 'work';
    if (lowerSentence.includes('zeit') || lowerSentence.includes('time') || lowerSentence.includes('tiempo')) return 'time';
    
    return 'general';
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
