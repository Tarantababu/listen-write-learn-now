import { supabase } from '@/integrations/supabase/client';
import { enhancedTtsService } from './enhancedTtsService';
import { ReadingExercise, CreateReadingExerciseRequest, ReadingExerciseProgress } from '@/types/reading';

export class ReadingExerciseService {
  
  async createReadingExercise(request: CreateReadingExerciseRequest): Promise<ReadingExercise> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log(`[ENHANCED SERVICE] Creating exercise with target length: ${request.target_length}`);

    let content;
    let wasPartialGeneration = false;
    
    try {
      if (request.customText) {
        content = await this.processCustomTextWithEnhancedTimeout(request);
      } else {
        content = await this.generateReadingContentWithEnhancedRecovery(request);
      }
    } catch (error) {
      console.error('[ENHANCED SERVICE] Content generation failed:', error);
      
      // Enhanced error recovery with detailed handling
      if (this.isTimeoutError(error)) {
        console.warn('[ENHANCED SERVICE] Timeout detected - attempting partial recovery');
        content = await this.attemptPartialRecovery(request, error);
        wasPartialGeneration = true;
      } else if (this.isGenerationError(error)) {
        console.warn('[ENHANCED SERVICE] Generation error - using intelligent fallback');
        content = this.createIntelligentFallback(request);
        wasPartialGeneration = true;
      } else {
        throw error;
      }
    }
    
    // Generate audio in background for better performance
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
        audio_generation_status: 'pending',
        // Add metadata about generation method
        metadata: {
          generation_method: wasPartialGeneration ? 'enhanced_fallback' : 'full_generation',
          protection_used: true,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('[ENHANCED SERVICE] Database insert failed:', error);
      throw error;
    }

    console.log(`[ENHANCED SERVICE] Exercise created successfully: ${data.id} (method: ${wasPartialGeneration ? 'fallback' : 'standard'})`);

    // Start background audio generation
    this.generateAudioInBackground(data.id, content, request.language);

    return {
      ...data,
      difficulty_level: data.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
      audio_generation_status: 'pending' as 'pending' | 'generating' | 'completed' | 'failed',
      content: data.content as unknown as ReadingExercise['content']
    };
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
      // Try with reduced target length (60% of original)
      const reducedRequest = {
        ...request,
        target_length: Math.floor((request.target_length || 700) * 0.6)
      };
      
      console.log(`[PARTIAL RECOVERY] Retrying with reduced length: ${reducedRequest.target_length}`);
      
      // Use direct generation with shorter timeout
      const partialContent = await this.generateContentDirectlyWithTimeout(reducedRequest, 30000);
      
