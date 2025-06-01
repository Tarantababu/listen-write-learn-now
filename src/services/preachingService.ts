
import { supabase } from '@/integrations/supabase/client';
import type { Noun, PatternDrill, PreachingDifficulty, DrillAttempt } from '@/types/preaching';

class PreachingService {
  private static instance: PreachingService;

  static getInstance(): PreachingService {
    if (!PreachingService.instance) {
      PreachingService.instance = new PreachingService();
    }
    return PreachingService.instance;
  }

  // Generate nouns for the session
  async generateNouns(difficulty: PreachingDifficulty): Promise<Noun[]> {
    const { data, error } = await supabase.functions.invoke('generate-preaching-content', {
      body: {
        type: 'nouns',
        difficulty,
        count: difficulty === 'simple' ? 5 : difficulty === 'normal' ? 7 : 10
      }
    });

    if (error) throw error;
    return data.nouns;
  }

  // Generate pattern drill
  async generatePatternDrill(
    nouns: Noun[], 
    difficulty: PreachingDifficulty,
    previousPatterns: string[] = []
  ): Promise<PatternDrill> {
    const { data, error } = await supabase.functions.invoke('generate-preaching-content', {
      body: {
        type: 'pattern',
        difficulty,
        nouns,
        previousPatterns
      }
    });

    if (error) throw error;
    return data.drill;
  }

  // Get gender explanation
  async getGenderExplanation(noun: Noun): Promise<string> {
    const { data, error } = await supabase.functions.invoke('generate-preaching-content', {
      body: {
        type: 'explanation',
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
    pattern: string
  ): Promise<{ isCorrect: boolean; feedback: string; corrections: string[] }> {
    const { data, error } = await supabase.functions.invoke('generate-preaching-content', {
      body: {
        type: 'evaluation',
        expectedAnswer,
        userSpeech,
        pattern
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
