import { supabase } from '@/integrations/supabase/client';
import { ReadingExercise, ReadingExerciseProgress, CreateReadingExerciseRequest } from '@/types/reading';

export class ReadingExerciseService {
  
  async createReadingExercise(request: CreateReadingExerciseRequest): Promise<ReadingExercise> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log(`[EXERCISE SERVICE] Creating exercise with target length: ${request.target_length}`);

    let content;
    
    try {
      if (request.customText) {
        content = await this.processCustomTextWithTimeout(request);
      } else {
        content = await this.generateReadingContentWithTimeout(request);
      }
    } catch (error) {
      console.error('[EXERCISE SERVICE] Content generation failed:', error);
      
      // Handle timeout errors gracefully
      if (error.message?.includes('timeout') || error.message?.includes('504')) {
        console.warn('[EXERCISE SERVICE] Using fallback content due to timeout');
        content = this.createFallbackContent(request);
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
        audio_generation_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('[EXERCISE SERVICE] Database insert failed:', error);
      throw error;
    }

    console.log(`[EXERCISE SERVICE] Exercise created successfully: ${data.id}`);

    // Start background audio generation
    this.generateAudioInBackground(data.id, content, request.language);

    return {
      ...data,
      difficulty_level: data.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
      audio_generation_status: 'pending' as 'pending' | 'generating' | 'completed' | 'failed',
      content: data.content as unknown as ReadingExercise['content']
    };
  }

  private async generateReadingContentWithTimeout(request: CreateReadingExerciseRequest) {
    console.log(`[CONTENT GENERATION] Starting with timeout protection`);
    
    const timeoutDuration = 50000; // 50 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Content generation timeout')), timeoutDuration)
    );

    const generationPromise = this.generateReadingContent(request);

    try {
      const content = await Promise.race([generationPromise, timeoutPromise]);
      console.log(`[CONTENT GENERATION] Completed successfully`);
      return content;
    } catch (error) {
      console.error(`[CONTENT GENERATION] Failed:`, error);
      throw error;
    }
  }

  private async processCustomTextWithTimeout(request: CreateReadingExerciseRequest) {
    console.log(`[CUSTOM TEXT] Processing with timeout protection`);
    
    const timeoutDuration = 30000; // 30 seconds for custom text
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

  private createFallbackContent(request: CreateReadingExerciseRequest) {
    console.log('[FALLBACK CONTENT] Creating fallback content structure');
    
    const sentences = [];
    const targetLength = request.target_length || 500;
    const wordsPerSentence = Math.max(8, Math.floor(targetLength / 8));
    const numSentences = Math.ceil(targetLength / wordsPerSentence);
    
    for (let i = 0; i < Math.min(numSentences, 10); i++) {
      sentences.push({
        id: `fallback-sentence-${i + 1}`,
        text: `This is a sample sentence in ${request.language} for your ${request.difficulty_level} level reading exercise. Content generation experienced a timeout, but you can still practice with this exercise.`,
        analysis: {
          words: [
            {
              word: 'sample',
              definition: 'An example or specimen',
              partOfSpeech: 'noun',
              difficulty: 'easy'
            }
          ],
          grammar: ['present tense', 'article usage'],
          translation: 'This is a sample sentence for practice. Content generation timed out.'
        }
      });
    }
    
    return {
      sentences,
      analysis: {
        wordCount: sentences.length * wordsPerSentence,
        readingTime: Math.ceil((sentences.length * wordsPerSentence) / 200),
        grammarPoints: ['basic sentence structure', 'timeout fallback content']
      }
    };
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

  async generateAudio(text: string, language: string): Promise<string> {
    try {
      console.log('Calling text-to-speech function for:', text.substring(0, 50) + '...');
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          language
        }
      });

      if (error) {
        console.error('Error invoking text-to-speech function:', error);
        throw error;
      }

      if (!data) {
        console.warn('No data received from text-to-speech function');
        throw new Error('No audio data received');
      }

      if (data.audio_url) {
        console.log('Audio generated successfully, URL:', data.audio_url);
        return data.audio_url;
      }

      if (data.audioUrl) {
        console.log('Audio generated successfully (legacy format), URL:', data.audioUrl);
        return data.audioUrl;
      }

      console.error('No audio URL in response:', data);
      throw new Error('No audio URL in response');
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
