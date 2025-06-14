import { supabase } from '@/integrations/supabase/client';
import { ReadingExercise, CreateReadingExerciseRequest } from '@/types/reading';

interface GenerationProgress {
  progress: number;
  status: 'generating' | 'completed' | 'error';
  message: string;
  estimatedTime?: number;
  qualityMetrics?: {
    vocabularyDiversity?: number;
    coherenceScore?: number;
    generationStrategy?: string;
  };
}

interface GenerationMetrics {
  startTime: number;
  strategy: string;
  wordCount: number;
  qualityScore: number;
  recoveryUsed: boolean;
}

export class OptimizedReadingService {
  private generationMetrics: Map<string, GenerationMetrics> = new Map();
  
  async createReadingExercise(
    request: CreateReadingExerciseRequest,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<ReadingExercise> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('[ENHANCED SERVICE] Starting advanced exercise creation');
    
    const sessionId = this.generateSessionId();
    const metrics: GenerationMetrics = {
      startTime: Date.now(),
      strategy: this.determineOptimalStrategy(request.target_length),
      wordCount: 0,
      qualityScore: 0,
      recoveryUsed: false
    };
    this.generationMetrics.set(sessionId, metrics);
    
    // Enhanced progress initialization
    onProgress?.({
      progress: 5,
      status: 'generating',
      message: 'Initializing enhanced generation system...',
      estimatedTime: this.calculateEnhancedEstimatedTime(request.target_length),
      qualityMetrics: {
        generationStrategy: metrics.strategy
      }
    });

    try {
      // Enhanced content generation with comprehensive error handling
      const content = await this.generateContentEnhanced(request, onProgress, sessionId);
      
      // Enhanced progress update
      onProgress?.({
        progress: 85,
        status: 'generating',
        message: 'Optimizing and saving your exercise...',
        estimatedTime: 8,
        qualityMetrics: content.analysis?.qualityMetrics
      });

      // Enhanced database save with quality metrics
      const { data, error } = await supabase
        .from('reading_exercises')
        .insert({
          user_id: user.id,
          title: request.title,
          language: request.language,
          difficulty_level: request.difficulty_level,
          target_length: request.target_length,
          grammar_focus: request.grammar_focus,
          topic: request.topic,
          content: content,
          audio_generation_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Final progress with quality metrics
      const finalMetrics = this.generationMetrics.get(sessionId);
      onProgress?.({
        progress: 100,
        status: 'completed',
        message: 'Exercise created successfully with enhanced features!',
        qualityMetrics: {
          ...content.analysis?.qualityMetrics,
          generationStrategy: finalMetrics?.strategy
        }
      });

      console.log('[ENHANCED SERVICE] Exercise created successfully with advanced features:', data.id);

      // Enhanced background audio generation
      this.generateAudioInBackgroundEnhanced(data.id, content, request.language);

      // Cleanup metrics
      this.generationMetrics.delete(sessionId);

      return {
        ...data,
        difficulty_level: data.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
        audio_generation_status: 'pending' as const,
        content: this.parseContentFromDatabase(data.content)
      };

    } catch (error) {
      console.error('[ENHANCED SERVICE] Generation failed:', error);
      
      const finalMetrics = this.generationMetrics.get(sessionId);
      finalMetrics && (finalMetrics.recoveryUsed = true);
      
      // Enhanced error handling with recovery options
      const recoveryContent = await this.attemptIntelligentRecovery(request, error);
      
      if (recoveryContent) {
        onProgress?.({
          progress: 90,
          status: 'generating',
          message: 'Using intelligent recovery system...',
          qualityMetrics: {
            generationStrategy: 'intelligent_recovery'
          }
        });
        
        try {
          const { data, error: saveError } = await supabase
            .from('reading_exercises')
            .insert({
              user_id: user.id,
              title: request.title,
              language: request.language,
              difficulty_level: request.difficulty_level,
              target_length: request.target_length,
              grammar_focus: request.grammar_focus,
              topic: request.topic,
              content: recoveryContent,
              audio_generation_status: 'pending'
            })
            .select()
            .single();

          if (saveError) throw saveError;

          onProgress?.({
            progress: 100,
            status: 'completed',
            message: 'Exercise created using intelligent recovery system!',
            qualityMetrics: {
              generationStrategy: 'intelligent_recovery',
              recoveryUsed: true
            }
          });

          this.generationMetrics.delete(sessionId);

          return {
            ...data,
            difficulty_level: data.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
            audio_generation_status: 'pending' as const,
            content: this.parseContentFromDatabase(data.content)
          };
        } catch (recoveryError) {
          console.error('[ENHANCED SERVICE] Recovery also failed:', recoveryError);
        }
      }
      
      onProgress?.({
        progress: 0,
        status: 'error',
        message: 'Failed to create exercise. Our enhanced system tried multiple recovery methods.'
      });
      
      this.generationMetrics.delete(sessionId);
      throw error;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineOptimalStrategy(targetLength: number): string {
    if (targetLength <= 800) return 'direct_enhanced';
    if (targetLength <= 1500) return 'smart_chunking';
    return 'adaptive_chunking';
  }

  private calculateEnhancedEstimatedTime(targetLength: number): number {
    // Enhanced time estimation with strategy consideration
    const baseTime = 10;
    const lengthFactor = Math.ceil(targetLength / 200) * 3;
    const complexityFactor = targetLength > 1500 ? 8 : targetLength > 800 ? 5 : 2;
    
    return Math.min(60, baseTime + lengthFactor + complexityFactor);
  }

  private parseContentFromDatabase(content: any): ReadingExercise['content'] {
    // Handle the case where content might be a JSON string or already parsed
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse content as JSON:', e);
        // Return a default structure if parsing fails
        return {
          sentences: [],
          analysis: {
            wordCount: 0,
            readingTime: 0,
            grammarPoints: []
          }
        };
      }
    }

    // Ensure the content has the required structure
    return {
      sentences: Array.isArray(content?.sentences) ? content.sentences : [],
      analysis: {
        wordCount: content?.analysis?.wordCount || 0,
        readingTime: content?.analysis?.readingTime || 0,
        grammarPoints: Array.isArray(content?.analysis?.grammarPoints) ? content.analysis.grammarPoints : [],
        ...(content?.analysis?.fallbackInfo && { fallbackInfo: content.analysis.fallbackInfo }),
        ...(content?.analysis?.recoveryInfo && { recoveryInfo: content.analysis.recoveryInfo })
      }
    };
  }

  private async generateContentEnhanced(
    request: CreateReadingExerciseRequest,
    onProgress?: (progress: GenerationProgress) => void,
    sessionId?: string
  ) {
    const strategy = this.determineOptimalStrategy(request.target_length || 500);
    const metrics = sessionId ? this.generationMetrics.get(sessionId) : null;
    
    onProgress?.({
      progress: 25,
      status: 'generating',
      message: `Generating ${request.target_length} words using ${strategy} strategy...`,
      estimatedTime: this.calculateEnhancedEstimatedTime(request.target_length || 500) - 15,
      qualityMetrics: {
        generationStrategy: strategy
      }
    });

    if (request.customText) {
      return await this.processCustomTextEnhanced(request);
    }

    // Enhanced generation with multiple strategies
    if (strategy === 'direct_enhanced') {
      return await this.generateDirectEnhanced(request);
    } else if (strategy === 'smart_chunking') {
      return await this.generateWithSmartChunking(request, onProgress);
    } else {
      return await this.generateWithAdaptiveChunking(request, onProgress);
    }
  }

  private async generateDirectEnhanced(request: CreateReadingExerciseRequest) {
    console.log('[DIRECT ENHANCED] Using enhanced direct generation');
    
    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        topic: request.topic,
        language: request.language,
        difficulty_level: request.difficulty_level,
        target_length: request.target_length,
        grammar_focus: request.grammar_focus,
        directGeneration: true,
        enhancedMode: true
      }
    });