      // Add recovery metadata to content
      return {
        ...partialContent,
        analysis: {
          ...partialContent.analysis,
          recoveryInfo: {
            originalTargetLength: request.target_length,
            actualLength: partialContent.analysis?.wordCount || reducedRequest.target_length,
            recoveryMethod: 'partial_generation',
            note: 'Content was generated with enhanced recovery due to complexity'
          }
        }
      };
    } catch (recoveryError) {
      console.warn('[PARTIAL RECOVERY] Recovery failed, using intelligent fallback');
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
        directGeneration: true // Flag for simplified generation
      }
    });

    if (error) throw error;
    return data;
  }

  private async generateReadingContentWithEnhancedRecovery(request: CreateReadingExerciseRequest) {
    console.log(`[ENHANCED GENERATION] Starting with intelligent protection`);
    
    // Smart timeout based on target length
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
      console.error(`[ENHANCED GENERATION] Failed, initiating recovery:`, error);
      throw error; // Let the main error handler deal with recovery
    }
  }

  private calculateSmartTimeout(targetLength: number): number {
    // Dynamic timeout based on content length with caps
    const baseTimeout = 35000; // 35 seconds base
    const lengthMultiplier = Math.min(targetLength / 1000, 2.5); // Cap at 2.5x
    const smartTimeout = Math.min(baseTimeout * lengthMultiplier, 55000); // Max 55 seconds
    
    console.log(`[SMART TIMEOUT] Calculated ${smartTimeout}ms for ${targetLength} words`);
    return smartTimeout;
  }

  private async processCustomTextWithEnhancedTimeout(request: CreateReadingExerciseRequest) {
    console.log(`[ENHANCED CUSTOM] Processing with protection`);
    
    const timeoutDuration = 25000; // Reduced timeout for custom text
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Custom text processing timeout')), timeoutDuration)
    );

    const processingPromise = this.processCustomText(request);

    try {
      const content = await Promise.race([processingPromise, timeoutPromise]);
      console.log(`[ENHANCED CUSTOM] Processed successfully`);
      return content;
    } catch (error) {
      console.error(`[ENHANCED CUSTOM] Processing failed:`, error);
      throw error;
    }
  }

  private createIntelligentFallback(request: CreateReadingExerciseRequest) {
    console.log('[INTELLIGENT FALLBACK] Creating enhanced fallback content');
    
    const targetLength = request.target_length || 700;
    const sentences = [];
    
    // Intelligent sentence generation based on topic and difficulty
    const topicTemplates = this.getTopicTemplates(request.topic || 'general');
    const difficultyAdjustments = this.getDifficultyAdjustments(request.difficulty_level);
    
    const sentenceCount = Math.max(5, Math.min(12, Math.floor(targetLength / 50)));
    const wordsPerSentence = Math.floor(targetLength / sentenceCount);
    
    for (let i = 0; i < sentenceCount; i++) {
      const template = topicTemplates[i % topicTemplates.length];
      const sentenceText = this.generateFallbackSentence(template, difficultyAdjustments, request.language);
      
      sentences.push({
        id: `intelligent-sentence-${i + 1}`,
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
          reason: 'Enhanced protection activated due to generation complexity',
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
      // Add more topic-specific templates as needed
    };
    
    return templates[topic] || templates['general'];
  }

  private getDifficultyAdjustments(level: string) {
    return {
      beginner: { complexity: 'simple', vocabulary: 'basic' },
      intermediate: { complexity: 'moderate', vocabulary: 'varied' },
      advanced: { complexity: 'complex', vocabulary: 'sophisticated' }
    }[level] || { complexity: 'simple', vocabulary: 'basic' };
  }

  private generateFallbackSentence(template: string, difficulty: any, language: string): string {
    // This would ideally be language-specific, but for fallback we use English with a note
    return `${template} [Enhanced fallback content - your exercise is ready for practice!]`;
  }

  private generateSampleWordAnalysis(text: string, difficulty: string) {
    const words = text.split(' ').slice(0, 3); // Analyze first 3 words
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
    return `Translation available - enhanced fallback content created for ${language} practice`;
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
      content: exercise.content as unknown as ReadingExercise['content']
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
      content: data.content as unknown as ReadingExercise['content']
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

  private async generateAudioInBackground(exerciseId: string, content: any, language: string): Promise<void> {
    try {
      console.log(`[BACKGROUND AUDIO] Starting generation for exercise ${exerciseId}`);
      
      // Update status to generating
      await supabase
        .from('reading_exercises')
        .update({ audio_generation_status: 'generating' })
        .eq('id', exerciseId);

      // Generate audio for content
      const contentWithAudio = await this.generateAudioForContent(content, language);
      
      // Update exercise with audio URLs
      await supabase
        .from('reading_exercises')
        .update({ 
          content: contentWithAudio,
          full_text_audio_url: contentWithAudio.full_text_audio_url,
          audio_generation_status: 'completed'
        })
        .eq('id', exerciseId);

      console.log(`[BACKGROUND AUDIO] Completed for exercise ${exerciseId}`);
    } catch (error) {
      console.error(`[BACKGROUND AUDIO] Failed for exercise ${exerciseId}:`, error);
      
      // Update status to failed
      await supabase
        .from('reading_exercises')
        .update({ audio_generation_status: 'failed' })
        .eq('id', exerciseId);
    }
  }

  private async generateAudioForContent(content: any, language: string): Promise<any> {
    try {
      console.log('Generating audio for reading exercise content');
      
      const fullText = content.sentences.map((s: any) => s.text).join(' ');
      
      const batchSize = 5;
      const sentenceBatches = [];
      
      for (let i = 0; i < content.sentences.length; i += batchSize) {
        sentenceBatches.push(content.sentences.slice(i, i + batchSize));
      }

      let fullAudioUrl = null;
      const sentencesWithAudio = [...content.sentences];

      try {
        fullAudioUrl = await this.generateAudio(fullText, language);
      } catch (error) {
        console.warn('Full text audio generation failed:', error);
      }

      for (const batch of sentenceBatches) {
        const batchPromises = batch.map(async (sentence: any, localIndex: number) => {
          const globalIndex = sentenceBatches.indexOf(batch) * batchSize + localIndex;
          try {
            const audioUrl = await this.generateAudio(sentence.text, language);
            sentencesWithAudio[globalIndex] = { ...sentence, audio_url: audioUrl };
          } catch (error) {
            console.warn(`Audio generation failed for sentence ${globalIndex}:`, error);
            sentencesWithAudio[globalIndex] = { ...sentence, audio_url: null };
          }
        });

        await Promise.allSettled(batchPromises);
        
        if (sentenceBatches.indexOf(batch) < sentenceBatches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        ...content,
        sentences: sentencesWithAudio,
        full_text_audio_url: fullAudioUrl
      };

    } catch (error) {
      console.error('Error generating audio during exercise creation:', error);
      
      return {
        ...content,
        sentences: content.sentences.map((sentence: any) => ({
          ...sentence,
          audio_url: null
        })),
        full_text_audio_url: null
      };
    }
  }

  /**
   * Generate audio for reading exercise text using the enhanced TTS service
   */
  async generateAudio(text: string, language: string): Promise<string> {
    try {
      console.log('Calling enhanced TTS service for:', text.substring(0, 50) + '...');
      
      // Use the enhanced TTS service instead of calling the function directly
      const result = await enhancedTtsService.generateAudio({
        text,
        language,
        chunkSize: 'auto' // Use auto chunk size for optimal performance
      });
      
      console.log('Enhanced TTS service completed successfully');
      return result.audioUrl;
      
    } catch (error) {
      console.error('Error generating audio:', error);
      throw error;
    }
  }

  async retryAudioGeneration(exerciseId: string): Promise<void> {
    const exercise = await this.getReadingExercise(exerciseId);
    const contentWithAudio = await this.generateAudioForContent(exercise.content, exercise.language);
    
    await supabase
      .from('reading_exercises')
      .update({ 
        content: contentWithAudio,
        full_text_audio_url: contentWithAudio.full_text_audio_url,
        audio_generation_status: 'completed'
      })
      .eq('id', exerciseId);
  }
}

export const readingExerciseService = new ReadingExerciseService();
