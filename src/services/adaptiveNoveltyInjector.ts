
import { supabase } from '@/integrations/supabase/client';
import { AdvancedWordSelectionEngine } from './advancedWordSelectionEngine';

export interface NoveltyCandidate {
  word: string;
  noveltyScore: number;
  difficultyRating: number;
  contextFit: number;
  learningValue: number;
  frequency: number;
  phoneticsComplexity: number;
  semanticRichness: number;
}

export interface NoveltyInjectionConfig {
  targetNoveltyRatio: number;      // Percentage of exercises that should introduce novelty
  maxNoveltyPerSession: number;    // Maximum new elements per session
  adaptiveThreshold: number;       // User performance threshold for novelty injection
  contextRelevanceWeight: number;  // How much to weight context fit
  difficultyCurve: number;        // How aggressive the difficulty progression should be
}

export interface UserNoveltyProfile {
  userId: string;
  language: string;
  averageAccuracy: number;
  noveltySensitivity: number;      // How well user handles new content
  preferredComplexity: number;     // User's optimal complexity level
  recentNoveltyCount: number;      // Novel elements introduced recently
  adaptationRate: number;          // How quickly user adapts to new content
  lastNoveltyIntroduced: Date | null;
}

export class AdaptiveNoveltyInjector {
  private static readonly DEFAULT_CONFIG: NoveltyInjectionConfig = {
    targetNoveltyRatio: 0.25,        // 25% of exercises should have some novelty
    maxNoveltyPerSession: 3,         // Max 3 novel elements per session
    adaptiveThreshold: 0.75,         // User should have >75% accuracy for novelty
    contextRelevanceWeight: 0.4,     // 40% weight on context fit
    difficultyCurve: 1.2             // Moderate difficulty progression
  };