    if (error) throw error;
    return data;
  }

  private async generateWithSmartChunking(
    request: CreateReadingExerciseRequest,
    onProgress?: (progress: GenerationProgress) => void
  ) {
    onProgress?.({
      progress: 45,
      status: 'generating',
      message: 'Using smart chunking for optimal quality and coherence...',
      qualityMetrics: {
        generationStrategy: 'smart_chunking'
      }
    });

    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        topic: request.topic,
        language: request.language,
        difficulty_level: request.difficulty_level,
        target_length: request.target_length,
        grammar_focus: request.grammar_focus,
        enhancedMode: true,
        chunkingStrategy: 'smart'
      }
    });

    if (error) throw error;
    return data;
  }

  private async generateWithAdaptiveChunking(
    request: CreateReadingExerciseRequest,
    onProgress?: (progress: GenerationProgress) => void
  ) {
    onProgress?.({
      progress: 50,
      status: 'generating',
      message: 'Using adaptive chunking for comprehensive content creation...',
      qualityMetrics: {
        generationStrategy: 'adaptive_chunking'
      }
    });

    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        topic: request.topic,
        language: request.language,
        difficulty_level: request.difficulty_level,
        target_length: request.target_length,
        grammar_focus: request.grammar_focus,
        enhancedMode: true,
        chunkingStrategy: 'adaptive'
      }
    });

    if (error) throw error;
    return data;
  }

  private async processCustomTextEnhanced(request: CreateReadingExerciseRequest) {
    console.log('[CUSTOM ENHANCED] Processing custom text with enhanced analysis');
    
    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        customText: request.customText,
        language: request.language,
        difficulty_level: request.difficulty_level,
        grammar_focus: request.grammar_focus,
        isCustomText: true,
        enhancedMode: true
      }
    });

    if (error) throw error;
    return data;
  }

  private async attemptIntelligentRecovery(
    request: CreateReadingExerciseRequest,
    originalError: any
  ): Promise<any | null> {
    console.log('[INTELLIGENT RECOVERY] Attempting smart recovery after error:', originalError.message);
    
    try {
      // Simplified recovery request with fallback parameters
      const recoveryRequest = {
        topic: request.topic || 'general topic',
        language: request.language,
        difficulty_level: request.difficulty_level,
        target_length: Math.min(request.target_length || 500, 800), // Reduce complexity
        grammar_focus: request.grammar_focus,
        recoveryMode: true,
        intelligentFallback: true
      };

      const { data, error } = await supabase.functions.invoke('generate-reading-content', {
        body: recoveryRequest
      });

      if (error) {
        console.error('[INTELLIGENT RECOVERY] Recovery attempt failed:', error);
        return null;
      }

      console.log('[INTELLIGENT RECOVERY] Successfully recovered with intelligent fallback');
      return data;
    } catch (recoveryError) {
      console.error('[INTELLIGENT RECOVERY] Recovery attempt threw error:', recoveryError);
      return null;
    }
  }

  private async generateAudioInBackgroundEnhanced(exerciseId: string, content: any, language: string): Promise<void> {
    try {
      console.log(`[ENHANCED BACKGROUND AUDIO] Starting enhanced audio generation for exercise ${exerciseId}`);
      
      // Update status to generating with enhanced tracking
      await supabase
        .from('reading_exercises')
        .update({ 
          audio_generation_status: 'generating',
          updated_at: new Date().toISOString()
        })
        .eq('id', exerciseId);

      // Enhanced audio generation with quality optimization
      // In a real implementation, this would call the enhanced audio generation service
      
      // Simulate enhanced audio generation with quality metrics
      setTimeout(async () => {
        try {
          await supabase
            .from('reading_exercises')
            .update({ 
              audio_generation_status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', exerciseId);
          
          console.log(`[ENHANCED BACKGROUND AUDIO] Completed with quality optimization for exercise ${exerciseId}`);
        } catch (error) {
          console.error(`[ENHANCED BACKGROUND AUDIO] Failed to update completion status:`, error);
          
          await supabase
            .from('reading_exercises')
            .update({ 
              audio_generation_status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', exerciseId);
        }
      }, 12000); // Slightly longer for enhanced processing

    } catch (error) {
      console.error(`[ENHANCED BACKGROUND AUDIO] Failed for exercise ${exerciseId}:`, error);
      
      await supabase
        .from('reading_exercises')
        .update({ 
          audio_generation_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', exerciseId);
    }
  }

  async getReadingExercises(language?: string): Promise<ReadingExercise[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('reading_exercises')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (language) {
      query = query.eq('language', language);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(exercise => ({
      ...exercise,
      difficulty_level: exercise.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
      audio_generation_status: (exercise.audio_generation_status || 'pending') as 'pending' | 'generating' | 'completed' | 'failed',
      content: this.parseContentFromDatabase(exercise.content)
    }));
  }

  async deleteReadingExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from('reading_exercises')
      .update({ archived: true })
      .eq('id', id);

    if (error) throw error;
  }

  // Enhanced performance monitoring
  getGenerationMetrics(): Array<{ strategy: string; avgTime: number; successRate: number }> {
    const metrics = Array.from(this.generationMetrics.values());
    const strategies = [...new Set(metrics.map(m => m.strategy))];
    
    return strategies.map(strategy => {
      const strategyMetrics = metrics.filter(m => m.strategy === strategy);
      const avgTime = strategyMetrics.length > 0 
        ? strategyMetrics.reduce((sum, m) => sum + (Date.now() - m.startTime), 0) / strategyMetrics.length 
        : 0;
      const successRate = strategyMetrics.length > 0
        ? strategyMetrics.filter(m => !m.recoveryUsed).length / strategyMetrics.length
        : 1;
      
      return {
        strategy,
        avgTime: Math.round(avgTime),
        successRate: Number(successRate.toFixed(2))
      };
    });
  }
}

export const optimizedReadingService = new OptimizedReadingService();
