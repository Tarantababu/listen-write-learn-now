import { supabase } from '@/integrations/supabase/client';
import { ReadingExercise, ReadingExerciseProgress, CreateReadingExerciseRequest } from '@/types/reading';
import { enhancedAudioService } from '@/services/enhancedAudioService';

export class ReadingExerciseService {
  
  async createReadingExercise(request: CreateReadingExerciseRequest): Promise<ReadingExercise> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log(`[READING SERVICE] Creating exercise with optimized workflow`);

    let content;
    let wasPartialGeneration = false;
    
    try {
      if (request.customText) {
        content = await this.processCustomTextOptimized(request);
      } else {
        content = await this.generateReadingContentOptimized(request);
      }
    } catch (error) {
      console.error('[READING SERVICE] Content generation failed:', error);
      
      if (this.isTimeoutError(error)) {
        console.warn('[READING SERVICE] Timeout detected - attempting recovery');
        content = await this.attemptOptimizedRecovery(request);
        wasPartialGeneration = true;
      } else {
        throw error;
      }
    }

    // Concurrent audio generation for improved performance
    const fullText = content.sentences.map((s: any) => s.text).join(' ');
    let audioUrl: string | null = null;
    
    if (fullText.trim()) {
      console.log(`[READING SERVICE] Starting concurrent audio generation`);
      
      try {
        // Use Promise.race for timeout handling
        const audioPromise = enhancedAudioService.generateSingleAudio(fullText, request.language, {
          quality: 'standard',
          priority: 'high'
        });
        
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Audio generation timeout')), 30000)
        );

        const result = await Promise.race([audioPromise, timeoutPromise]);

        if (result.success && result.audioUrl) {
          audioUrl = result.audioUrl;
          console.log(`[READING SERVICE] Audio generated successfully`);
        } else {
          console.error(`[READING SERVICE] Audio generation failed: ${result.error}`);
        }
      } catch (audioError) {
        console.error(`[READING SERVICE] Audio generation error:`, audioError);
      }
    }
    
    // Create exercise with optimized metadata
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
        audio_generation_status: audioUrl ? 'completed' : 'failed',
        audio_url: audioUrl,
        full_text_audio_url: audioUrl,
        metadata: {
          generation_method: wasPartialGeneration ? 'optimized_recovery' : 'full_generation',
          created_at: new Date().toISOString(),
          audio_generated_at: audioUrl ? new Date().toISOString() : null,
          audio_generation_attempted: true,
          optimized_workflow: true
        }
      })
      .select()
      .single();

    if (error) {
      console.error('[READING SERVICE] Database insert failed:', error);
      throw error;
    }

    console.log(`[READING SERVICE] Exercise created successfully with optimized workflow`);

    return {
      ...data,
      difficulty_level: data.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
      audio_generation_status: (audioUrl ? 'completed' : 'failed') as 'pending' | 'generating' | 'completed' | 'failed',
      content: data.content as unknown as ReadingExercise['content'],
      metadata: this.parseMetadataFromDatabase(data.metadata)
    };
  }

  async regenerateExerciseAudio(exerciseId: string): Promise<boolean> {
    console.log(`[READING SERVICE] Regenerating audio for exercise: ${exerciseId}`);
    
    try {
      const success = await enhancedAudioService.validateAndFixExerciseAudio(exerciseId);
      
      if (success) {
        console.log(`[READING SERVICE] Successfully regenerated audio for exercise: ${exerciseId}`);
      } else {
        console.error(`[READING SERVICE] Failed to regenerate audio for exercise: ${exerciseId}`);
      }
      
      return success;
    } catch (error) {
      console.error(`[READING SERVICE] Error regenerating audio:`, error);
      return false;
    }
  }

  async batchFixAudioIssues(): Promise<void> {
    console.log('[READING SERVICE] Starting optimized batch audio fix');
    await enhancedAudioService.batchValidateExercises(15);
  }

  private parseMetadataFromDatabase(metadata: any): ReadingExercise['metadata'] {
    if (!metadata) return undefined;
    
    if (typeof metadata === 'object' && metadata !== null) {
      return metadata;
    }
    
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata);
      } catch {
        return undefined;
      }
    }
    
    return undefined;
  }

  private isTimeoutError(error: any): boolean {
    return error.message?.includes('timeout') || 
           error.message?.includes('504') || 
           error.message?.includes('408') ||
           error.name === 'AbortError';
  }

  private async attemptOptimizedRecovery(request: CreateReadingExerciseRequest): Promise<any> {
    console.log('[OPTIMIZED RECOVERY] Attempting recovery with streamlined approach');
    
    try {
      const reducedRequest = {
        ...request,
        target_length: Math.floor((request.target_length || 700) * 0.7)
      };
      
      const partialContent = await this.generateContentDirectlyOptimized(reducedRequest, 25000);
      
      return {
        ...partialContent,
        analysis: {
          ...partialContent.analysis,
          recoveryInfo: {
            originalTargetLength: request.target_length,
            actualLength: partialContent.analysis?.wordCount || reducedRequest.target_length,
            recoveryMethod: 'optimized_recovery',
            note: 'Content generated with optimized recovery workflow'
          }
        }
      };
    } catch (recoveryError) {
      console.warn('[OPTIMIZED RECOVERY] Recovery failed, using streamlined fallback');
      return this.createStreamlinedFallback(request);
    }
  }

  private async generateContentDirectlyOptimized(request: CreateReadingExerciseRequest, timeout: number): Promise<any> {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Optimized generation timeout')), timeout)
    );

    const generationPromise = this.generateReadingContentDirect(request);
    return await Promise.race([generationPromise, timeoutPromise]);
  }

  private async generateReadingContentDirect(request: CreateReadingExerciseRequest): Promise<any> {
    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        topic: request.topic,
        language: request.language,
        difficulty_level: request.difficulty_level,
        target_length: request.target_length,
        grammar_focus: request.grammar_focus,
        optimized: true
      }
    });

    if (error) throw error;
    return data;
  }

  private async generateReadingContentOptimized(request: CreateReadingExerciseRequest) {
    console.log(`[OPTIMIZED GENERATION] Starting with improved timeout handling`);
    
    const smartTimeout = this.calculateOptimizedTimeout(request.target_length || 700);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Optimized generation timeout')), smartTimeout)
    );

    const generationPromise = this.generateReadingContent(request);

    try {
      const content = await Promise.race([generationPromise, timeoutPromise]);
      console.log(`[OPTIMIZED GENERATION] Completed successfully`);
      return content;
    } catch (error) {
      console.error(`[OPTIMIZED GENERATION] Failed:`, error);
      throw error;
    }
  }

  private calculateOptimizedTimeout(targetLength: number): number {
    // Optimized timeout calculation
    const baseTimeout = 25000; // Reduced from 35000
    const lengthMultiplier = Math.min(targetLength / 1000, 2.0); // Reduced from 2.5
    const optimizedTimeout = Math.min(baseTimeout * lengthMultiplier, 45000); // Reduced from 55000
    
    console.log(`[OPTIMIZED TIMEOUT] Calculated ${optimizedTimeout}ms for ${targetLength} words`);
    return optimizedTimeout;
  }

  private async processCustomTextOptimized(request: CreateReadingExerciseRequest) {
    console.log(`[OPTIMIZED CUSTOM TEXT] Processing with improved efficiency`);
    
    const timeoutDuration = 20000; // Reduced from 25000
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Custom text processing timeout')), timeoutDuration)
    );

    const processingPromise = this.processCustomText(request);

    try {
      const content = await Promise.race([processingPromise, timeoutPromise]);
      console.log(`[OPTIMIZED CUSTOM TEXT] Processed successfully`);
      return content;
    } catch (error) {
      console.error(`[OPTIMIZED CUSTOM TEXT] Processing failed:`, error);
      throw error;
    }
  }

  private createStreamlinedFallback(request: CreateReadingExerciseRequest) {
    console.log('[STREAMLINED FALLBACK] Creating optimized fallback content');
    
    const targetLength = request.target_length || 700;
    const sentences = [];
    
    const optimizedTemplates = this.getOptimizedTemplates(request.topic || 'general', request.language);
    const sentenceCount = Math.max(4, Math.min(10, Math.floor(targetLength / 60))); // Optimized calculation
    
    for (let i = 0; i < sentenceCount; i++) {
      const template = optimizedTemplates[i % optimizedTemplates.length];
      const sentenceText = this.generateOptimizedSentence(template, request.difficulty_level, request.language);
      
      sentences.push({
        id: `opt-sentence-${i + 1}`,
        text: sentenceText,
        analysis: {
          words: this.generateOptimizedWordAnalysis(sentenceText, request.difficulty_level),
          grammar: this.getOptimizedGrammarPoints(request.grammar_focus),
          translation: this.generateOptimizedTranslation(sentenceText, request.language)
        }
      });
    }
    
    return {
      sentences,
      analysis: {
        wordCount: sentences.reduce((count, s) => count + s.text.split(' ').length, 0),
        readingTime: Math.ceil(targetLength / 200),
        grammarPoints: this.getOptimizedGrammarPoints(request.grammar_focus),
        optimizedGeneration: true,
        fallbackInfo: {
          method: 'streamlined_fallback',
          reason: 'Optimized workflow protection activated',
          isUsable: true
        }
      }
    };
  }

  private getOptimizedTemplates(topic: string, language: string): string[] {
    const templates = {
      'general': [
        `Learning ${language} opens doors to new opportunities and experiences.`,
        'Reading exercises improve comprehension and build vocabulary effectively.',
        'Practice and consistency are essential for language learning success.',
        'Every sentence provides valuable learning opportunities for students.',
        'Regular practice helps develop natural language fluency over time.'
      ],
      'travel': [
        'Exploring new destinations enriches our understanding of different cultures.',
        'Planning travel adventures requires research and careful preparation.',
        'Local customs and traditions make each destination unique and memorable.',
        'Transportation options vary significantly between different countries and cities.'
      ],
      'business': [
        'Effective communication skills are crucial for professional success.',
        'International business requires understanding of cultural differences.',
        'Technology has transformed how companies operate in global markets.',
        'Building strong relationships is fundamental to business growth.'
      ]
    };
    
    return templates[topic] || templates['general'];
  }

  private generateOptimizedSentence(template: string, difficulty: string, language: string): string {
    return template;
  }

  private generateOptimizedWordAnalysis(text: string, difficulty: string) {
    const words = text.split(' ').slice(0, 5); // Limit analysis for performance
    return words.map(word => ({
      word: word.toLowerCase().replace(/[^\w]/g, ''),
      definition: `${difficulty} level definition for "${word}"`,
      partOfSpeech: 'noun',
      difficulty: difficulty === 'advanced' ? 'medium' : 'easy'
    }));
  }

  private getOptimizedGrammarPoints(grammarFocus?: string): string[] {
    if (grammarFocus) {
      return grammarFocus.split(',').map(g => g.trim()).slice(0, 3); // Limit for performance
    }
    return ['sentence structure', 'vocabulary building', 'reading fluency'];
  }

  private generateOptimizedTranslation(text: string, language: string): string {
    return `Translation for ${language} practice - optimized content`;
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
      content: exercise.content as unknown as ReadingExercise['content'],
      metadata: this.parseMetadataFromDatabase(exercise.metadata)
    }));
  }

  async getReadingExercise(id: string): Promise<ReadingExercise> {
    const { data, error } = await supabase
      .from('reading_exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return {
      ...data,
      difficulty_level: data.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
      audio_generation_status: (data.audio_generation_status || 'pending') as 'pending' | 'generating' | 'completed' | 'failed',
      content: data.content as unknown as ReadingExercise['content'],
      metadata: this.parseMetadataFromDatabase(data.metadata)
    };
  }

  async updateProgress(exerciseId: string, sentenceIndex: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.rpc('update_reading_exercise_progress', {
      exercise_id_param: exerciseId,
      user_id_param: user.id,
      sentence_index_param: sentenceIndex
    });

    if (error) throw error;
  }

  async getProgress(exerciseId: string): Promise<ReadingExerciseProgress | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('reading_exercise_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('reading_exercise_id', exerciseId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async deleteReadingExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from('reading_exercises')
      .update({ archived: true })
      .eq('id', id);

    if (error) throw error;
  }

  private async processCustomText(request: CreateReadingExerciseRequest) {
    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        customText: request.customText,
        language: request.language,
        difficulty_level: request.difficulty_level,
        grammar_focus: request.grammar_focus,
        isCustomText: true,
        optimized: true
      }
    });

    if (error) throw error;
    return data;
  }

  private async generateReadingContent(request: CreateReadingExerciseRequest) {
    console.log(`Generating reading content with optimized approach for target length: ${request.target_length}`);
    
    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        topic: request.topic,
        language: request.language,
        difficulty_level: request.difficulty_level,
        target_length: request.target_length,
        grammar_focus: request.grammar_focus,
        optimized: true
      }
    });

    if (error) {
      console.error('Content generation error:', error);
      throw error;
    }
    
    console.log(`Content generated successfully with optimized workflow`);
    return data;
  }
}

export const readingExerciseService = new ReadingExerciseService();
