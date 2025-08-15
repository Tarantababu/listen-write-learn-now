
import { WordFrequencyService } from './wordFrequencyService';

export class WordUsageTracker {
  static trackWordUsage(
    userId: string,
    word: string,
    language: string,
    sessionId: string,
    isCorrect?: boolean
  ): void {
    console.log(`[WordUsageTracker] Tracking word usage: ${word} (${isCorrect ? 'correct' : 'incorrect'})`);
    
    try {
      const sessionData = WordFrequencyService.getSessionData(language);
      if (!sessionData.wordUsage) {
        sessionData.wordUsage = {};
      }
      
      if (!sessionData.wordUsage[word]) {
        sessionData.wordUsage[word] = { count: 0, correct: 0, lastUsed: Date.now() };
      }
      
      sessionData.wordUsage[word].count++;
      if (isCorrect) {
        sessionData.wordUsage[word].correct++;
      }
      sessionData.wordUsage[word].lastUsed = Date.now();
      
      sessionData.totalExercises = (sessionData.totalExercises || 0) + 1;
      if (isCorrect) {
        sessionData.correctAnswers = (sessionData.correctAnswers || 0) + 1;
      }
      
      console.log(`[WordUsageTracker] Word usage tracked for ${word}`);
    } catch (error) {
      console.error('[WordUsageTracker] Error tracking word usage:', error);
    }
  }
}
