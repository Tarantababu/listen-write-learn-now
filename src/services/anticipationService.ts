
import { supabase } from '@/integrations/supabase/client';
import { AnticipationLesson, AnticipationProgress, CreateLessonRequest, LessonContent } from '@/types/anticipation';

export class AnticipationService {
  static async createLesson(request: CreateLessonRequest, userId: string): Promise<AnticipationLesson> {
    try {
      // Generate lesson content using the edge function
      const { data: contentData, error: contentError } = await supabase.functions.invoke(
        'generate-anticipation-lesson',
        {
          body: {
            targetLanguage: request.targetLanguage,
            conversationTheme: request.conversationTheme,
            difficultyLevel: request.difficultyLevel
          }
        }
      );

      if (contentError) {
        throw new Error(`Failed to generate lesson content: ${contentError.message}`);
      }

      // Create the lesson in the database
      const { data, error } = await supabase
        .from('anticipation_lessons')
        .insert({
          user_id: userId,
          title: `${request.conversationTheme} - ${request.difficultyLevel}`,
          language: request.targetLanguage,
          difficulty_level: request.difficultyLevel,
          conversation_theme: request.conversationTheme,
          content: contentData,
          audio_urls: {}
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create lesson: ${error.message}`);
      }

      return {
        ...data,
        content: data.content as LessonContent,
        audio_urls: data.audio_urls as Record<string, string>
      };
    } catch (error) {
      console.error('Error creating anticipation lesson:', error);
      throw error;
    }
  }

  static async getUserLessons(userId: string, language?: string): Promise<AnticipationLesson[]> {
    try {
      let query = supabase
        .from('anticipation_lessons')
        .select('*')
        .eq('user_id', userId)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (language) {
        query = query.eq('language', language);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch lessons: ${error.message}`);
      }

      return (data || []).map(lesson => ({
        ...lesson,
        content: lesson.content as LessonContent,
        audio_urls: lesson.audio_urls as Record<string, string>
      }));
    } catch (error) {
      console.error('Error fetching anticipation lessons:', error);
      throw error;
    }
  }

  static async getLessonById(lessonId: string): Promise<AnticipationLesson | null> {
    try {
      const { data, error } = await supabase
        .from('anticipation_lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Lesson not found
        }
        throw new Error(`Failed to fetch lesson: ${error.message}`);
      }

      return {
        ...data,
        content: data.content as LessonContent,
        audio_urls: data.audio_urls as Record<string, string>
      };
    } catch (error) {
      console.error('Error fetching anticipation lesson:', error);
      throw error;
    }
  }

  static async getLessonProgress(userId: string, lessonId: string): Promise<AnticipationProgress | null> {
    try {
      const { data, error } = await supabase
        .from('anticipation_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch lesson progress: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
      throw error;
    }
  }

  static async updateProgress(
    userId: string,
    lessonId: string,
    sectionIndex: number,
    totalSections: number,
    accuracy?: number
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_anticipation_progress', {
        lesson_id_param: lessonId,
        user_id_param: userId,
        section_index_param: sectionIndex,
        total_sections_param: totalSections,
        accuracy_param: accuracy || null
      });

      if (error) {
        throw new Error(`Failed to update progress: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating anticipation progress:', error);
      throw error;
    }
  }

  static async deleteLesson(lessonId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('anticipation_lessons')
        .update({ archived: true })
        .eq('id', lessonId);

      if (error) {
        throw new Error(`Failed to delete lesson: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting anticipation lesson:', error);
      throw error;
    }
  }

  static async generateAudioForLesson(lessonId: string, content: LessonContent): Promise<Record<string, string>> {
    try {
      const audioUrls: Record<string, string> = {};
      
      // Extract all text that needs audio generation
      const textsToGenerate: Array<{ key: string; text: string; language: string }> = [];
      
      content.sections.forEach((section, sectionIndex) => {
        section.content.forEach((item, itemIndex) => {
          if (item.speaker === 'TL' || item.targetText || item.target) {
            const key = `section_${sectionIndex}_item_${itemIndex}`;
            const text = item.text || item.targetText || item.target;
            if (text) {
              textsToGenerate.push({ key, text, language: 'target' });
            }
          }
        });
      });

      // Generate audio for each text segment
      for (const { key, text, language } of textsToGenerate) {
        try {
          const { data, error } = await supabase.functions.invoke('text-to-speech', {
            body: { text, language }
          });

          if (!error && data?.audio_url) {
            audioUrls[key] = data.audio_url;
          }
        } catch (audioError) {
          console.warn(`Failed to generate audio for ${key}:`, audioError);
          // Continue with other audio generations
        }
      }

      // Update lesson with audio URLs
      const { error: updateError } = await supabase
        .from('anticipation_lessons')
        .update({ audio_urls: audioUrls })
        .eq('id', lessonId);

      if (updateError) {
        console.error('Failed to update lesson with audio URLs:', updateError);
      }

      return audioUrls;
    } catch (error) {
      console.error('Error generating audio for lesson:', error);
      return {};
    }
  }
}
