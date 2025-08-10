
import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel } from '@/types/sentence-mining';

export interface SentencePattern {
  structure: string;
  complexity: number;
  frequency: number;
  lastUsed?: Date;
}

export interface PatternDiversityMetrics {
  uniquePatterns: number;
  averageComplexity: number;
  patternDistribution: number;
  recentPatternCount: number;
}

export class SentencePatternDiversityEngine {
  private static readonly PATTERN_COOLDOWN_HOURS = 6;
  private static readonly MIN_PATTERN_VARIETY = 3;

  static async getAvoidancePatterns(
    userId: string,
    language: string,
    difficulty: DifficultyLevel,
    sessionId: string,
    lookbackHours: number = 12
  ): Promise<string[]> {
    try {
      const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

      // Get recent exercises to analyze patterns
      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('sentence, created_at')
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (!exercises || exercises.length === 0) {
        return [];
      }

      // Extract and count sentence patterns
      const patternCounts = new Map<string, number>();
      exercises.forEach(exercise => {
        const pattern = this.extractSentenceStructure(exercise.sentence, language);
        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
      });

      // Return patterns that have been used too frequently
      const avoidPatterns: string[] = [];
      const threshold = Math.max(2, Math.floor(exercises.length / 6));

      for (const [pattern, count] of patternCounts) {
        if (count >= threshold) {
          avoidPatterns.push(pattern);
        }
      }

      console.log(`[SentencePatternDiversityEngine] Avoiding ${avoidPatterns.length} overused patterns from ${patternCounts.size} total patterns`);
      return avoidPatterns;
    } catch (error) {
      console.error('[SentencePatternDiversityEngine] Error getting avoidance patterns:', error);
      return [];
    }
  }

  static extractSentenceStructure(sentence: string, language: string): string {
    if (!sentence) return 'unknown';

    const cleanSentence = sentence.toLowerCase().trim();
    const words = cleanSentence.split(/\s+/);
    const length = words.length;

    let pattern = '';

    // Length classification
    if (length <= 5) pattern += 'short_';
    else if (length <= 10) pattern += 'medium_';
    else if (length <= 15) pattern += 'long_';
    else pattern += 'complex_';

    // Structural analysis
    if (sentence.includes('?')) pattern += 'question_';
    if (sentence.includes('!')) pattern += 'exclamation_';
    if (sentence.includes(',')) pattern += 'comma_';
    if (sentence.includes(';')) pattern += 'semicolon_';

    // Language-specific patterns
    switch (language.toLowerCase()) {
      case 'german':
        if (/\b(weil|da|obwohl|wenn|falls)\b/i.test(sentence)) pattern += 'subordinate_';
        if (/\b(und|oder|aber|sondern)\b/i.test(sentence)) pattern += 'coordinate_';
        if (/\b(der|die|das)\s+\w+\s+(ist|sind|war|waren)\b/i.test(sentence)) pattern += 'copula_';
        break;
      case 'spanish':
        if (/\b(que|porque|aunque|si|cuando)\b/i.test(sentence)) pattern += 'subordinate_';
        if (/\b(y|o|pero|sino)\b/i.test(sentence)) pattern += 'coordinate_';
        if (/\b(es|son|era|eran)\b/i.test(sentence)) pattern += 'copula_';
        break;
      case 'french':
        if (/\b(que|parce que|bien que|si|quand)\b/i.test(sentence)) pattern += 'subordinate_';
        if (/\b(et|ou|mais|donc)\b/i.test(sentence)) pattern += 'coordinate_';
        if (/\b(est|sont|était|étaient)\b/i.test(sentence)) pattern += 'copula_';
        break;
    }

    // Verb patterns
    const verbCount = this.countVerbs(sentence, language);
    if (verbCount === 1) pattern += 'simple_verb_';
    else if (verbCount >= 2) pattern += 'multi_verb_';

    return pattern || 'basic';
  }

  static async analyzePatternDiversity(
    userId: string,
    language: string,
    sessionId: string,
    lookbackHours: number = 24
  ): Promise<PatternDiversityMetrics> {
    try {
      const cutoffTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

      const { data: exercises } = await supabase
        .from('sentence_mining_exercises')
        .select('sentence, created_at')
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false });

      if (!exercises || exercises.length === 0) {
        return {
          uniquePatterns: 0,
          averageComplexity: 0,
          patternDistribution: 100,
          recentPatternCount: 0
        };
      }

      const patterns = exercises.map(e => this.extractSentenceStructure(e.sentence, language));
      const uniquePatterns = new Set(patterns).size;
      const patternDistribution = patterns.length > 0 ? (uniquePatterns / patterns.length) * 100 : 0;

      // Calculate average complexity (rough estimate based on pattern features)
      const averageComplexity = patterns.reduce((sum, pattern) => {
        const features = pattern.split('_').length;
        return sum + Math.min(features * 10, 100);
      }, 0) / patterns.length;

      return {
        uniquePatterns,
        averageComplexity: Math.round(averageComplexity),
        patternDistribution: Math.round(patternDistribution),
        recentPatternCount: patterns.length
      };
    } catch (error) {
      console.error('[SentencePatternDiversityEngine] Error analyzing diversity:', error);
      return {
        uniquePatterns: 0,
        averageComplexity: 50,
        patternDistribution: 50,
        recentPatternCount: 0
      };
    }
  }

  private static countVerbs(sentence: string, language: string): number {
    // Simple verb detection - in a real implementation, this would use proper NLP
    const commonVerbs = {
      german: ['ist', 'sind', 'war', 'waren', 'hat', 'haben', 'wird', 'werden', 'kann', 'könnte', 'muss', 'soll', 'geht', 'kommt', 'macht', 'sagt', 'sieht'],
      spanish: ['es', 'son', 'era', 'eran', 'tiene', 'tienen', 'va', 'van', 'hace', 'hacen', 'dice', 'dicen', 've', 'ven'],
      french: ['est', 'sont', 'était', 'étaient', 'a', 'ont', 'va', 'vont', 'fait', 'font', 'dit', 'disent', 'voit', 'voient'],
      english: ['is', 'are', 'was', 'were', 'has', 'have', 'goes', 'go', 'does', 'do', 'says', 'say', 'sees', 'see']
    };

    const verbs = commonVerbs[language.toLowerCase() as keyof typeof commonVerbs] || commonVerbs.english;
    const words = sentence.toLowerCase().split(/\s+/);
    
    return words.filter(word => verbs.includes(word.replace(/[.,!?;]$/, ''))).length;
  }
}
