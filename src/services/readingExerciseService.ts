
import { supabase } from '@/integrations/supabase/client';
import { ReadingExercise, ReadingExerciseProgress, CreateReadingExerciseRequest } from '@/types/reading';

export class ReadingExerciseService {
  
  async createReadingExercise(request: CreateReadingExerciseRequest): Promise<ReadingExercise> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let content;
    
    if (request.customText) {
      // Process custom text - create content structure from user's text
      content = await this.processCustomText(request);
    } else {
      // Generate content using OpenAI for AI mode
      content = await this.generateReadingContent(request);
    }
    
    // Create the reading exercise with pending audio status
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

    // Start background audio generation
    this.generateAudioForExercise(data.id, content, request.language);

    return {
      ...data,
      difficulty_level: data.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
      content: data.content as unknown as ReadingExercise['content']
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
    const { data, error } = await supabase.functions.invoke('generate-reading-content', {
      body: {
        topic: request.topic,
        language: request.language,
        difficulty_level: request.difficulty_level,
        target_length: request.target_length,
        grammar_focus: request.grammar_focus
      }
    });

    if (error) throw error;
    return data;
  }

  private async generateAudioForExercise(exerciseId: string, content: any, language: string) {
    try {
      // Update status to generating
      await supabase
        .from('reading_exercises')
        .update({ audio_generation_status: 'generating' })
        .eq('id', exerciseId);

      // Generate audio for full text
      const fullText = content.sentences.map((s: any) => s.text).join(' ');
      const fullAudioUrl = await this.generateAudio(fullText, language);

      // Generate audio for individual sentences
      const sentenceAudioPromises = content.sentences.map(async (sentence: any) => {
        const audioUrl = await this.generateAudio(sentence.text, language);
        return { ...sentence, audio_url: audioUrl };
      });

      const sentencesWithAudio = await Promise.all(sentenceAudioPromises);

      // Update the exercise with audio URLs
      const updatedContent = {
        ...content,
        sentences: sentencesWithAudio
      };

      await supabase
        .from('reading_exercises')
        .update({ 
          content: updatedContent,
          full_text_audio_url: fullAudioUrl,
          audio_generation_status: 'completed'
        })
        .eq('id', exerciseId);

    } catch (error) {
      console.error('Error generating audio for exercise:', error);
      
      // Update status to failed
      await supabase
        .from('reading_exercises')
        .update({ audio_generation_status: 'failed' })
        .eq('id', exerciseId);
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

      // Handle the correct response format: { audio_url: "..." }
      if (data.audio_url) {
        console.log('Audio generated successfully, URL:', data.audio_url);
        return data.audio_url;
      }

      // Legacy fallback for old response format (backward compatibility)
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
    await this.generateAudioForExercise(exerciseId, exercise.content, exercise.language);
  }
}

export const readingExerciseService = new ReadingExerciseService();
