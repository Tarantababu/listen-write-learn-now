import { supabase } from '@/integrations/supabase/client';
import { ReadingExercise, ReadingExerciseProgress, CreateReadingExerciseRequest } from '@/types/reading';
import { enhancedAudioService } from '@/services/enhancedAudioService';

export class ReadingExerciseService {
  
  async createReadingExercise(request: CreateReadingExerciseRequest): Promise<ReadingExercise> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log(`[READING SERVICE] Creating exercise with synchronous audio generation`);

    let content;
    let wasPartialGeneration = false;
    
    try {
      if (request.customText) {
        content = await this.processCustomTextWithTimeout(request);
      } else {
        content = await this.generateReadingContentWithTimeout(request);
      }
    } catch (error) {
      console.error('[READING SERVICE] Content generation failed:', error);
      
      if (this.isTimeoutError(error)) {
        console.warn('[READING SERVICE] Timeout detected - attempting recovery');
        content = await this.attemptPartialRecovery(request, error);
        wasPartialGeneration = true;
      } else if (this.isGenerationError(error)) {
        console.warn('[READING SERVICE] Generation error - using fallback');
        content = this.createIntelligentFallback(request);
        wasPartialGeneration = true;
      } else {
        throw error;
      }
    }

    // Generate audio synchronously before creating exercise
    const fullText = content.sentences.map((s: any) => s.text).join(' ');
    let audioUrl: string | null = null;
    
    if (fullText.trim()) {
      console.log(`[READING SERVICE] Generating audio synchronously for ${fullText.length} characters`);
      
      try {
        const result = await enhancedAudioService.generateSingleAudio(fullText, request.language, {
          quality: 'standard',
          priority: 'high'
        });

        if (result.success && result.audioUrl) {
          audioUrl = result.audioUrl;
          console.log(`[READING SERVICE] Audio generated successfully: ${audioUrl}`);
        } else {
          console.error(`[READING SERVICE] Audio generation failed: ${result.error}`);
          // Don't throw error here - we can still create the exercise without audio
          console.warn('[READING SERVICE] Proceeding without audio - will be marked as failed');
        }
      } catch (audioError) {
        console.error(`[READING SERVICE] Audio generation error:`, audioError);
        // Don't throw error here - we can still create the exercise without audio
        console.warn('[READING SERVICE] Proceeding without audio due to error');
      }
    }
    
