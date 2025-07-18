export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_messages: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      admin_uploads: {
        Row: {
          created_at: string | null
          description: string | null
          file_path: string
          file_size: number
          filename: string
          id: string
          is_active: boolean | null
          mime_type: string
          original_name: string
          tags: string[] | null
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          is_active?: boolean | null
          mime_type: string
          original_name: string
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          is_active?: boolean | null
          mime_type?: string
          original_name?: string
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      bidirectional_exercises: {
        Row: {
          created_at: string
          id: string
          literal_translation: string | null
          literal_translation_audio_url: string | null
          normal_translation: string | null
          normal_translation_audio_url: string | null
          original_audio_url: string | null
          original_sentence: string
          status: string
          support_language: string
          target_language: string
          updated_at: string
          user_back_translation: string | null
          user_forward_translation: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          literal_translation?: string | null
          literal_translation_audio_url?: string | null
          normal_translation?: string | null
          normal_translation_audio_url?: string | null
          original_audio_url?: string | null
          original_sentence: string
          status?: string
          support_language: string
          target_language: string
          updated_at?: string
          user_back_translation?: string | null
          user_forward_translation?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          literal_translation?: string | null
          literal_translation_audio_url?: string | null
          normal_translation?: string | null
          normal_translation_audio_url?: string | null
          original_audio_url?: string | null
          original_sentence?: string
          status?: string
          support_language?: string
          target_language?: string
          updated_at?: string
          user_back_translation?: string | null
          user_forward_translation?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bidirectional_mastered_words: {
        Row: {
          exercise_id: string
          id: string
          language: string
          mastered_at: string
          user_id: string
          word: string
        }
        Insert: {
          exercise_id: string
          id?: string
          language: string
          mastered_at?: string
          user_id: string
          word: string
        }
        Update: {
          exercise_id?: string
          id?: string
          language?: string
          mastered_at?: string
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "bidirectional_mastered_words_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "bidirectional_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      bidirectional_reviews: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string
          exercise_id: string
          feedback: string | null
          id: string
          is_correct: boolean
          review_round: number | null
          review_type: string
          user_id: string
          user_recall_attempt: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date: string
          exercise_id: string
          feedback?: string | null
          id?: string
          is_correct: boolean
          review_round?: number | null
          review_type: string
          user_id: string
          user_recall_attempt: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string
          exercise_id?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean
          review_round?: number | null
          review_type?: string
          user_id?: string
          user_recall_attempt?: string
        }
        Relationships: [
          {
            foreignKeyName: "bidirectional_reviews_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "bidirectional_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      completions: {
        Row: {
          accuracy: number | null
          attempt_count: number | null
          completed: boolean | null
          created_at: string | null
          exercise_id: string
          id: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          attempt_count?: number | null
          completed?: boolean | null
          created_at?: string | null
          exercise_id: string
          id?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          attempt_count?: number | null
          completed?: boolean | null
          created_at?: string | null
          exercise_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      curricula: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          language: string
          level: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          language: string
          level: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          language?: string
          level?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      curriculum_nodes: {
        Row: {
          created_at: string
          curriculum_id: string
          description: string | null
          id: string
          min_accuracy_percentage: number
          min_completion_count: number
          name: string
          sequence_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          curriculum_id: string
          description?: string | null
          id?: string
          min_accuracy_percentage?: number
          min_completion_count?: number
          name: string
          sequence_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          curriculum_id?: string
          description?: string | null
          id?: string
          min_accuracy_percentage?: number
          min_completion_count?: number
          name?: string
          sequence_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_nodes_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      default_exercises: {
        Row: {
          audio_url: string | null
          created_at: string
          created_by: string | null
          id: string
          language: string
          level: string | null
          tags: string[] | null
          text: string
          title: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          language: string
          level?: string | null
          tags?: string[] | null
          text: string
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          language?: string
          level?: string | null
          tags?: string[] | null
          text?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      directories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "directories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "directories"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          archived: boolean | null
          audio_url: string | null
          completion_count: number | null
          created_at: string
          default_exercise_id: string | null
          directory_id: string | null
          id: string
          is_completed: boolean | null
          language: string
          tags: string[] | null
          text: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          audio_url?: string | null
          completion_count?: number | null
          created_at?: string
          default_exercise_id?: string | null
          directory_id?: string | null
          id?: string
          is_completed?: boolean | null
          language: string
          tags?: string[] | null
          text: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          audio_url?: string | null
          completion_count?: number | null
          created_at?: string
          default_exercise_id?: string | null
          directory_id?: string | null
          id?: string
          is_completed?: boolean | null
          language?: string
          tags?: string[] | null
          text?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_default_exercise_id_fkey"
            columns: ["default_exercise_id"]
            isOneToOne: false
            referencedRelation: "default_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "directories"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          message: string
          name: string
          read: boolean | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          message: string
          name: string
          read?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string
          name?: string
          read?: boolean | null
        }
        Relationships: []
      }
      known_words: {
        Row: {
          correct_count: number
          created_at: string
          first_seen_at: string
          id: string
          language: string
          last_reviewed_at: string
          mastery_level: number
          next_review_date: string | null
          review_count: number
          updated_at: string
          user_id: string
          word: string
        }
        Insert: {
          correct_count?: number
          created_at?: string
          first_seen_at?: string
          id?: string
          language: string
          last_reviewed_at?: string
          mastery_level?: number
          next_review_date?: string | null
          review_count?: number
          updated_at?: string
          user_id: string
          word: string
        }
        Update: {
          correct_count?: number
          created_at?: string
          first_seen_at?: string
          id?: string
          language?: string
          last_reviewed_at?: string
          mastery_level?: number
          next_review_date?: string | null
          review_count?: number
          updated_at?: string
          user_id?: string
          word?: string
        }
        Relationships: []
      }
      node_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          node_id: string
          sequence_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          node_id: string
          sequence_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          node_id?: string
          sequence_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "node_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "default_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_exercises_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "curriculum_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cancellation_email_sent: boolean
          created_at: string
          first_exercise_email_sent: boolean
          id: string
          learning_languages: string[]
          premium_email_sent: boolean
          reading_analyses_count: number
          selected_language: string
        }
        Insert: {
          avatar_url?: string | null
          cancellation_email_sent?: boolean
          created_at?: string
          first_exercise_email_sent?: boolean
          id: string
          learning_languages?: string[]
          premium_email_sent?: boolean
          reading_analyses_count?: number
          selected_language?: string
        }
        Update: {
          avatar_url?: string | null
          cancellation_email_sent?: boolean
          created_at?: string
          first_exercise_email_sent?: boolean
          id?: string
          learning_languages?: string[]
          premium_email_sent?: boolean
          reading_analyses_count?: number
          selected_language?: string
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          created_at: string
          discount_amount: number | null
          email: string
          id: string
          promo_code: string
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          email: string
          id?: string
          promo_code: string
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          email?: string
          id?: string
          promo_code?: string
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_percentage: number
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          uses: number
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_percentage: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          uses?: number
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          uses?: number
          valid_until?: string | null
        }
        Relationships: []
      }
      promotional_banners: {
        Row: {
          background_color: string | null
          banner_type: string | null
          button_text: string | null
          button_url: string | null
          content: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          is_active: boolean
          linked_promotion_app_id: string | null
          priority: number
          promo_code: string | null
          start_date: string | null
          target_route: string
          text_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          banner_type?: string | null
          button_text?: string | null
          button_url?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          linked_promotion_app_id?: string | null
          priority?: number
          promo_code?: string | null
          start_date?: string | null
          target_route?: string
          text_color?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          banner_type?: string | null
          button_text?: string | null
          button_url?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          linked_promotion_app_id?: string | null
          priority?: number
          promo_code?: string | null
          start_date?: string | null
          target_route?: string
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reading_analyses: {
        Row: {
          content: Json
          created_at: string
          exercise_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          exercise_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          exercise_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_analyses_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_exercise_progress: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string
          id: string
          last_sentence_index: number | null
          reading_exercise_id: string
          sentences_completed: number | null
          total_sentences: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          last_sentence_index?: number | null
          reading_exercise_id: string
          sentences_completed?: number | null
          total_sentences?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          last_sentence_index?: number | null
          reading_exercise_id?: string
          sentences_completed?: number | null
          total_sentences?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_exercise_progress_reading_exercise_id_fkey"
            columns: ["reading_exercise_id"]
            isOneToOne: false
            referencedRelation: "reading_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_exercise_sentences: {
        Row: {
          analysis: Json | null
          audio_url: string | null
          created_at: string
          id: string
          reading_exercise_id: string
          sentence_index: number
          text: string
        }
        Insert: {
          analysis?: Json | null
          audio_url?: string | null
          created_at?: string
          id?: string
          reading_exercise_id: string
          sentence_index: number
          text: string
        }
        Update: {
          analysis?: Json | null
          audio_url?: string | null
          created_at?: string
          id?: string
          reading_exercise_id?: string
          sentence_index?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_exercise_sentences_reading_exercise_id_fkey"
            columns: ["reading_exercise_id"]
            isOneToOne: false
            referencedRelation: "reading_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_exercises: {
        Row: {
          archived: boolean | null
          audio_generation_status: string | null
          audio_url: string | null
          content: Json
          created_at: string
          difficulty_level: string
          full_text_audio_url: string | null
          grammar_focus: string | null
          id: string
          language: string
          metadata: Json | null
          target_length: number
          title: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          audio_generation_status?: string | null
          audio_url?: string | null
          content: Json
          created_at?: string
          difficulty_level: string
          full_text_audio_url?: string | null
          grammar_focus?: string | null
          id?: string
          language: string
          metadata?: Json | null
          target_length?: number
          title: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          audio_generation_status?: string | null
          audio_url?: string | null
          content?: Json
          created_at?: string
          difficulty_level?: string
          full_text_audio_url?: string | null
          grammar_focus?: string | null
          id?: string
          language?: string
          metadata?: Json | null
          target_length?: number
          title?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string
          event_details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sentence_mining_exercises: {
        Row: {
          completed_at: string | null
          completion_time: number | null
          created_at: string
          difficulty_score: number
          exercise_type: string
          hints_used: number
          id: string
          is_correct: boolean | null
          sentence: string
          session_id: string
          target_words: string[]
          translation: string | null
          unknown_words: string[]
          user_response: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_time?: number | null
          created_at?: string
          difficulty_score?: number
          exercise_type: string
          hints_used?: number
          id?: string
          is_correct?: boolean | null
          sentence: string
          session_id: string
          target_words: string[]
          translation?: string | null
          unknown_words: string[]
          user_response?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_time?: number | null
          created_at?: string
          difficulty_score?: number
          exercise_type?: string
          hints_used?: number
          id?: string
          is_correct?: boolean | null
          sentence?: string
          session_id?: string
          target_words?: string[]
          translation?: string | null
          unknown_words?: string[]
          user_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sentence_mining_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sentence_mining_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sentence_mining_sessions: {
        Row: {
          completed_at: string | null
          correct_exercises: number
          created_at: string
          difficulty_level: string
          exercise_types: string[]
          id: string
          language: string
          new_words_encountered: number
          session_data: Json | null
          started_at: string
          total_exercises: number
          user_id: string
          words_mastered: number
        }
        Insert: {
          completed_at?: string | null
          correct_exercises?: number
          created_at?: string
          difficulty_level: string
          exercise_types: string[]
          id?: string
          language: string
          new_words_encountered?: number
          session_data?: Json | null
          started_at?: string
          total_exercises?: number
          user_id: string
          words_mastered?: number
        }
        Update: {
          completed_at?: string | null
          correct_exercises?: number
          created_at?: string
          difficulty_level?: string
          exercise_types?: string[]
          id?: string
          language?: string
          new_words_encountered?: number
          session_data?: Json | null
          started_at?: string
          total_exercises?: number
          user_id?: string
          words_mastered?: number
        }
        Relationships: []
      }
      shadowing_exercises: {
        Row: {
          archived: boolean | null
          created_at: string
          custom_text: string | null
          difficulty_level: string
          id: string
          language: string
          sentences: Json
          source_reading_exercise_id: string | null
          source_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          created_at?: string
          custom_text?: string | null
          difficulty_level: string
          id?: string
          language: string
          sentences?: Json
          source_reading_exercise_id?: string | null
          source_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          created_at?: string
          custom_text?: string | null
          difficulty_level?: string
          id?: string
          language?: string
          sentences?: Json
          source_reading_exercise_id?: string | null
          source_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shadowing_progress: {
        Row: {
          completed_sentences: number
          completion_percentage: number
          created_at: string
          current_sentence_index: number
          id: string
          last_practiced_at: string | null
          shadowing_exercise_id: string
          total_sentences: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_sentences?: number
          completion_percentage?: number
          created_at?: string
          current_sentence_index?: number
          id?: string
          last_practiced_at?: string | null
          shadowing_exercise_id: string
          total_sentences?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_sentences?: number
          completion_percentage?: number
          created_at?: string
          current_sentence_index?: number
          id?: string
          last_practiced_at?: string | null
          shadowing_exercise_id?: string
          total_sentences?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shadowing_progress_shadowing_exercise_id_fkey"
            columns: ["shadowing_exercise_id"]
            isOneToOne: false
            referencedRelation: "shadowing_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      shadowing_recordings: {
        Row: {
          created_at: string
          id: string
          recording_url: string
          sentence_index: number
          shadowing_exercise_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recording_url: string
          sentence_index: number
          shadowing_exercise_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recording_url?: string
          sentence_index?: number
          shadowing_exercise_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shadowing_recordings_shadowing_exercise_id_fkey"
            columns: ["shadowing_exercise_id"]
            isOneToOne: false
            referencedRelation: "shadowing_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_end: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_curricula: {
        Row: {
          completion_percentage: number
          created_at: string
          current_node_id: string | null
          curriculum_id: string
          enrollment_date: string
          id: string
          last_activity_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_percentage?: number
          created_at?: string
          current_node_id?: string | null
          curriculum_id: string
          enrollment_date?: string
          id?: string
          last_activity_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_percentage?: number
          created_at?: string
          current_node_id?: string | null
          curriculum_id?: string
          enrollment_date?: string
          id?: string
          last_activity_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_curricula_current_node_id_fkey"
            columns: ["current_node_id"]
            isOneToOne: false
            referencedRelation: "curriculum_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curricula_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_activities: {
        Row: {
          activity_count: number
          activity_date: string
          created_at: string
          exercises_completed: number
          id: string
          language: string
          updated_at: string
          user_id: string
          words_mastered: number
        }
        Insert: {
          activity_count?: number
          activity_date: string
          created_at?: string
          exercises_completed?: number
          id?: string
          language: string
          updated_at?: string
          user_id: string
          words_mastered?: number
        }
        Update: {
          activity_count?: number
          activity_date?: string
          created_at?: string
          exercises_completed?: number
          id?: string
          language?: string
          updated_at?: string
          user_id?: string
          words_mastered?: number
        }
        Relationships: []
      }
      user_exercise_attempts: {
        Row: {
          accuracy_percentage: number
          attempt_date: string
          completion_time: number | null
          created_at: string
          curriculum_id: string | null
          exercise_id: string
          id: string
          node_id: string | null
          user_id: string
        }
        Insert: {
          accuracy_percentage: number
          attempt_date?: string
          completion_time?: number | null
          created_at?: string
          curriculum_id?: string | null
          exercise_id: string
          id?: string
          node_id?: string | null
          user_id: string
        }
        Update: {
          accuracy_percentage?: number
          attempt_date?: string
          completion_time?: number | null
          created_at?: string
          curriculum_id?: string | null
          exercise_id?: string
          id?: string
          node_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_attempts_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "default_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exercise_attempts_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "curriculum_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_language_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          language: string
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          language: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          language?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          is_read: boolean
          message_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "admin_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_node_progress: {
        Row: {
          completed_exercise_count: number
          completion_date: string | null
          created_at: string
          curriculum_id: string
          highest_accuracy_achieved: number
          id: string
          node_id: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_exercise_count?: number
          completion_date?: string | null
          created_at?: string
          curriculum_id: string
          highest_accuracy_achieved?: number
          id?: string
          node_id: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_exercise_count?: number
          completion_date?: string | null
          created_at?: string
          curriculum_id?: string
          highest_accuracy_achieved?: number
          id?: string
          node_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_node_progress_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_node_progress_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "curriculum_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitors: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          page: string
          referer: string | null
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          page: string
          referer?: string | null
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          page?: string
          referer?: string | null
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      vocabulary: {
        Row: {
          audio_url: string | null
          created_at: string
          definition: string
          example_sentence: string
          exercise_id: string | null
          explanation: string | null
          id: string
          language: string
          user_id: string
          word: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          definition: string
          example_sentence: string
          exercise_id?: string | null
          explanation?: string | null
          id?: string
          language: string
          user_id: string
          word: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          definition?: string
          example_sentence?: string
          exercise_id?: string | null
          explanation?: string | null
          id?: string
          language?: string
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_curriculum_node: {
        Args: {
          curriculum_path_id_param: string
          title_param: string
          description_param: string
          position_param: number
          is_bonus_param: boolean
          default_exercise_id_param: string
        }
        Returns: string
      }
      add_curriculum_path: {
        Args: {
          language_param: string
          level_param: string
          description_param: string
        }
        Returns: string
      }
      calculate_next_review_date: {
        Args: { current_status: string }
        Returns: string
      }
      delete_curriculum_node: {
        Args: { node_id_param: string }
        Returns: undefined
      }
      delete_curriculum_path: {
        Args: { path_id_param: string }
        Returns: undefined
      }
      enroll_in_curriculum: {
        Args: { user_id_param: string; curriculum_id_param: string }
        Returns: string
      }
      extract_bidirectional_mastered_words: {
        Args: { exercise_id_param: string }
        Returns: undefined
      }
      extract_mastered_words: {
        Args: { exercise_id_param: string }
        Returns: undefined
      }
      get_active_banners_for_route: {
        Args: { route_param: string }
        Returns: {
          id: string
          title: string
          content: string
          button_text: string
          button_url: string
          background_color: string
          text_color: string
          banner_type: string
          priority: number
          promo_code: string
        }[]
      }
      get_available_curriculum_nodes: {
        Args: { user_id_param: string; curriculum_id_param: string }
        Returns: {
          id: string
          name: string
          description: string
          sequence_order: number
          status: string
        }[]
      }
      get_free_subscription_limits: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          exercise_count: number
          vocabulary_count: number
          bidirectional_count: number
          is_premium: boolean
        }[]
      }
      get_top_pages: {
        Args: { limit_count?: number }
        Returns: {
          page: string
          count: number
        }[]
      }
      get_top_referrers: {
        Args: { limit_count?: number }
        Returns: {
          name: string
          value: number
        }[]
      }
      get_user_bidirectional_exercise_count: {
        Args: { user_id_param: string; target_language_param: string }
        Returns: number
      }
      get_user_reading_exercise_count: {
        Args: { user_id_param: string; language_param: string }
        Returns: number
      }
      get_words_for_review: {
        Args: {
          user_id_param: string
          language_param: string
          limit_param?: number
        }
        Returns: {
          word: string
          mastery_level: number
          days_overdue: number
        }[]
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      increment_curriculum_node_completion: {
        Args: {
          node_id_param: string
          user_id_param: string
          language_param: string
          curriculum_path_id_param: string
        }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: {
          event_type: string
          event_details?: Json
          user_id_param?: string
        }
        Returns: undefined
      }
      record_curriculum_exercise_attempt: {
        Args: {
          user_id_param: string
          exercise_id_param: string
          node_id_param: string
          curriculum_id_param: string
          accuracy_param: number
          completion_time_param: number
        }
        Returns: undefined
      }
      record_language_activity: {
        Args: {
          user_id_param: string
          language_param: string
          activity_date_param: string
          exercises_completed_param?: number
          words_mastered_param?: number
        }
        Returns: undefined
      }
      set_admin_email: {
        Args: Record<PropertyKey, never> | { email: string }
        Returns: undefined
      }
      track_visitor: {
        Args: {
          visitor_id: string
          page: string
          referer: string
          user_agent: string
          ip_address: string
        }
        Returns: string
      }
      track_visitor_secure: {
        Args: {
          visitor_id_param: string
          page_param: string
          referer_param: string
          user_agent_param: string
          ip_address_param: string
        }
        Returns: string
      }
      update_curriculum_node: {
        Args: {
          node_id_param: string
          title_param: string
          description_param: string
          position_param: number
          is_bonus_param: boolean
          default_exercise_id_param: string
        }
        Returns: undefined
      }
      update_curriculum_path: {
        Args: {
          path_id_param: string
          language_param: string
          level_param: string
          description_param: string
        }
        Returns: undefined
      }
      update_reading_exercise_progress: {
        Args: {
          exercise_id_param: string
          user_id_param: string
          sentence_index_param: number
        }
        Returns: undefined
      }
      update_shadowing_progress: {
        Args: {
          exercise_id_param: string
          user_id_param: string
          sentence_index_param: number
          total_sentences_param: number
        }
        Returns: undefined
      }
      update_word_mastery: {
        Args: {
          user_id_param: string
          word_param: string
          language_param: string
          is_correct_param: boolean
        }
        Returns: undefined
      }
      validate_admin_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_input: {
        Args: { input_text: string; max_length?: number; allow_html?: boolean }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      language_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      language_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
    },
  },
} as const
