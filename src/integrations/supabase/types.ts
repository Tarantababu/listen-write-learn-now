export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_categories: {
        Row: {
          category_id: string
          created_at: string
          post_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          post_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          created_at: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
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
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
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
      onboarding_steps: {
        Row: {
          created_at: string
          description: string
          feature_area: string
          id: string
          is_active: boolean
          order_index: number
          position: string
          target_element: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          feature_area: string
          id?: string
          is_active?: boolean
          order_index: number
          position: string
          target_element: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          feature_area?: string
          id?: string
          is_active?: boolean
          order_index?: number
          position?: string
          target_element?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      user_onboarding_progress: {
        Row: {
          completed_onboarding: boolean
          created_at: string
          dismissed_until: string | null
          id: string
          last_step_seen: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_onboarding?: boolean
          created_at?: string
          dismissed_until?: string | null
          id?: string
          last_step_seen?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_onboarding?: boolean
          created_at?: string
          dismissed_until?: string | null
          id?: string
          last_step_seen?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