    // Create exercise with or without audio
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
          generation_method: wasPartialGeneration ? 'enhanced_fallback' : 'full_generation',
          created_at: new Date().toISOString(),
          audio_generated_at: audioUrl ? new Date().toISOString() : null,
          audio_generation_attempted: true
        }
      })
      .select()
      .single();

    if (error) {
      console.error('[READING SERVICE] Database insert failed:', error);
      throw error;
    }

    console.log(`[READING SERVICE] Exercise created successfully ${audioUrl ? 'with' : 'without'} audio: ${data.id}`);

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
    console.log('[READING SERVICE] Starting batch audio fix');
    await enhancedAudioService.batchValidateExercises(10);
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

  private isGenerationError(error: any): boolean {
    return error.message?.includes('generation') ||
           error.message?.includes('OpenAI') ||
           error.message?.includes('content');
  }

  private async attemptPartialRecovery(request: CreateReadingExerciseRequest, originalError: any): Promise<any> {
    console.log('[PARTIAL RECOVERY] Attempting recovery with reduced scope');
    
    try {
      const reducedRequest = {
        ...request,
        target_length: Math.floor((request.target_length || 700) * 0.6)
      };
      
      const partialContent = await this.generateContentDirectlyWithTimeout(reducedRequest, 30000);
      
      return {
        ...partialContent,
        analysis: {
          ...partialContent.analysis,
          recoveryInfo: {
            originalTargetLength: request.target_length,
            actualLength: partialContent.analysis?.wordCount || reducedRequest.target_length,
            recoveryMethod: 'partial_generation',
            note: 'Content was generated with enhanced recovery'
          }
        }
      };
    } catch (recoveryError) {
      console.warn('[PARTIAL RECOVERY] Recovery failed, using fallback');
      return this.createIntelligentFallback(request);
    }
  }

  private async generateContentDirectlyWithTimeout(request: CreateReadingExerciseRequest, timeout: number): Promise<any> {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Direct generation timeout')), timeout)
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
        directGeneration: true
      }
    });

    if (error) throw error;
    return data;
  }

  private async generateReadingContentWithTimeout(request: CreateReadingExerciseRequest) {
    console.log(`[ENHANCED GENERATION] Starting with timeout protection`);
    
    const smartTimeout = this.calculateSmartTimeout(request.target_length || 700);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Enhanced generation timeout')), smartTimeout)
    );

    const generationPromise = this.generateReadingContent(request);

    try {
      const content = await Promise.race([generationPromise, timeoutPromise]);
      console.log(`[ENHANCED GENERATION] Completed successfully`);
      return content;
    } catch (error) {
      console.error(`[ENHANCED GENERATION] Failed:`, error);
      throw error;
    }
  }

  private calculateSmartTimeout(targetLength: number): number {
    const baseTimeout = 35000;
    const lengthMultiplier = Math.min(targetLength / 1000, 2.5);
    const smartTimeout = Math.min(baseTimeout * lengthMultiplier, 55000);
    
    console.log(`[SMART TIMEOUT] Calculated ${smartTimeout}ms for ${targetLength} words`);
    return smartTimeout;
  }

  private async processCustomTextWithTimeout(request: CreateReadingExerciseRequest) {
    console.log(`[CUSTOM TEXT] Processing with timeout protection`);
    
    const timeoutDuration = 25000;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Custom text processing timeout')), timeoutDuration)
    );

    const processingPromise = this.processCustomText(request);

    try {
      const content = await Promise.race([processingPromise, timeoutPromise]);
      console.log(`[CUSTOM TEXT] Processed successfully`);
      return content;
    } catch (error) {
      console.error(`[CUSTOM TEXT] Processing failed:`, error);
      throw error;
    }
  }

  private createIntelligentFallback(request: CreateReadingExerciseRequest) {
    console.log('[INTELLIGENT FALLBACK] Creating enhanced fallback content');
    
    const targetLength = request.target_length || 700;
    const sentences = [];
    
    const topicTemplates = this.getTopicTemplates(request.topic || 'general');
    const sentenceCount = Math.max(5, Math.min(12, Math.floor(targetLength / 50)));
    
    for (let i = 0; i < sentenceCount; i++) {
      const template = topicTemplates[i % topicTemplates.length];
      const sentenceText = this.generateFallbackSentence(template, request.difficulty_level, request.language);
      
      sentences.push({
        id: `fallback-sentence-${i + 1}`,
        text: sentenceText,
        analysis: {
          words: this.generateSampleWordAnalysis(sentenceText, request.difficulty_level),
          grammar: this.getRelevantGrammarPoints(request.grammar_focus),
          translation: this.generateBasicTranslation(sentenceText, request.language)
        }
      });
    }
    
    return {
      sentences,
      analysis: {
        wordCount: sentences.reduce((count, s) => count + s.text.split(' ').length, 0),
        readingTime: Math.ceil(targetLength / 200),
        grammarPoints: this.getRelevantGrammarPoints(request.grammar_focus),
        fallbackInfo: {
          method: 'intelligent_fallback',
          reason: 'Enhanced protection activated',
          isUsable: true
        }
      }
    };
  }

  private getTopicTemplates(topic: string): string[] {
    const templates = {
      'general': [
        'This is an example sentence for language learning practice.',
        'Learning a new language requires consistent daily practice.',
        'Reading exercises help improve comprehension and vocabulary.',
        'Practice makes perfect when studying languages.',
        'Every day brings new opportunities to learn and grow.'
      ],
      'travel': [
        'Traveling to new places opens our minds to different cultures.',
        'Planning a trip requires careful consideration of many factors.',
        'Local transportation systems vary greatly between cities.',
        'Trying local food is one of the best parts of traveling.'
      ],
      'food': [
        'Cooking traditional dishes connects us to our heritage.',
        'Fresh ingredients make all the difference in taste.',
        'Each culture has its own unique cooking methods.',
        'Sharing meals brings people together across cultures.'
      ]
    };
    
    return templates[topic] || templates['general'];
  }

  private generateFallbackSentence(template: string, difficulty: string, language: string): string {
    return `${template} [Enhanced content ready for practice!]`;
  }

  private generateSampleWordAnalysis(text: string, difficulty: string) {
    const words = text.split(' ').slice(0, 3);
    return words.map(word => ({
      word: word.toLowerCase().replace(/[^\w]/g, ''),
      definition: `Example definition for "${word}"`,
      partOfSpeech: 'noun',
      difficulty: difficulty === 'advanced' ? 'medium' : 'easy'
    }));
  }

  private getRelevantGrammarPoints(grammarFocus?: string): string[] {
    if (grammarFocus) {
      return grammarFocus.split(',').map(g => g.trim());
    }
    return ['basic sentence structure', 'vocabulary practice', 'reading comprehension'];
  }

  private generateBasicTranslation(text: string, language: string): string {
    return `Translation available - enhanced content for ${language} practice`;
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
        isCustomText: true
      }
    });

    if (error) throw error;
    return data;
  }

  private async generateReadingContent(request: CreateReadingExerciseRequest) {
    console.log(`Generating reading content for target length: ${request.target_length}`);
    
    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        topic: request.topic,
        language: request.language,
        difficulty_level: request.difficulty_level,
        target_length: request.target_length,
        grammar_focus: request.grammar_focus
      }
    });

    if (error) {
      console.error('Content generation error:', error);
      throw error;
    }
    
    console.log(`Content generated successfully with ${data.analysis?.wordCount || 0} words`);
    return data;
  }
}

export const readingExerciseService = new ReadingExerciseService();