  private static readonly EXPANDED_WORD_POOLS = {
    beginner: {
      german: [
        // Core vocabulary expansion
        'Freund', 'Freundin', 'Familie', 'Mutter', 'Vater', 'Bruder', 'Schwester', 'Großmutter', 'Großvater',
        'Schule', 'Lehrer', 'Student', 'Buch', 'Stift', 'Papier', 'Computer', 'Telefon', 'Internet',
        'Farbe', 'rot', 'blau', 'grün', 'gelb', 'schwarz', 'weiß', 'lila', 'orange', 'rosa',
        'Zahl', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
        'Wetter', 'Sonne', 'Regen', 'Schnee', 'Wind', 'kalt', 'warm', 'heiß', 'kühl',
        'Essen', 'trinken', 'Frühstück', 'Mittagessen', 'Abendessen', 'hungrig', 'durstig', 'satt',
        'Körper', 'Kopf', 'Auge', 'Nase', 'Mund', 'Hand', 'Fuß', 'Arm', 'Bein', 'Haar',
        'Kleidung', 'Hemd', 'Hose', 'Kleid', 'Schuh', 'Socke', 'Hut', 'Jacke', 'Rock'
      ],
      spanish: [
        'amigo', 'amiga', 'familia', 'madre', 'padre', 'hermano', 'hermana', 'abuela', 'abuelo',
        'escuela', 'maestro', 'estudiante', 'libro', 'lápiz', 'papel', 'computadora', 'teléfono', 'internet',
        'color', 'rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco', 'morado', 'naranja', 'rosa',
        'número', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
        'clima', 'sol', 'lluvia', 'nieve', 'viento', 'frío', 'cálido', 'caliente', 'fresco',
        'comer', 'beber', 'desayuno', 'almuerzo', 'cena', 'hambriento', 'sediento', 'lleno',
        'cuerpo', 'cabeza', 'ojo', 'nariz', 'boca', 'mano', 'pie', 'brazo', 'pierna', 'cabello',
        'ropa', 'camisa', 'pantalón', 'vestido', 'zapato', 'calcetín', 'sombrero', 'chaqueta', 'falda'
      ],
      french: [
        'ami', 'amie', 'famille', 'mère', 'père', 'frère', 'sœur', 'grand-mère', 'grand-père',
        'école', 'professeur', 'étudiant', 'livre', 'stylo', 'papier', 'ordinateur', 'téléphone', 'internet',
        'couleur', 'rouge', 'bleu', 'vert', 'jaune', 'noir', 'blanc', 'violet', 'orange', 'rose',
        'nombre', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
        'temps', 'soleil', 'pluie', 'neige', 'vent', 'froid', 'chaud', 'tiède', 'frais',
        'manger', 'boire', 'petit-déjeuner', 'déjeuner', 'dîner', 'faim', 'soif', 'rassasié',
        'corps', 'tête', 'œil', 'nez', 'bouche', 'main', 'pied', 'bras', 'jambe', 'cheveux',
        'vêtement', 'chemise', 'pantalon', 'robe', 'chaussure', 'chaussette', 'chapeau', 'veste', 'jupe'
      ],
      portuguese: [
        'amigo', 'amiga', 'família', 'mãe', 'pai', 'irmão', 'irmã', 'avó', 'avô',
        'escola', 'professor', 'estudante', 'livro', 'caneta', 'papel', 'computador', 'telefone', 'internet',
        'cor', 'vermelho', 'azul', 'verde', 'amarelo', 'preto', 'branco', 'roxo', 'laranja', 'rosa',
        'número', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
        'tempo', 'sol', 'chuva', 'neve', 'vento', 'frio', 'quente', 'morno', 'fresco',
        'comer', 'beber', 'café da manhã', 'almoço', 'jantar', 'com fome', 'com sede', 'cheio',
        'corpo', 'cabeça', 'olho', 'nariz', 'boca', 'mão', 'pé', 'braço', 'perna', 'cabelo',
        'roupa', 'camisa', 'calça', 'vestido', 'sapato', 'meia', 'chapéu', 'jaqueta', 'saia'
      ],
      italian: [
        'amico', 'amica', 'famiglia', 'madre', 'padre', 'fratello', 'sorella', 'nonna', 'nonno',
        'scuola', 'insegnante', 'studente', 'libro', 'penna', 'carta', 'computer', 'telefono', 'internet',
        'colore', 'rosso', 'blu', 'verde', 'giallo', 'nero', 'bianco', 'viola', 'arancione', 'rosa',
        'numero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci',
        'tempo', 'sole', 'pioggia', 'neve', 'vento', 'freddo', 'caldo', 'tiepido', 'fresco',
        'mangiare', 'bere', 'colazione', 'pranzo', 'cena', 'affamato', 'assetato', 'sazio',
        'corpo', 'testa', 'occhio', 'naso', 'bocca', 'mano', 'piede', 'braccio', 'gamba', 'capelli',
        'vestito', 'camicia', 'pantaloni', 'abito', 'scarpa', 'calzino', 'cappello', 'giacca', 'gonna'
      ]
    },
    intermediate: {
      german: [
        // Advanced expressions and abstract concepts
        'Bedeutung', 'Erfahrung', 'Möglichkeit', 'Schwierigkeit', 'Veränderung', 'Entwicklung', 'Beziehung',
        'Entscheidung', 'Verständnis', 'Unterschied', 'Zusammenhang', 'Einstellung', 'Verantwortung', 'Gelegenheit',
        'verwirklichen', 'berücksichtigen', 'unterstützen', 'beeinflussen', 'verbessern', 'erkunden', 'entdecken',
        'diskutieren', 'analysieren', 'organisieren', 'kontrollieren', 'koordinieren', 'motivieren', 'inspirieren',
        'zufällig', 'absichtlich', 'regelmäßig', 'gründlich', 'sorgfältig', 'kreativ', 'effektiv', 'praktisch'
      ],
      spanish: [
        'significado', 'experiencia', 'posibilidad', 'dificultad', 'cambio', 'desarrollo', 'relación',
        'decisión', 'comprensión', 'diferencia', 'conexión', 'actitud', 'responsabilidad', 'oportunidad',
        'realizar', 'considerar', 'apoyar', 'influir', 'mejorar', 'explorar', 'descubrir',
        'discutir', 'analizar', 'organizar', 'controlar', 'coordinar', 'motivar', 'inspirar',
        'casual', 'intencional', 'regular', 'minucioso', 'cuidadoso', 'creativo', 'efectivo', 'práctico'
      ],
      french: [
        'signification', 'expérience', 'possibilité', 'difficulté', 'changement', 'développement', 'relation',
        'décision', 'compréhension', 'différence', 'connexion', 'attitude', 'responsabilité', 'opportunité',
        'réaliser', 'considérer', 'soutenir', 'influencer', 'améliorer', 'explorer', 'découvrir',
        'discuter', 'analyser', 'organiser', 'contrôler', 'coordonner', 'motiver', 'inspirer',
        'aléatoire', 'intentionnel', 'régulier', 'minutieux', 'soigneux', 'créatif', 'efficace', 'pratique'
      ],
      portuguese: [
        'significado', 'experiência', 'possibilidade', 'dificuldade', 'mudança', 'desenvolvimento', 'relacionamento',
        'decisão', 'compreensão', 'diferença', 'conexão', 'atitude', 'responsabilidade', 'oportunidade',
        'realizar', 'considerar', 'apoiar', 'influenciar', 'melhorar', 'explorar', 'descobrir',
        'discutir', 'analisar', 'organizar', 'controlar', 'coordenar', 'motivar', 'inspirar',
        'casual', 'intencional', 'regular', 'minucioso', 'cuidadoso', 'criativo', 'efetivo', 'prático'
      ],
      italian: [
        'significato', 'esperienza', 'possibilità', 'difficoltà', 'cambiamento', 'sviluppo', 'relazione',
        'decisione', 'comprensione', 'differenza', 'connessione', 'atteggiamento', 'responsabilità', 'opportunità',
        'realizzare', 'considerare', 'supportare', 'influenzare', 'migliorare', 'esplorare', 'scoprire',
        'discutere', 'analizzare', 'organizzare', 'controllare', 'coordinare', 'motivare', 'ispirare',
        'casuale', 'intenzionale', 'regolare', 'minuzioso', 'attento', 'creativo', 'efficace', 'pratico'
      ]
    },
    advanced: {
      german: [
        // Sophisticated vocabulary and specialized terms
        'Paradigmenwechsel', 'Interdependenz', 'Durchschlagskraft', 'Nachhaltigkeit', 'Authentizität',
        'Ambivalenz', 'Konsequenz', 'Präzision', 'Innovation', 'Transformation', 'Komplexität', 'Effizienz',
        'konzeptualisieren', 'differenzieren', 'synthetisieren', 'optimieren', 'implementieren', 'evaluieren',
        'reflektieren', 'kontextualisieren', 'diversifizieren', 'intensivieren', 'charakterisieren',
        'multidimensional', 'interdisziplinär', 'systematisch', 'strategisch', 'analytisch', 'holistisch'
      ],
      spanish: [
        'cambio de paradigma', 'interdependencia', 'impacto', 'sostenibilidad', 'autenticidad',
        'ambivalencia', 'consecuencia', 'precisión', 'innovación', 'transformación', 'complejidad', 'eficiencia',
        'conceptualizar', 'diferenciar', 'sintetizar', 'optimizar', 'implementar', 'evaluar',
        'reflexionar', 'contextualizar', 'diversificar', 'intensificar', 'caracterizar',
        'multidimensional', 'interdisciplinario', 'sistemático', 'estratégico', 'analítico', 'holístico'
      ],
      french: [
        'changement de paradigme', 'interdépendance', 'impact', 'durabilité', 'authenticité',
        'ambivalence', 'conséquence', 'précision', 'innovation', 'transformation', 'complexité', 'efficacité',
        'conceptualiser', 'différencier', 'synthétiser', 'optimiser', 'implémenter', 'évaluer',
        'réfléchir', 'contextualiser', 'diversifier', 'intensifier', 'caractériser',
        'multidimensionnel', 'interdisciplinaire', 'systématique', 'stratégique', 'analytique', 'holistique'
      ],
      portuguese: [
        'mudança de paradigma', 'interdependência', 'impacto', 'sustentabilidade', 'autenticidade',
        'ambivalência', 'consequência', 'precisão', 'inovação', 'transformação', 'complexidade', 'eficiência',
        'conceitualizar', 'diferenciar', 'sintetizar', 'otimizar', 'implementar', 'avaliar',
        'refletir', 'contextualizar', 'diversificar', 'intensificar', 'caracterizar',
        'multidimensional', 'interdisciplinar', 'sistemático', 'estratégico', 'analítico', 'holístico'
      ],
      italian: [
        'cambio di paradigma', 'interdipendenza', 'impatto', 'sostenibilità', 'autenticità',
        'ambivalenza', 'conseguenza', 'precisione', 'innovazione', 'trasformazione', 'complessità', 'efficienza',
        'concettualizzare', 'differenziare', 'sintetizzare', 'ottimizzare', 'implementare', 'valutare',
        'riflettere', 'contestualizzare', 'diversificare', 'intensificare', 'caratterizzare',
        'multidimensionale', 'interdisciplinare', 'sistematico', 'strategico', 'analitico', 'olistico'
      ]
    }
  };

