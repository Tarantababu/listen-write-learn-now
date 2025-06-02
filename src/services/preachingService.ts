
import { supabase } from '@/integrations/supabase/client';
import type { Noun, PatternDrill, PreachingDifficulty, DrillAttempt } from '@/types/preaching';
import type { Language } from '@/types';

class PreachingService {
  private static instance: PreachingService;

  static getInstance(): PreachingService {
    if (!PreachingService.instance) {
      PreachingService.instance = new PreachingService();
    }
    return PreachingService.instance;
  }

  // Language-specific configurations
  private getLanguageConfig(language: Language) {
    const configs = {
      german: {
        hasGender: true,
        articles: ['der', 'die', 'das'],
        focusAreas: ['gender', 'cases', 'declension'],
        skipTesting: false
      },
      french: {
        hasGender: true,
        articles: ['le', 'la', 'les'],
        focusAreas: ['gender', 'elision', 'agreement'],
        skipTesting: false
      },
      spanish: {
        hasGender: true,
        articles: ['el', 'la', 'los', 'las'],
        focusAreas: ['verb_conjugation', 'gender'],
        skipTesting: false
      },
      italian: {
        hasGender: true,
        articles: ['il', 'lo', 'la', 'gli', 'le'],
        focusAreas: ['article_forms', 'adjective_agreement'],
        skipTesting: false
      },
      portuguese: {
        hasGender: true,
        articles: ['o', 'a', 'os', 'as'],
        focusAreas: ['verb_tense', 'nasal_pronunciation'],
        skipTesting: false
      },
      english: {
        hasGender: false,
        articles: ['the', 'a', 'an'],
        focusAreas: ['auxiliaries', 'prepositions', 'tenses'],
        skipTesting: true // Skip gender testing for English
      },
      dutch: {
        hasGender: true,
        articles: ['de', 'het'],
        focusAreas: ['separable_verbs', 'word_order'],
        skipTesting: false
      },
      turkish: {
        hasGender: false,
        articles: [], // Turkish doesn't have articles
        focusAreas: ['agglutinative_suffixes', 'vowel_harmony'],
        skipTesting: true
      },
      swedish: {
        hasGender: true,
        articles: ['en', 'ett'],
        focusAreas: ['articles', 'v2_word_order'],
        skipTesting: false
      },
      norwegian: {
        hasGender: true,
        articles: ['en', 'ei', 'et'],
        focusAreas: ['gender', 'definite_nouns', 'tone'],
        skipTesting: false
      }
    };

    return configs[language] || configs.german;
  }

  // Check if language requires gender testing
  shouldSkipGenderTesting(language: Language): boolean {
    const config = this.getLanguageConfig(language);
    return config.skipTesting;
  }

  // Generate nouns for the session
  async generateNouns(
    difficulty: PreachingDifficulty, 
    language: Language = 'german',
    count?: number
  ): Promise<Noun[]> {
    const nounsCount = count || (difficulty === 'simple' ? 5 : difficulty === 'normal' ? 7 : 10);
    
    const { data, error } = await supabase.functions.invoke('generate-preaching-content', {
      body: {
        type: 'nouns',
        difficulty,
        language,
        count: nounsCount
      }
    });

    if (error) throw error;
    return data.nouns;
  }

  // Generate pattern drill
  async generatePatternDrill(
    nouns: Noun[], 
    difficulty: PreachingDifficulty,
    language: Language = 'german',
    previousPatterns: string[] = []
  ): Promise<PatternDrill> {
    const { data, error } = await supabase.functions.invoke('generate-preaching-content', {
      body: {
        type: 'pattern',
        difficulty,
        language,
        nouns,
        previousPatterns
      }
    });

    if (error) throw error;
    return data.drill;
  }

  // Get gender explanation
  async getGenderExplanation(noun: Noun, language: Language = 'german'): Promise<string> {
    const { data, error } = await supabase.functions.invoke('generate-preaching-content', {
      body: {
        type: 'explanation',
        language,
        noun
      }
    });

    if (error) throw error;
    return data.explanation;
  }

  // Evaluate user's speech attempt
  async evaluateSpeech(
    expectedAnswer: string,
    userSpeech: string,
    pattern: string,
    language: Language = 'german'
  ): Promise<{ isCorrect: boolean; feedback: string; corrections: string[] }> {
    const { data, error } = await supabase.functions.invoke('generate-preaching-content', {
      body: {
        type: 'evaluation',
        expectedAnswer,
        userSpeech,
        pattern,
        language
      }
    });

    if (error) throw error;
    return data.evaluation;
  }

  // Save session progress (in local storage for now)
  async saveSessionProgress(sessionData: any): Promise<void> {
    try {
      localStorage.setItem('preaching-session', JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to save session progress to localStorage:', error);
    }
  }

  // Load session progress (from local storage)
  loadSessionProgress(): any {
    try {
      const data = localStorage.getItem('preaching-session');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load session progress from localStorage:', error);
      return null;
    }
  }
}

export const preachingService = PreachingService.getInstance();
