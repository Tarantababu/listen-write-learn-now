import { supabase } from '@/integrations/supabase/client';
import { DifficultyLevel, SentenceMiningExercise, SentenceMiningSession } from '@/types/sentence-mining';
import { IntelligentWordSelection } from './intelligentWordSelection';
import { EnhancedCooldownSystem } from './enhancedCooldownSystem';
import { SentencePatternDiversityEngine } from './sentencePatternDiversityEngine';

export interface GenerationParams {
  language: string;
  difficulty: DifficultyLevel;
  userId: string;
  sessionId: string;
  previousExercises?: SentenceMiningExercise[];
  enhancedMode?: boolean;
}

export interface GenerationResult {
  exercise: SentenceMiningExercise;
  metadata: {
    generationTime: number;
    fallbackUsed: boolean;
    selectionQuality: number;
    diversityScore: number;
    wordSelectionReason: string;
  };
}

export class EnhancedSentenceMiningService {
  private static cache = new Map<string, any>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async generateExerciseWithEnhancements(params: GenerationParams): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[EnhancedSentenceMiningService] Starting enhanced generation for ${params.language} (${params.difficulty})`);

      // Step 1: Intelligent word selection
      const wordSelection = await IntelligentWordSelection.selectOptimalWords({
        language: params.language,
        difficultyLevel: params.difficulty,
        userId: params.userId,
        sessionId: params.sessionId,
        targetCount: 1,
        previousWords: params.previousExercises?.map(e => e.targetWord) || []
      });

      // Step 2: Pattern diversity analysis
      const diversityMetrics = await SentencePatternDiversityEngine.analyzePatternDiversity(
        params.userId,
        params.language,
        params.sessionId
      );

      // Step 3: Get avoidance patterns
      const avoidPatterns = await SentencePatternDiversityEngine.getAvoidancePatterns(
        params.userId,
        params.language,
        params.difficulty,
        params.sessionId
      );

      // Step 4: Prepare generation parameters
      const previousSentences = params.previousExercises?.map(e => e.sentence) || [];
      
      // Step 5: Call enhanced edge function
      const { data: rawExercise, error } = await supabase.functions.invoke('generate-sentence-mining', {
        body: {
          language: params.language,
          difficulty_level: params.difficulty,
          session_id: params.sessionId,
          user_id: params.userId,
          previous_sentences: previousSentences,
          n_plus_one: true,
          // Enhanced parameters
          preferred_words: wordSelection.selectedWords,
          novelty_words: [], // Could be enhanced later
          avoid_patterns: avoidPatterns,
          diversity_score_target: Math.max(70, diversityMetrics.overallDiversity),
          selection_quality: wordSelection.selectionQuality,
          enhanced_mode: params.enhancedMode || true
        }
      });

      if (error) {
        console.error('[EnhancedSentenceMiningService] Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      // Step 6: Process and enhance the response
      const exercise: SentenceMiningExercise = {
        id: rawExercise.id || crypto.randomUUID(),
        sentence: rawExercise.sentence,
        targetWord: rawExercise.targetWord,
        clozeSentence: rawExercise.clozeSentence,
        difficulty: params.difficulty,
        context: rawExercise.context,
        createdAt: new Date(rawExercise.createdAt || Date.now()),
        attempts: 0,
        correctAttempts: 0,
        translation: rawExercise.translation,
        correctAnswer: rawExercise.targetWord,
        hints: rawExercise.hints || [],
        session_id: params.sessionId,
        difficultyScore: rawExercise.difficultyScore,
        isSkipped: false
      };

      // Step 7: Track word usage for cooldown
      if (exercise.targetWord) {
        await EnhancedCooldownSystem.trackWordUsage(
          params.userId,
          exercise.targetWord,
          params.language,
          params.sessionId,
          exercise.sentence,
          SentencePatternDiversityEngine.extractSentenceStructure(exercise.sentence, params.language)
        );
      }

      const generationTime = Date.now() - startTime;
      console.log(`[EnhancedSentenceMiningService] Exercise generated successfully in ${generationTime}ms`);

      return {
        exercise,
        metadata: {
          generationTime,
          fallbackUsed: rawExercise.fallbackUsed || false,
          selectionQuality: wordSelection.selectionQuality,
          diversityScore: diversityMetrics.overallDiversity,
          wordSelectionReason: rawExercise.wordSelectionReason || wordSelection.reasons.join(', ')
        }
      };

    } catch (error) {
      console.error('[EnhancedSentenceMiningService] Generation error:', error);
      
      // Enhanced fallback with better error recovery and language awareness
      const fallbackExercise = await this.createLanguageAwareFallbackExercise(params);
      
      return {
        exercise: fallbackExercise,
        metadata: {
          generationTime: Date.now() - startTime,
          fallbackUsed: true,
          selectionQuality: 50,
          diversityScore: 50,
          wordSelectionReason: `Fallback due to generation error for ${params.language}`
        }
      };
    }
  }

  private static async createLanguageAwareFallbackExercise(params: GenerationParams): Promise<SentenceMiningExercise> {
    console.log(`[EnhancedSentenceMiningService] Creating language-aware fallback for ${params.language}`);

    // Comprehensive fallback exercises for all supported languages
    const languageAwareFallbacks = {
      beginner: {
        german: [
          {
            sentence: "Ich trinke jeden Morgen Kaffee.",
            targetWord: "Morgen",
            clozeSentence: "Ich trinke jeden ___ Kaffee.",
            translation: "I drink coffee every morning.",
            context: "Daily routine"
          },
          {
            sentence: "Das Wetter ist heute sehr schön.",
            targetWord: "Wetter",
            clozeSentence: "Das ___ ist heute sehr schön.",
            translation: "The weather is very beautiful today.",
            context: "Weather discussion"
          }
        ],
        spanish: [
          {
            sentence: "Me gusta caminar en el parque.",
            targetWord: "caminar",
            clozeSentence: "Me gusta ___ en el parque.",
            translation: "I like to walk in the park.",
            context: "Recreation activities"
          },
          {
            sentence: "El sol brilla mucho hoy.",
            targetWord: "sol",
            clozeSentence: "El ___ brilla mucho hoy.",
            translation: "The sun shines a lot today.",
            context: "Weather description"
          }
        ],
        french: [
          {
            sentence: "Je mange du pain au petit-déjeuner.",
            targetWord: "pain",
            clozeSentence: "Je mange du ___ au petit-déjeuner.",
            translation: "I eat bread for breakfast.",
            context: "Morning routine"
          },
          {
            sentence: "Le magasin est fermé le dimanche.",
            targetWord: "magasin",
            clozeSentence: "Le ___ est fermé le dimanche.",
            translation: "The store is closed on Sunday.",
            context: "Shopping information"
          }
        ],
        italian: [
          {
            sentence: "Io mangio la pasta ogni giorno.",
            targetWord: "mangio",
            clozeSentence: "Io ___ la pasta ogni giorno.",
            translation: "I eat pasta every day.",
            context: "Daily meals"
          },
          {
            sentence: "Il tempo è molto bello oggi.",
            targetWord: "tempo",
            clozeSentence: "Il ___ è molto bello oggi.",
            translation: "The weather is very beautiful today.",
            context: "Weather discussion"
          }
        ],
        portuguese: [
          {
            sentence: "Eu bebo café todas as manhãs.",
            targetWord: "bebo",
            clozeSentence: "Eu ___ café todas as manhãs.",
            translation: "I drink coffee every morning.",
            context: "Morning routine"
          },
          {
            sentence: "O tempo está muito bonito hoje.",
            targetWord: "tempo",
            clozeSentence: "O ___ está muito bonito hoje.",
            translation: "The weather is very beautiful today.",
            context: "Weather observation"
          }
        ],
        dutch: [
          {
            sentence: "Ik drink elke ochtend koffie.",
            targetWord: "ochtend",
            clozeSentence: "Ik drink elke ___ koffie.",
            translation: "I drink coffee every morning.",
            context: "Daily routine"
          },
          {
            sentence: "Het weer is vandaag heel mooi.",
            targetWord: "weer",
            clozeSentence: "Het ___ is vandaag heel mooi.",
            translation: "The weather is very beautiful today.",
            context: "Weather comment"
          }
        ],
        norwegian: [
          {
            sentence: "Jeg drikker kaffe hver morgen.",
            targetWord: "kaffe",
            clozeSentence: "Jeg drikker ___ hver morgen.",
            translation: "I drink coffee every morning.",
            context: "Morning routine"
          },
          {
            sentence: "Været er meget pent i dag.",
            targetWord: "pent",
            clozeSentence: "Været er meget ___ i dag.",
            translation: "The weather is very nice today.",
            context: "Weather observation"
          }
        ],
        swedish: [
          {
            sentence: "Jag dricker kaffe varje morgon.",
            targetWord: "kaffe",
            clozeSentence: "Jag dricker ___ varje morgon.",
            translation: "I drink coffee every morning.",
            context: "Daily routine"
          },
          {
            sentence: "Vädret är mycket vackert idag.",
            targetWord: "vackert",
            clozeSentence: "Vädret är mycket ___ idag.",
            translation: "The weather is very beautiful today.",
            context: "Weather description"
          }
        ],
        english: [
          {
            sentence: "I drink coffee every morning.",
            targetWord: "coffee",
            clozeSentence: "I drink ___ every morning.",
            translation: "I drink coffee every morning.",
            context: "Daily routine"
          },
          {
            sentence: "The weather is very beautiful today.",
            targetWord: "weather",
            clozeSentence: "The ___ is very beautiful today.",
            translation: "The weather is very beautiful today.",
            context: "Weather observation"
          }
        ]
      },
      intermediate: {
        german: [
          {
            sentence: "Obwohl es regnet, gehen wir spazieren.",
            targetWord: "spazieren",
            clozeSentence: "Obwohl es regnet, gehen wir ___.",
            translation: "Although it's raining, we go for a walk.",
            context: "Weather and activities"
          }
        ],
        spanish: [
          {
            sentence: "Aunque llueve, nosotros vamos al parque.",
            targetWord: "vamos",
            clozeSentence: "Aunque llueve, nosotros ___ al parque.",
            translation: "Although it rains, we go to the park.",
            context: "Weather and activities"
          }
        ],
        french: [
          {
            sentence: "Bien qu'il pleuve, nous allons au parc.",
            targetWord: "allons",
            clozeSentence: "Bien qu'il pleuve, nous ___ au parc.",
            translation: "Although it rains, we go to the park.",
            context: "Weather and activities"
          }
        ]
      },
      advanced: {
        german: [
          {
            sentence: "Die Regierung hat neue Maßnahmen zur Bekämpfung der Inflation beschlossen.",
            targetWord: "Bekämpfung",
            clozeSentence: "Die Regierung hat neue Maßnahmen zur ___ der Inflation beschlossen.",
            translation: "The government has decided on new measures to combat inflation.",
            context: "Economic policy"
          }
        ],
        spanish: [
          {
            sentence: "La situación económica ha mejorado significativamente.",
            targetWord: "económica",
            clozeSentence: "La situación ___ ha mejorado significativamente.",
            translation: "The economic situation has improved significantly.",
            context: "Economic analysis"
          }
        ],
        french: [
          {
            sentence: "La situación económica s'est nettement améliorée.",
            targetWord: "économique",
            clozeSentence: "La situation ___ s'est nettement améliorée.",
            translation: "The economic situation has improved significantly.",
            context: "Economic discussion"
          }
        ]
      }
    };

    // Get language-specific fallbacks
    const normalizedLanguage = params.language.toLowerCase();
    const levelExercises = languageAwareFallbacks[params.difficulty]?.[normalizedLanguage as keyof typeof languageAwareFallbacks[typeof params.difficulty]] || 
                          languageAwareFallbacks.beginner[normalizedLanguage as keyof typeof languageAwareFallbacks['beginner']] ||
                          languageAwareFallbacks.beginner.german;

    const randomExercise = levelExercises[Math.floor(Math.random() * levelExercises.length)];

    console.log(`[EnhancedSentenceMiningService] Created language-aware fallback for ${params.language}: ${randomExercise.targetWord}`);

    return {
      id: crypto.randomUUID(),
      sentence: randomExercise.sentence,
      targetWord: randomExercise.targetWord,
      clozeSentence: randomExercise.clozeSentence,
      difficulty: params.difficulty,
      context: randomExercise.context,
      createdAt: new Date(),
      attempts: 0,
      correctAttempts: 0,
      translation: randomExercise.translation,
      correctAnswer: randomExercise.targetWord,
      hints: [`Think about the context: "${randomExercise.context}"`],
      session_id: params.sessionId,
      difficultyScore: params.difficulty === 'beginner' ? 3 : params.difficulty === 'intermediate' ? 5 : 7,
      isSkipped: false
    };
  }

  static async batchGenerateExercises(
    params: GenerationParams,
    count: number
  ): Promise<GenerationResult[]> {
    console.log(`[EnhancedSentenceMiningService] Batch generating ${count} exercises`);
    
    const results: GenerationResult[] = [];
    const previousExercises = params.previousExercises || [];

    for (let i = 0; i < count; i++) {
      try {
        const result = await this.generateExerciseWithEnhancements({
          ...params,
          previousExercises: [...previousExercises, ...results.map(r => r.exercise)]
        });
        
        results.push(result);
        
        // Small delay to avoid overwhelming the system
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`[EnhancedSentenceMiningService] Error generating exercise ${i + 1}:`, error);
        // Continue with remaining exercises
      }
    }

    return results;
  }

  static async preloadExercises(
    userId: string,
    language: string,
    difficulty: DifficultyLevel,
    sessionId: string,
    count: number = 3
  ): Promise<void> {
    const cacheKey = `preload_${userId}_${language}_${difficulty}_${sessionId}`;
    
    try {
      console.log(`[EnhancedSentenceMiningService] Preloading ${count} exercises for ${language}`);
      
      const results = await this.batchGenerateExercises({
        language,
        difficulty,
        userId,
        sessionId,
        enhancedMode: true
      }, count);

      // Cache the preloaded exercises
      this.cache.set(cacheKey, {
        exercises: results,
        timestamp: Date.now()
      });

      console.log(`[EnhancedSentenceMiningService] Successfully preloaded ${results.length} exercises for ${language}`);
    } catch (error) {
      console.error(`[EnhancedSentenceMiningService] Preloading failed for ${language}:`, error);
    }
  }

  static getPreloadedExercise(
    userId: string,
    language: string,
    difficulty: DifficultyLevel,
    sessionId: string
  ): GenerationResult | null {
    const cacheKey = `preload_${userId}_${language}_${difficulty}_${sessionId}`;
    const cached = this.cache.get(cacheKey);
    
    if (!cached || Date.now() - cached.timestamp > this.CACHE_DURATION) {
      return null;
    }

    if (cached.exercises && cached.exercises.length > 0) {
      return cached.exercises.shift(); // Return and remove first exercise
    }

    return null;
  }

  static clearCache(sessionId?: string): void {
    if (sessionId) {
      // Clear specific session cache
      for (const [key] of this.cache) {
        if (key.includes(sessionId)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  static getPerformanceMetrics(sessionId: string): {
    averageGenerationTime: number;
    fallbackRate: number;
    averageQuality: number;
  } {
    // This would typically come from stored metrics
    // For now, return default values
    return {
      averageGenerationTime: 2500,
      fallbackRate: 0.05,
      averageQuality: 82
    };
  }
}