  static async generateUserNoveltyProfile(
    userId: string,
    language: string
  ): Promise<UserNoveltyProfile> {
    try {
      // Get user's recent performance data
      const { data: sessions } = await supabase
        .from('sentence_mining_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate performance metrics
      const totalExercises = sessions?.reduce((sum, s) => sum + s.total_exercises, 0) || 0;
      const totalCorrect = sessions?.reduce((sum, s) => sum + s.correct_exercises, 0) || 0;
      const averageAccuracy = totalExercises > 0 ? totalCorrect / totalExercises : 0.5;

      // Estimate novelty sensitivity based on performance patterns
      const noveltySensitivity = this.calculateNoveltySensitivity(sessions || []);
      const preferredComplexity = this.estimatePreferredComplexity(averageAccuracy, language);
      
      // Get recent novelty count
      const recentNoveltyCount = await this.getRecentNoveltyCount(userId, language);
      
      return {
        userId,
        language,
        averageAccuracy,
        noveltySensitivity,
        preferredComplexity,
        recentNoveltyCount,
        adaptationRate: this.calculateAdaptationRate(sessions || []),
        lastNoveltyIntroduced: null // Would need additional tracking
      };
    } catch (error) {
      console.error('[AdaptiveNovelty] Error generating user profile:', error);
      return this.getDefaultProfile(userId, language);
    }
  }

  static async selectNoveltyWords(
    userProfile: UserNoveltyProfile,
    difficultyLevel: string,
    contextHints: string[] = [],
    avoidWords: string[] = [],
    targetCount: number = 2
  ): Promise<NoveltyCandidate[]> {
    const config = this.DEFAULT_CONFIG;
    
    // Determine if user is ready for novelty
    if (userProfile.averageAccuracy < config.adaptiveThreshold) {
      console.log(`[AdaptiveNovelty] User accuracy (${userProfile.averageAccuracy}) below threshold, skipping novelty`);
      return [];
    }

    // Check novelty budget for session
    if (userProfile.recentNoveltyCount >= config.maxNoveltyPerSession) {
      console.log(`[AdaptiveNovelty] Novelty budget exhausted (${userProfile.recentNoveltyCount}/${config.maxNoveltyPerSession})`);
      return [];
    }

    try {
      // Get candidate words from expanded pools
      const candidates = this.getCandidateNoveltyWords(
        userProfile.language,
        difficultyLevel,
        avoidWords
      );

      // Score each candidate
      const scoredCandidates = await this.scoreNoveltyCandidate(
        candidates,
        userProfile,
        contextHints,
        difficultyLevel
      );

      // Select top candidates
      const selected = scoredCandidates
        .sort((a, b) => b.learningValue - a.learningValue)
        .slice(0, Math.min(targetCount, config.maxNoveltyPerSession - userProfile.recentNoveltyCount));

      console.log(`[AdaptiveNovelty] Selected ${selected.length} novelty candidates from ${candidates.length} options`);
      
      return selected;
    } catch (error) {
      console.error('[AdaptiveNovelty] Error selecting novelty words:', error);
      return [];
    }
  }

  static async shouldInjectNovelty(
    userProfile: UserNoveltyProfile,
    sessionProgress: number,
    exerciseCount: number
  ): Promise<{
    shouldInject: boolean;
    reason: string;
    confidence: number;
  }> {
    const config = this.DEFAULT_CONFIG;
    
    // Check basic requirements
    if (userProfile.averageAccuracy < config.adaptiveThreshold) {
      return {
        shouldInject: false,
        reason: `User accuracy (${(userProfile.averageAccuracy * 100).toFixed(1)}%) below threshold`,
        confidence: 0.9
      };
    }

    if (userProfile.recentNoveltyCount >= config.maxNoveltyPerSession) {
      return {
        shouldInject: false,
        reason: `Novelty budget exhausted (${userProfile.recentNoveltyCount}/${config.maxNoveltyPerSession})`,
        confidence: 1.0
      };
    }

    // Calculate injection probability based on multiple factors
    let injectionProbability = config.targetNoveltyRatio;
    
    // Adjust based on user's novelty sensitivity
    injectionProbability *= userProfile.noveltySensitivity;
    
    // Adjust based on session progress (more likely later in session)
    injectionProbability *= (0.5 + sessionProgress * 0.5);
    
    // Adjust based on recent adaptation rate
    injectionProbability *= userProfile.adaptationRate;

    // Random factor to prevent predictability
    const randomFactor = Math.random();
    const shouldInject = randomFactor < injectionProbability;

    const reason = shouldInject 
      ? `Novelty injection triggered (${(injectionProbability * 100).toFixed(1)}% probability)`
      : `Novelty injection skipped (${(injectionProbability * 100).toFixed(1)}% probability)`;

    return {
      shouldInject,
      reason,
      confidence: Math.abs(injectionProbability - randomFactor) * 2 // How confident we are in the decision
    };
  }

  static async trackNoveltyIntroduction(
    userId: string,
    language: string,
    word: string,
    sessionId: string,
    contextUsed: string
  ): Promise<void> {
    try {
      // Track in database for future analysis
      await supabase
        .from('known_words')
        .upsert({
          user_id: userId,
          word,
          language,
          mastery_level: 1, // Start at level 1 for new words
          review_count: 0,
          correct_count: 0,
          first_seen_at: new Date().toISOString(),
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,word,language'
        });

      console.log(`[AdaptiveNovelty] Tracked novelty introduction: ${word} in context "${contextUsed}"`);
    } catch (error) {
      console.error('[AdaptiveNovelty] Error tracking novelty introduction:', error);
    }
  }

  private static getCandidateNoveltyWords(
    language: string,
    difficultyLevel: string,
    avoidWords: string[]
  ): string[] {
    const pool = this.EXPANDED_WORD_POOLS[difficultyLevel as keyof typeof this.EXPANDED_WORD_POOLS];
    const words = pool?.[language as keyof typeof pool] || pool?.['german'] || [];
    
    // Filter out words to avoid
    const filtered = words.filter(word => !avoidWords.includes(word));
    
    // Shuffle for variety
    return this.shuffleArray(filtered);
  }

  private static async scoreNoveltyCandidate(
    candidates: string[],
    userProfile: UserNoveltyProfile,
    contextHints: string[],
    difficultyLevel: string
  ): Promise<NoveltyCandidate[]> {
    const scored: NoveltyCandidate[] = [];

    for (const word of candidates) {
      const noveltyScore = this.calculateNoveltyScore(word, userProfile);
      const difficultyRating = this.calculateDifficultyRating(word, difficultyLevel);
      const contextFit = this.calculateContextFit(word, contextHints);
      const learningValue = this.calculateLearningValue(noveltyScore, difficultyRating, contextFit, userProfile);

      scored.push({
        word,
        noveltyScore,
        difficultyRating,
        contextFit,
        learningValue,
        frequency: this.estimateWordFrequency(word, userProfile.language),
        phoneticsComplexity: this.calculatePhoneticsComplexity(word),
        semanticRichness: this.calculateSemanticRichness(word)
      });
    }

    return scored;
  }

  private static calculateNoveltyScore(word: string, userProfile: UserNoveltyProfile): number {
    // Higher score for words that are genuinely new to the user
    let score = 0.8; // Base novelty assumption
    
    // Adjust based on word characteristics
    if (word.length > 8) score += 0.1; // Longer words are typically newer
    if (word.includes('-')) score += 0.1; // Compound words add complexity
    
    // Adjust based on user's preferred complexity
    const complexityMatch = Math.abs(this.getWordComplexity(word) - userProfile.preferredComplexity);
    score *= (1 - complexityMatch * 0.3);
    
    return Math.max(0, Math.min(1, score));
  }

  private static calculateDifficultyRating(word: string, difficultyLevel: string): number {
    const levelScores = { beginner: 0.3, intermediate: 0.6, advanced: 0.9 };
    const baseScore = levelScores[difficultyLevel as keyof typeof levelScores] || 0.5;
    
    // Adjust based on word characteristics
    const lengthFactor = Math.min(1, word.length / 12);
    const complexityFactor = this.getWordComplexity(word);
    
    return Math.max(0, Math.min(1, baseScore + lengthFactor * 0.2 + complexityFactor * 0.1));
  }

  private static calculateContextFit(word: string, contextHints: string[]): number {
    if (contextHints.length === 0) return 0.5; // Neutral if no context
    
    // Simple matching - in a real implementation, this would use semantic similarity
    const matchScore = contextHints.some(hint => 
      word.toLowerCase().includes(hint.toLowerCase()) || 
      hint.toLowerCase().includes(word.toLowerCase())
    ) ? 0.8 : 0.3;
    
    return matchScore;
  }

  private static calculateLearningValue(
    noveltyScore: number,
    difficultyRating: number,
    contextFit: number,
    userProfile: UserNoveltyProfile
  ): number {
    const config = this.DEFAULT_CONFIG;
    
    // Weighted combination of factors
    let value = 0;
    value += noveltyScore * 0.4;                           // Novelty is important
    value += difficultyRating * 0.3;                       // Appropriate difficulty
    value += contextFit * config.contextRelevanceWeight;   // Context relevance
    value += userProfile.adaptationRate * 0.1;             // User's adaptation ability
    
    // Bonus for words that match user's learning profile
    if (Math.abs(difficultyRating - userProfile.preferredComplexity) < 0.2) {
      value += 0.1;
    }
    
    return Math.max(0, Math.min(1, value));
  }

  private static calculateNoveltySensitivity(sessions: any[]): number {
    // Analyze how user performs when encountering new elements
    // This is a simplified calculation - in practice would need more detailed tracking
    if (sessions.length === 0) return 0.7; // Default moderate sensitivity
    
    const recentAccuracy = sessions.slice(0, 3).reduce((sum, s) => 
      sum + (s.total_exercises > 0 ? s.correct_exercises / s.total_exercises : 0), 0
    ) / Math.min(3, sessions.length);
    
    // Higher sensitivity if user maintains good accuracy
    return Math.max(0.3, Math.min(1, recentAccuracy + 0.2));
  }

  private static estimatePreferredComplexity(averageAccuracy: number, language: string): number {
    // Estimate user's optimal complexity level based on performance
    let complexity = 0.5; // Default medium complexity
    
    if (averageAccuracy > 0.85) complexity = 0.7;
    else if (averageAccuracy > 0.7) complexity = 0.6;
    else if (averageAccuracy < 0.5) complexity = 0.3;
    
    return complexity;
  }

  private static calculateAdaptationRate(sessions: any[]): number {
    // Analyze how quickly user improves with new content
    if (sessions.length < 3) return 0.7; // Default moderate adaptation
    
    // Look at accuracy trend over recent sessions
    const accuracies = sessions.slice(0, 5).map(s => 
      s.total_exercises > 0 ? s.correct_exercises / s.total_exercises : 0
    );
    
    // Calculate trend
    let trend = 0;
    for (let i = 1; i < accuracies.length; i++) {
      trend += accuracies[i-1] - accuracies[i]; // Positive if improving
    }
    trend /= (accuracies.length - 1);
    
    return Math.max(0.3, Math.min(1, 0.7 + trend));
  }

  private static async getRecentNoveltyCount(userId: string, language: string): number {
    // Count novelty words introduced in recent session
    // This is simplified - would need better tracking in practice
    const { data } = await supabase
      .from('known_words')
      .select('created_at')
      .eq('user_id', userId)
      .eq('language', language)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    return data?.length || 0;
  }

  private static getWordComplexity(word: string): number {
    let complexity = 0;
    
    // Length factor
    complexity += Math.min(0.3, word.length / 15);
    
    // Character diversity
    const uniqueChars = new Set(word.toLowerCase()).size;
    complexity += Math.min(0.3, uniqueChars / 10);
    
    // Special characters or compounds
    if (word.includes('-') || word.includes('\'')) complexity += 0.2;
    
    // Consonant clusters (rough heuristic)
    const consonantClusters = (word.match(/[bcdfghjklmnpqrstvwxyz]{3,}/gi) || []).length;
    complexity += Math.min(0.2, consonantClusters * 0.1);
    
    return Math.max(0, Math.min(1, complexity));
  }

  private static estimateWordFrequency(word: string, language: string): number {
    // Simplified frequency estimation - in practice would use frequency databases
    if (word.length <= 3) return 0.9; // Short words are typically frequent
    if (word.length >= 10) return 0.2; // Long words are typically rare
    
    return Math.max(0.1, Math.min(0.9, 1 - (word.length / 15)));
  }

  private static calculatePhoneticsComplexity(word: string): number {
    // Estimate pronunciation difficulty
    const difficultClusters = ['sch', 'tsch', 'pf', 'kn', 'gn', 'th', 'ch', 'ght'];
    let complexity = 0.3; // Base complexity
    
    for (const cluster of difficultClusters) {
      if (word.toLowerCase().includes(cluster)) {
        complexity += 0.2;
      }
    }
    
    return Math.max(0, Math.min(1, complexity));
  }

  private static calculateSemanticRichness(word: string): number {
    // Estimate semantic complexity (how many meanings/contexts)
    // This is very simplified - would need semantic databases in practice
    let richness = 0.5; // Default
    
    // Longer words often have more specific meanings
    if (word.length > 8) richness += 0.2;
    if (word.length > 12) richness += 0.1;
    
    // Abstract concepts tend to be semantically rich
    const abstractSuffixes = ['ung', 'heit', 'keit', 'schaft', 'tion', 'sion', 'idad', 'ité'];
    for (const suffix of abstractSuffixes) {
      if (word.toLowerCase().endsWith(suffix)) {
        richness += 0.3;
        break;
      }
    }
    
    return Math.max(0, Math.min(1, richness));
  }

  private static getDefaultProfile(userId: string, language: string): UserNoveltyProfile {
    return {
      userId,
      language,
      averageAccuracy: 0.7,
      noveltySensitivity: 0.7,
      preferredComplexity: 0.5,
      recentNoveltyCount: 0,
      adaptationRate: 0.7,
      lastNoveltyIntroduced: null
    };
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
